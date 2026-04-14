from app.config.settings import (
    EMBEDDING_MODEL,
    AZURE_DEPLOYMENT,
    AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_API_VERSION
)
from app.cache.embedding_cache import (
    get_cached_embedding,
    store_embedding
)
from app.logging.query_logger import log_query_event
from app.logging.performance_logger import log_performance_metrics
import os
import httpx
import logging
import psycopg2
import json
import re
import time
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.documents import Document
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# --- 1. SAFE RESPONSE & FINAL SOURCE SCRUBBER (Preserved Safety) ---

def safe_no_data_response(reason: str = "No compliance records found for the requested region."):
    return {"answer": reason, "sources": []}

def scrub_sources_final(answer: str, sources: list):
    answer_lower = answer.lower()
    no_data_markers = [
        "no compliance records found", "i have no data", "no records found",
        "do not have information", "information not present", "not specifying"
    ]
    if any(marker in answer_lower for marker in no_data_markers):
        return []
    return sources

# --- 2. DYNAMIC GEOGRAPHY VALIDATION (Preserved Safety) ---

def get_dynamic_valid_regions():
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT TRIM(state_region) FROM compliance_records WHERE state_region IS NOT NULL")
        regions = [row[0].lower() for row in cur.fetchall()]
        cur.close(); conn.close()
        return set(regions)
    except Exception as e:
        logger.error(f"Failed to fetch regions: {e}")
        return set()

def detect_unsupported_geography(query: str):
    print("DEBUG: detect_unsupported_geography CALLED")
    print("DEBUG: Query received:", query)
    valid_regions = get_dynamic_valid_regions()
    if not valid_regions: return False
    words = set(re.findall(r"\b[A-Za-z0-9\-]+\b", query.lower()))
    global_blocklist = {
        "germany", "france", "usa", "uk", "china", "russia", "italy", 
        "uae", "america", "atlantis", "dubai", "sharjah", "sydney", "london", "ireland"
    }
    if not words.isdisjoint(global_blocklist):
        return True
    match = re.search(r"\bin\s+([A-Za-z\-]+)", query, re.IGNORECASE)
    if match:
        location_candidate = match.group(1).lower()
        print("DEBUG: Detected location candidate:", location_candidate)
        ignore_words = {
        "our", "the", "this", "that",
        "an", "a", "any", "my",
        "your", "their"
        }

        if location_candidate in ignore_words:
            print("DEBUG: Ignoring non-location word:", location_candidate)
            return False

        if location_candidate not in valid_regions:
            print("DEBUG: Location NOT in valid regions:", location_candidate)
            return True

    return False

# --- 3. AI & PROXY INIT ---
def get_aperture_client():
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    return httpx.Client(
        headers={"Authorization": f"Bearer {api_key}", "X-API-Key": api_key, "Content-Type": "application/json"},
        timeout=httpx.Timeout(60.0)
    )

# Safely updated to use config variables from app/config/settings.py
llm = ChatOpenAI(
    base_url=f"{AZURE_OPENAI_ENDPOINT}/deployments/{AZURE_DEPLOYMENT}",
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    model=AZURE_DEPLOYMENT,
    temperature=0,
    http_client=get_aperture_client(),
    model_kwargs={"extra_query": {"api-version": AZURE_OPENAI_API_VERSION}}
)

# --- HELPER FUNCTION: LOAD SYSTEM PROMPT ---

def load_system_prompt():
    """Reads the system prompt from a text file."""
    prompt_path = "app/prompts/extraction_prompt.txt"
    try:
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        logger.error(f"Failed to load system prompt from {prompt_path}: {e}")
        return ""

# --- 4. STRUCTURED EXTRACTION RAG LOGIC ---

