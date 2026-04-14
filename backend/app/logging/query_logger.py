import csv
import os
from datetime import datetime

# --- CONFIGURATION ---
LOG_FILE = "query_logs.csv"

def log_query_event(
    query: str,
    filters: dict,
    result_count: int,
    response_time: float
):
    """
    Logs RAG query events into a local CSV file for performance monitoring.
    Uses standard Python libraries to ensure zero dependencies.
    """
    
    # Define CSV headers
    headers = [
        "timestamp", 
        "query", 
        "filters", 
        "result_count", 
        "response_time_seconds"
    ]

    # Check if file exists to determine if we need to write headers
    file_exists = os.path.exists(LOG_FILE)

    try:
        # Open in append mode ('a')
        with open(LOG_FILE, mode='a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            # Write header only if creating a new file
            if not file_exists:
                writer.writerow(headers)

            # Record entry
            writer.writerow([
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                query,
                str(filters),  # String representation of the filter dictionary
                result_count,
                round(response_time, 4)
            ])
            
    except Exception as e:
        # In a production environment, we print to console if logging fails 
        # to avoid crashing the main application flow.
        print(f"CRITICAL: Failed to log query event to {LOG_FILE}: {e}")
