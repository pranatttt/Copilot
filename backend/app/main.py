import os
import logging
import psycopg2
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any, List
from .rag_engine import get_compliance_response, safe_no_data_response
from .schemas import ChatRequest, HistoryItem, FeedbackCreate, FeedbackItem 

# --- 1. PRODUCTION LOGGING ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(title="EY Compliance Navigator - Audit Grade")

# --- 2. CORS CONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 3. DYNAMIC DISCOVERY ENDPOINTS ---

@app.get("/api/v1/metadata")
async def get_dynamic_metadata():
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
        
        cur.execute("SELECT DISTINCT TRIM(country) FROM compliance_records WHERE country IS NOT NULL ORDER BY 1")
        countries = [row[0] for row in cur.fetchall()]

        cur.execute("SELECT DISTINCT TRIM(state_region) FROM compliance_records WHERE state_region IS NOT NULL ORDER BY 1")
        regions = [row[0] for row in cur.fetchall()]
        
        cur.execute("SELECT DISTINCT TRIM(category) FROM compliance_records WHERE category IS NOT NULL ORDER BY 1")
        categories = [row[0] for row in cur.fetchall()]

        cur.execute("SELECT DISTINCT TRIM(sub_category) FROM compliance_records WHERE sub_category IS NOT NULL AND sub_category != '' ORDER BY 1")
        sub_categories = [row[0] for row in cur.fetchall()]

        cur.execute("SELECT DISTINCT TRIM(criticality) FROM compliance_records WHERE criticality IS NOT NULL ORDER BY 1")
        criticality_levels = [row[0] for row in cur.fetchall()]
        
        cur.close(); conn.close()
        
        return {
            "countries": countries,
            "regions": regions, 
            "categories": categories,
            "sub_categories": sub_categories,
            "criticality": criticality_levels
        }
    except Exception as e:
        logger.error(f"❌ Metadata Sync Error: {str(e)}")
        return {"countries": ["India"], "regions": [], "categories": ["All"]}

# --- 4. PERSISTENT HISTORY ENDPOINT (Fixed for Feedback Link) ---

@app.get("/api/v1/history/{session_id}", response_model=List[HistoryItem])
async def get_chat_history(session_id: str):
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
        
        # FIX: Added 'user_query' to the SELECT statement
        cur.execute("""
            SELECT role, content, sources, created_at, user_query 
            FROM chat_messages 
            WHERE session_id = %s 
            ORDER BY created_at ASC
        """, (session_id,))
        
        rows = cur.fetchall()
        history = []
        for row in rows:
            history.append({
                "role": row[0],
                "content": row[1],
                "sources": row[2] if isinstance(row[2], list) else json.loads(row[2]),
                "created_at": row[3],
                "user_query": row[4] # FIX: Map user_query back to schema
            })
            
        cur.close(); conn.close()
        return history
    except Exception as e:
        logger.error(f"❌ Failed to fetch history: {e}")
        return []

# --- 5. FEEDBACK SYSTEM ENDPOINTS ---

@app.post("/api/v1/feedback")
async def submit_feedback(feedback: FeedbackCreate):
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO chat_feedback (session_id, query_text, response_text, remark)
            VALUES (%s, %s, %s, %s)
        """, (feedback.session_id, feedback.query_text, feedback.response_text, feedback.remark))
        conn.commit()
        cur.close(); conn.close()
        return {"message": "Feedback submitted successfully."}
    except Exception as e:
        logger.error(f"❌ Feedback Submission Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to save feedback.")

@app.get("/api/v1/feedback", response_model=List[FeedbackItem])
async def get_feedback(query_text: str, response_text: str):
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
        cur.execute("""
            SELECT id, remark, created_at 
            FROM chat_feedback 
            WHERE query_text = %s AND response_text = %s 
            ORDER BY created_at ASC
        """, (query_text, response_text))
        rows = cur.fetchall()
        feedback_list = [{"id": r[0], "remark": r[1], "created_at": r[2]} for r in rows]
        cur.close(); conn.close()
        return feedback_list
    except Exception as e:
        logger.error(f"❌ Feedback Retrieval Error: {e}")
        return []

# --- 6. CHAT GATEWAY (Fixed for Auto-Save with query link) ---

@app.post("/api/v1/chat")
async def chat_endpoint(request: ChatRequest):
    if not request.query.strip():
         return safe_no_data_response("Please enter a valid query.")

    retrieve_all = "all" in request.query.lower()
    
    try:
        result = get_compliance_response(
            user_query=request.query, 
            filters=request.filters,
            prev_response=request.previous_response,
            retrieve_all=retrieve_all
        )
        
        try:
            conn = psycopg2.connect(os.getenv("DATABASE_URL"))
            cur = conn.cursor()
            
            # 1. Save User Question
            cur.execute("INSERT INTO chat_messages (session_id, role, content) VALUES (%s, %s, %s)", 
                       (request.session_id, 'user', request.query))
            
            # 2. Save Assistant Answer (FIX: Link original user_query to this row)
            cur.execute("""
                INSERT INTO chat_messages (session_id, role, content, user_query, sources) 
                VALUES (%s, %s, %s, %s, %s)
            """, (request.session_id, 'assistant', result["answer"], request.query, json.dumps(result["sources"])))
            
            # 3. Save Audit Log
            cur.execute("""
                INSERT INTO audit_logs (user_query, bot_response, metadata_filters_used)
                VALUES (%s, %s, %s)
            """, (request.query, result["answer"], json.dumps(request.filters)))
            
            conn.commit()
            cur.close(); conn.close()
        except Exception as db_err:
            logger.error(f"⚠️ Failed to save message to history/audit: {db_err}")

        return result
        
    except Exception as e:
        logger.error(f"🔥 Backend Failure: {str(e)}")
        return safe_no_data_response(f"Compliance Engine Error: {str(e)}")

@app.get("/health")
def health():
    return {"status": "online"}