def get_compliance_response(user_query: str, filters: dict = None, prev_response: str = None, retrieve_all: bool = False):
    # --- START RESPONSE TIME MEASUREMENT ---
    start_time = time.time()
    
    # Initialize component timers to 0.0 for safety in early return paths
    embedding_time = 0.0
    sql_time = 0.0
    llm_time = 0.0
    
    try:
        print("\n===== DEBUG START =====")
        print("DEBUG: ENTERED get_compliance_response")
        print("DEBUG: USER QUERY:", user_query)
        print("DEBUG: FILTERS:", filters)

        # STEP 1: SAFETY GATE (Preserved)
        query_lower = user_query.lower()
        geo_keywords = [" in ", " at ", " from ", " within "]
        has_geo_phrase = any(keyword in query_lower for keyword in geo_keywords)
        has_filter_region= False
        if filters:
            has_filter_region = (filters.get("country") is not None or filters.get("state_region") is not None)
            print("DEBUG: has_geo_phrase =", has_geo_phrase)
            print("DEBUG: has_filter_region =", has_filter_region)


        # Run geography validation ONLY when:
        # 1. Query explicitly mentions geography
        # OR
        # 2. No geography exists in filters

        if has_geo_phrase or not has_filter_region:
            print("DEBUG: Running detected unsupported geography validation")
            if detect_unsupported_geography(user_query):
                print("DEBUG:geography blocked")
                # --- LOG GEOGRAPHY BLOCKED EVENT ---
                total_time = time.time() - start_time
                log_query_event(query=user_query, filters=filters, result_count=0, response_time=total_time)
                log_performance_metrics(user_query, embedding_time, sql_time, llm_time, total_time)
                return safe_no_data_response()


        # FOLLOW-UP MEMORY LOGIC (Preserved from NEW)
        point_match = re.search(r'point\s*(number)?\s*(\d+)', user_query.lower())
        if point_match:
            if not prev_response:
                # --- LOG FAILED MEMORY ACCESS ---
                total_time = time.time() - start_time
                log_query_event(query=user_query, filters=filters, result_count=0, response_time=total_time)
                log_performance_metrics(user_query, embedding_time, sql_time, llm_time, total_time)
                return safe_no_data_response("Requested point not found in previous response.")
            
            full_blocks = re.findall(r"(\d+\.\s*Requirement:.*?----------------------------------------)", prev_response, re.DOTALL)
            
            point_number = int(point_match.group(2))
            if 1 <= point_number <= len(full_blocks):
                logger.info(f"🔄 Memory Routing: correctly parsing block {point_number}")
                selected_block = full_blocks[point_number - 1].strip()
                # --- LOG SUCCESSFUL MEMORY ROUTING ---
                total_time = time.time() - start_time
                log_query_event(query=user_query, filters=filters, result_count=1, response_time=total_time)
                log_performance_metrics(user_query, embedding_time, sql_time, llm_time, total_time)
                return {"answer": selected_block, "sources": []}
            else:
                # --- LOG INVALID POINT SELECTION ---
                total_time = time.time() - start_time
                log_query_event(query=user_query, filters=filters, result_count=0, response_time=total_time)
                log_performance_metrics(user_query, embedding_time, sql_time, llm_time, total_time)
                return safe_no_data_response("Requested point not found in previous response.")

        # --- RESTORED RETRIEVAL LIMIT LOGIC (From OLD) ---
        query_asks_for_list = any(word in user_query.lower() for word in ["all", "list", "requirements"])
        retrieval_limit = 50 if (retrieve_all or query_asks_for_list) else 3
        
        processed_query = user_query
        if prev_response and any(kw in user_query.lower() for kw in ["explain", "detail", "clarify", "above"]):
            processed_query = f"Prev Context: {prev_response}\nFollow-up: {user_query}"

        # Embedding
        url = "http://host.docker.internal:11434/api/embeddings"
        
        # --- NORMALIZE QUERY FOR CACHE ---
        normalized_query = processed_query.strip().lower()

        # --- START EMBEDDING TIMER ---
        embedding_start = time.time()
        cached_vector = get_cached_embedding(normalized_query)

        if cached_vector:
            print("DEBUG: Using cached embedding")
            query_vector = cached_vector
        else:
            print("DEBUG: Creating new embedding")

            resp = httpx.post(
                url,
                json={"model": EMBEDDING_MODEL, "prompt": processed_query},
                timeout=30.0
            )

            query_vector = resp.json()["embedding"]

            # Store normalized version
            store_embedding(normalized_query, query_vector)
        
        # --- END EMBEDDING TIMER ---
        embedding_time = time.time() - embedding_start

        # --- START SQL TIMER ---
        sql_start = time.time()
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
        fallback_levels = [
            filters or {},
            {k: v for k, v in (filters or {}).items() if k != 'criticality'},
            {k: v for k, v in (filters or {}).items() if k not in ['criticality', 'sub_category']},
            {k: v for k, v in (filters or {}).items() if k in ['country', 'state_region']}
        ]

        results = []
        for current_filters in fallback_levels:
            where, params = [], []
            for k, v in current_filters.items():
                if v and v not in ["All", "All States"]:
                    where.append(f"{k} = %s")
                    params.append(v)
            
            # Use exact SQL structure from OLD file
            sql = "SELECT combined_content, metadata FROM compliance_records"
            if where: 
                sql += " WHERE " + " AND ".join(where)
            
            sql += " ORDER BY embedding <=> %s::vector LIMIT 10"
            params.append(query_vector)

            cur.execute(sql, params)
            results = cur.fetchall()
            print("DEBUG: SQL results count:", len(results))

            if results: break
        cur.close(); conn.close()
        
        # --- END SQL TIMER ---
        sql_time = time.time() - sql_start

        if not results:
            # --- LOG EMPTY SEARCH RESULT ---
            total_time = time.time() - start_time
            log_query_event(query=user_query, filters=filters, result_count=0, response_time=total_time)
            log_performance_metrics(user_query, embedding_time, sql_time, llm_time, total_time)
            return safe_no_data_response()

        # RERANKING ENGINE (Preserved from NEW)
        target_keywords = ["registration", "license", "certificate", "restroom", "canteen", "welfare", "inspection", "penalty", "records", "register", "contractor", "facilities", "compliance"]
        scored_results = []
        user_query_lower = user_query.lower()
        for content, meta_json in results:
            meta = meta_json if isinstance(meta_json, dict) else json.loads(meta_json)
            meta = {k.strip(): v for k, v in meta.items()} 
            boost = 0
            header = meta.get("Compliance Header", "").lower()
            for kw in target_keywords:
                if kw in user_query_lower and kw in header: boost += 10
            scored_results.append((content, meta, boost))

        sorted_results = sorted(scored_results, key=lambda x: x[2], reverse=True)[:retrieval_limit]

        # --- RESTORED CONTEXT BUILDER (From OLD) ---
        docs = []
        seen = set()
        for content, m, boost in sorted_results:
            h = m.get('Compliance Header', 'N/A')
            if h not in seen:
                seen.add(h)
                context_text = f"""
Compliance Header: {h}
Name of Mother Act:
{m.get('Name of Mother Act', 'N/A')}

Name of Rules:
{m.get('Name of Rules', 'N/A')}

Compliance/ Statutory Provisions:
{m.get('Compliance/ Statutory Provisions', 'N/A')}

Category:
{m.get('Category', 'N/A')}

Sub Category:
{m.get('Sub Category', 'N/A')}

Applicability:
{m.get('Applicability', 'N/A')}

Penalty Description:
{m.get('Penalty Description', 'N/A')}

Compliance Description:
{m.get('Compliance Description', 'N/A')}
"""
                docs.append(Document(page_content=context_text.strip(), metadata=m))

        primary_header = sorted_results[0][1].get('Compliance Header', 'N/A')

        # --- SAFE UPDATE: LOAD SYSTEM PROMPT FROM FILE WITH FALLBACK ---
        file_prompt = load_system_prompt()
        if file_prompt:
            system_prompt = file_prompt.replace("{primary_header}", primary_header)
        else:
            # Fallback to existing hardcoded prompt if file load fails
            system_prompt = (
                "You are a Legal Compliance Extraction Engine.\n\n"
                "Your task is to extract structured compliance requirements from context. "
                "Use literal values ONLY. Do NOT invent data.\n\n"
                "STRICT FORMATTING:\n"
                "1. Double line breaks between sections.\n"
                "2. Line break after every label.\n"
                "3. Separator '----------------------------------------' between records.\n"
                "4. Convert numbered clauses into bullet points (•).\n\n"
                "OUTPUT FORMAT:\n\n"
                "EXECUTIVE SUMMARY:\n"
                f"{primary_header}\n\n"
                "KEY REQUIREMENTS:\n\n"
                "[Number].\nRequirement:\n[Compliance Header]\n\n"
                "Applicability:\n[Applicability]\n\n"
                "Penalty:\n[Penalty Description]\n\n"
                "Compliance Details:\n[Compliance Description]\n\n"
                "Legal Basis:\nAct: [Name of Mother Act]\nRules: [Name of Rules]\nProvision: [Compliance/ Statutory Provisions]\n\n"
                "Classification:\nCategory: [Category]\nSub Category: [Sub Category]\n"
                "------------------------------------------------\n\n"
                "Important Rules:\n"
                "- EXECUTIVE SUMMARY must appear only once at the top.\n"
                "- KEY REQUIREMENTS must appear only once.\n"
                "- Always number requirements sequentially (1,2,3...).\n"
                "- Do NOT restart numbering.\n"
                "- Do NOT repeat EXECUTIVE SUMMARY for each requirement.\n"
                "- Use only literal dataset values.\n"
                "- Do NOT add narrative explanations or advice.\n"
                "- Repeat the first Compliance Header exactly for the Executive Summary."
            )

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "User Query:\n{input}\n\nContext:\n{context}")
        ])

        # --- START LLM TIMER ---
        llm_start = time.time()
        chain = create_stuff_documents_chain(llm, prompt)
        response_text = chain.invoke({"input": user_query, "context": docs})
        llm_time = time.time() - llm_start

        # --- LOG THE QUERY AND PERFORMANCE EVENTS ---
        total_time = time.time() - start_time
        log_query_event(query=user_query, filters=filters, result_count=len(docs), response_time=total_time)
        log_performance_metrics(user_query, embedding_time, sql_time, llm_time, total_time)

        return {"answer": response_text, "sources": scrub_sources_final(response_text, [d.metadata for d in docs])}

    except Exception as e:
        logger.error(f"🔥 RAG Failure: {e}")
        # --- LOG SYSTEM EXCEPTION EVENT ---
        total_time = time.time() - start_time
        log_query_event(query=user_query, filters=filters, result_count=0, response_time=total_time)
        log_performance_metrics(user_query, embedding_time, sql_time, llm_time, total_time)
        return safe_no_data_response("A system error occurred.")
