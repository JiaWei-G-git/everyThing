import requests, os, json
from dotenv import load_dotenv
load_dotenv()

base = os.getenv('LLM_BASE_URL') + '/chat/completions'
key = os.getenv('LLM_API_KEY')
model = os.getenv('LLM_MODEL')

headers = {'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'}
payload = {'model': model, 'messages': [{'role': 'user', 'content': 'Say hi'}], 'temperature': 0.3, 'max_tokens': 20}
resp = requests.post(base, headers=headers, json=payload, timeout=120)
print('Status:', resp.status_code)
print('Body:', json.dumps(resp.json(), indent=2, ensure_ascii=False).encode('ascii', 'replace').decode('ascii'))
