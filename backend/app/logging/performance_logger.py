import csv
import os
from datetime import datetime

# --- CONFIGURATION ---
PERF_LOG_FILE = "performance_logs.csv"

def log_performance_metrics(
    query: str,
    embedding_time: float,
    sql_time: float,
    llm_time: float,
    total_time: float
):
    """
    Logs granular performance timing metrics for the RAG pipeline stages.
    Enables bottleneck identification in production environments.
    """
    
    # Define CSV column headers
    headers = [
        "timestamp", 
        "query", 
        "embedding_time_seconds", 
        "sql_time_seconds", 
        "llm_time_seconds", 
        "total_time_seconds"
    ]

    # Check existence to handle header writing
    file_exists = os.path.exists(PERF_LOG_FILE)

    try:
        # Open in append mode ('a') to preserve previous data
        with open(PERF_LOG_FILE, mode='a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            # Write header only if the file is being created for the first time
            if not file_exists:
                writer.writerow(headers)

            # Write metrics row with values rounded to 4 decimal places
            writer.writerow([
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                query,
                round(embedding_time, 4),
                round(sql_time, 4),
                round(llm_time, 4),
                round(total_time, 4)
            ])
            
    except Exception as e:
        # Safety requirement: Log error to console but do not crash the RAG system
        print(f"CRITICAL: Failed to write to {PERF_LOG_FILE}: {e}")
