# WhatsApp Ordering — Python / FastAPI / Supabase

A Node.js-free application runtime built with FastAPI, Jinja2, vanilla JavaScript and Supabase.

## Features
- Public catalogue with category filters/search
- Browser cart
- Delivery or pickup checkout
- Server-side price validation (browser prices are never trusted)
- Delivery fee / free-delivery threshold
- Order stored in Supabase
- WhatsApp pre-filled order handoff
- Admin email/password login through Supabase Auth
- Admin orders/status management
- Catalogue CRUD and availability toggle
- Shop settings management
- Production-oriented RLS: orders are not publicly readable

## 1. Database
Open Supabase > SQL Editor and run `supabase/schema.sql`.

## 2. Create the owner
In Supabase > Authentication > Users, create an email/password user.

## 3. Environment file
Copy `.env.example` to `.env` (or `.env.local`; the app accepts either) in the project root.

IMPORTANT: `SUPABASE_URL` must be the project root:
`https://YOUR_PROJECT.supabase.co`
Do NOT append `/rest/v1/`.

Never commit your secret/service-role key.

## 4. Run locally on Windows PowerShell
```powershell
cd C:\path\to\whatsapp-ordering-python
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn api.index:app --reload
```

Open http://127.0.0.1:8000

Admin: http://127.0.0.1:8000/admin/login

If PowerShell blocks activation, you can skip activation:
```powershell
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m uvicorn api.index:app --reload
```

## 5. Deploy to Vercel
1. Push this folder to GitHub.
2. Import the repository into Vercel.
3. Add these Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_SECRET`
4. Deploy.

The included `vercel.json` sends requests to the FastAPI ASGI app in `api/index.py`.

## Security
The public browser never receives the Supabase secret/service-role key. Public order creation is performed by the FastAPI backend. The backend re-reads catalogue prices and shop settings before calculating totals. Admin writes require an authenticated admin session.
