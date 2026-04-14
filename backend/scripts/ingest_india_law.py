import os
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import json
import requests
import time
from datetime import datetime
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed

load_dotenv()

# --- CONFIGURATION ---
OLLAMA_URL = "http://host.docker.internal:11434/api/embeddings"
EMBEDDING_MODEL = "nomic-embed-text"
# Default to 5 workers for production stability, configurable via ENV
MAX_WORKERS = int(os.getenv("INGEST_MAX_WORKERS", 5)) 
BATCH_SIZE = 100
RETRY_ATTEMPTS = 3

def get_embedding_with_retry(text, row_index):
    """
    Generates embedding with a retry mechanism (Requirement 3).
    """
    payload = {"model": EMBEDDING_MODEL, "prompt": text.replace("\n", " ")}
    
    for attempt in range(RETRY_ATTEMPTS):
        try:
            response = requests.post(OLLAMA_URL, json=payload, timeout=60)
            response.raise_for_status()
            return response.json()["embedding"]
        except Exception as e:
            wait_time = (attempt + 1) * 2
            if attempt < RETRY_ATTEMPTS - 1:
                print(f"⚠️ Row {row_index}: Attempt {attempt + 1} failed. Retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                print(f"❌ Row {row_index}: Final embedding failure after {RETRY_ATTEMPTS} attempts: {e}")
                return None

def process_single_row(args):
    """
    Processes a single row: Cleaning -> Context Building -> Embedding.
    Args: (index, row_data)
    """
    index, row = args
    
    # 1. Strict Data Cleaning (Requirement 4)
    cleaned_row = {}
    for col in row.index:
        val = row[col]
        # Strip whitespace and handle N/A (Requirement 4)
        if pd.isna(val) or str(val).strip() == "":
            cleaned_row[col] = "N/A"
        else:
            cleaned_row[col] = str(val).strip()

    # Warning for empty header (Requirement 4)
    if cleaned_row.get("Compliance Header") == "N/A":
        print(f"⚠️ Warning: Row {index} has an empty Compliance Header. Skipping precision weighting.")

    # 2. Preserve Search Text Logic (Requirement 1)
    header = cleaned_row.get('Compliance Header', 'N/A')
    sub_cat = cleaned_row.get('Sub Category', 'N/A')
    keywords = "registration threshold number of workers principal employer contractor license restroom canteen first aid facility compliance statutory"
    
    precision_search_text = (
        f"TOPIC: {header}\n"
        f"CATEGORY: {sub_cat}\n"
        f"KEYWORDS: {keywords}\n"
        f"APPLICABILITY: {cleaned_row.get('Applicability', 'N/A')}\n"
        f"REQUIREMENT: {cleaned_row.get('Compliance Description', 'N/A')}\n"
        f"PENALTY: {cleaned_row.get('Penalty Description ', 'N/A')}\n"
        f"PROVISIONS: {cleaned_row.get('Compliance/ Statutory Provisions', 'N/A')}\n"
        f"ACT: {cleaned_row.get('Name of Mother Act', 'N/A')}"
    )

    # 3. Embedding Generation
    vector = get_embedding_with_retry(precision_search_text, index)
    
    if vector:
        # Return tuple in order of Database Schema (Requirement 1)
        return (
            cleaned_row.get('Category', 'General'),
            cleaned_row.get('Central/Federal/State*', 'Central'),
            precision_search_text,
            vector,
            json.dumps(cleaned_row),
            "india_law_listing.csv",
            cleaned_row.get('Critical? *', 'Medium'),
            sub_cat
        )
    return None

def connect_db():
    return psycopg2.connect(
        host=os.getenv("POSTGRES_SERVER"),
        database=os.getenv("POSTGRES_DB"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
        port=os.getenv("POSTGRES_PORT")
    )

def ingest_data(file_path):
    start_time = time.time()
    print(f"🚀 INGESTION START: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📦 Mode: Parallel | Workers: {MAX_WORKERS} | Batch Size: {BATCH_SIZE}")
    
    if not os.path.exists(file_path):
        print(f"🔥 FATAL ERROR: CSV not found at {file_path}")
        return

    df = pd.read_csv(file_path)
    total_rows = len(df)
    total_inserted = 0
    total_failed = 0

    conn = connect_db()
    cur = conn.cursor()

    # Convert dataframe to list of tuples for the executor
    row_data = list(df.iterrows())

    # Process in batches (Requirement 5)
    for i in range(0, total_rows, BATCH_SIZE):
        batch = row_data[i : i + BATCH_SIZE]
        batch_results = []

        # Parallel Execution within the batch
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            future_to_row = {executor.submit(process_single_row, row): row for row in batch}
            for future in as_completed(future_to_row):
                result = future.result()
                if result:
                    batch_results.append(result)
                else:
                    total_failed += 1

        # Batch Insert (Requirement 5)
        if batch_results:
            try:
                execute_values(cur, """
                    INSERT INTO compliance_records 
                    (category, state_region, combined_content, embedding, metadata, source_file, criticality, sub_category)
                    VALUES %s
                """, batch_results)
                conn.commit()
                total_inserted += len(batch_results)
                print(f"📦 Progress: {min(i + BATCH_SIZE, total_rows)}/{total_rows} processed. (Success: {total_inserted}, Fail: {total_failed})")
            except Exception as e:
                conn.rollback()
                print(f"🔥 Batch Insert Failed at row {i}: {e}")

    # Final Integrity Check (Requirement 8)
    cur.execute("SELECT count(*) FROM compliance_records;")
    db_count = cur.fetchone()[0]
    
    cur.close(); conn.close()
    
    end_time = time.time()
    duration = round((end_time - start_time) / 60, 2)

    print("\n" + "="*50)
    print(f"🎯 INGESTION COMPLETE")
    print(f"⏱️ Total Time: {duration} minutes")
    print(f"📊 CSV Rows: {total_rows}")
    print(f"✅ Successfully Inserted: {total_inserted}")
    print(f"❌ Failed Rows: {total_failed}")
    print(f"🔍 Database Record Count: {db_count}")
    
    if total_inserted == total_rows:
        print("🎉 INTEGRITY CHECK PASSED: All rows accounted for.")
    else:
        print(f"⚠️ INTEGRITY CHECK WARNING: Mismatch of {total_rows - total_inserted} rows.")
    print("="*50)

if __name__ == "__main__":
    CSV_PATH = "/app/data/india_law_listing.csv" 
    ingest_data(CSV_PATH)
