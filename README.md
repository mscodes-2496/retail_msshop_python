# WhatsApp Ordering – Production Bundle

## Local
1. Copy `.env.example` to `.env` and fill values.
2. Use Python 3.12 or 3.13 (recommended).
3. `python -m venv .venv`
4. `.venv\Scripts\python.exe -m pip install -r requirements.txt`
5. Run `supabase/schema.sql` once in Supabase SQL editor.
6. Create the owner in Supabase Authentication > Users.
7. `.venv\Scripts\python.exe -m uvicorn app:app --reload`
8. Store: http://127.0.0.1:8000/ ; Admin: http://127.0.0.1:8000/admin/login

Static files are intentionally included at `static/css/admin.css`, `static/css/store.css`, and `static/js/store.js`.

## Vercel
Set the four secrets in Project Settings > Environment Variables. Set `COOKIE_SECURE=1` in production. Do not commit `.env`. Root-level `app.py` is Vercel-compatible.
