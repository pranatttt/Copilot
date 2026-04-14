import os
import httpx
from dotenv import load_dotenv

load_dotenv()

def test_aperture():
    url = f"{os.getenv('AZURE_OPENAI_ENDPOINT')}/deployments/{os.getenv('AZURE_OPENAI_DEPLOYMENT_NAME')}/chat/completions?api-version={os.getenv('AZURE_OPENAI_API_VERSION')}"
    
    headers = {
        "Authorization": f"Bearer {os.getenv('AZURE_OPENAI_API_KEY')}",
        "X-API-Key": os.getenv("AZURE_OPENAI_API_KEY"),
        "Content-Type": "application/json"
    }
    
    payload = {
        "messages": [{"role": "user", "content": "Hello, this is a test from the Compliance Agent."}],
        "max_tokens": 10
    }

    print(f"📡 Sending test to: {url}")
    response = httpx.post(url, headers=headers, json=payload, timeout=30.0)
    
    if response.status_code == 200:
        print("✅ SUCCESS! Proxy is routing correctly.")
        print(f"Response: {response.json()['choices'][0]['message']['content']}")
    else:
        print(f"❌ FAILED: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    test_aperture()
