from dotenv import load_dotenv
from supabase import create_client
import os

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_PUBLISHABLE_KEY")

print("Supabase URL:", url)
print("Publishable key loaded:", bool(key))

if not url:
    raise Exception("SUPABASE_URL is missing from .env")

if not key:
    raise Exception("SUPABASE_PUBLISHABLE_KEY is missing from .env")

s = create_client(url, key)

result = s.table("settings").select("*").execute()

print("SUCCESS - Connected to Supabase")
print(result.data)