# backend/test_retrieval.py
from app.rag_engine import get_compliance_response
import os

def run_test_query():
    print("🧪 TESTING BACKEND RETRIEVAL PIPELINE...")
    
    # Simulate the UI sending a question with filters
    test_query = "What facilities must be provided for contract workers?"
    test_filters = {"state_region": "Delhi", "category": "Employment"}
    
    print(f"Question: {test_query}")
    print(f"Filters Active: {test_filters}")
    
    try:
        result = get_compliance_response(test_query, test_filters)
        
        print("\n--- AI RESPONSE ---")
        print(result["answer"])
        
        print("\n--- SOURCES FOUND ---")
        for i, source in enumerate(result["sources"]):
            print(f"[{i+1}] {source.get('mother_act')} - {source.get('statutory_provisions')}")
            
    except Exception as e:
        print(f"❌ TEST FAILED: {str(e)}")

if __name__ == "__main__":
    run_test_query()
