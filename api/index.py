import os, re
from decimal import Decimal
from pathlib import Path
from urllib.parse import quote
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware
from supabase import create_client, Client

BASE = Path(__file__).resolve().parent.parent
load_dotenv(BASE / ".env")
load_dotenv(BASE / ".env.local")

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
PUBLISHABLE = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SESSION_SECRET = os.getenv("SESSION_SECRET", "change-me-before-production")

if SUPABASE_URL.endswith("/rest/v1"):
    SUPABASE_URL = SUPABASE_URL[:-8]

app = FastAPI(title="WhatsApp Ordering")
app.add_middleware(SessionMiddleware, secret_key=SESSION_SECRET, same_site="lax", https_only=False)
app.mount("/static", StaticFiles(directory=str(BASE / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE / "templates"))

def service() -> Client:
    if not SUPABASE_URL or not SERVICE_KEY:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    return create_client(SUPABASE_URL, SERVICE_KEY)

def public() -> Client:
    if not SUPABASE_URL or not PUBLISHABLE:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY")
    return create_client(SUPABASE_URL, PUBLISHABLE)

def money(v):
    return Decimal(str(v or 0))

def require_admin(request: Request):
    if not request.session.get("access_token"):
        raise HTTPException(status_code=401, detail="Login required")

def admin_client(request: Request) -> Client:
    require_admin(request)
    c = create_client(SUPABASE_URL, PUBLISHABLE)
    c.auth.set_session(request.session["access_token"], request.session["refresh_token"])
    return c

@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    try:
        s = public()
        settings = s.table("settings").select("*").eq("id","shop").single().execute().data
        products = s.table("catalogue").select("*").eq("available", True).order("category").order("name").execute().data or []
        categories = sorted({p["category"] for p in products})
        return templates.TemplateResponse("store.html", {"request":request,"settings":settings,"products":products,"categories":categories})
    except Exception as e:
        return templates.TemplateResponse("error.html", {"request":request,"message":str(e)}, status_code=500)

@app.post("/api/orders")
async def create_order(request: Request):
    body = await request.json()
    name = str(body.get("customer_name","")).strip()
    phone = re.sub(r"[^0-9+]", "", str(body.get("customer_phone","")))
    fulfillment = body.get("fulfillment")
    address = str(body.get("address","")).strip()
    notes = str(body.get("notes","")).strip()[:1000]
    requested = body.get("items") or []

    if not name or not phone or fulfillment not in ("delivery","pickup") or not requested:
        return JSONResponse({"error":"Please complete all required fields and add items."}, status_code=400)
    if fulfillment == "delivery" and not address:
        return JSONResponse({"error":"Delivery address is required."}, status_code=400)

    quantities = {}
    for row in requested:
        pid = str(row.get("id",""))
        try: qty = int(row.get("quantity",0))
        except: qty = 0
        if pid and 1 <= qty <= 99:
            quantities[pid] = min(99, quantities.get(pid,0) + qty)

    if not quantities:
        return JSONResponse({"error":"Your cart is empty."}, status_code=400)

    db = service()
    products = db.table("catalogue").select("id,name,price,unit,available").in_("id", list(quantities)).execute().data or []
    product_map = {str(p["id"]):p for p in products if p.get("available")}
    if len(product_map) != len(quantities):
        return JSONResponse({"error":"One or more products are unavailable. Refresh and try again."}, status_code=409)

    items, subtotal = [], Decimal("0")
    for pid, qty in quantities.items():
        p = product_map[pid]
        price = money(p["price"])
        line = price * qty
        subtotal += line
        items.append({"id":pid,"name":p["name"],"unit":p["unit"],"price":float(price),"quantity":qty,"line_total":float(line)})

    settings = db.table("settings").select("*").eq("id","shop").single().execute().data
    delivery_fee = Decimal("0")
    if fulfillment == "delivery":
        threshold = money(settings.get("min_order_free_delivery"))
        if threshold <= 0 or subtotal < threshold:
            delivery_fee = money(settings.get("delivery_fee"))
    total = subtotal + delivery_fee

    order = {
        "customer_name":name, "customer_phone":phone, "items":items,
        "fulfillment":fulfillment, "address":address if fulfillment=="delivery" else None,
        "notes":notes or None, "subtotal":float(subtotal),
        "delivery_fee":float(delivery_fee), "total":float(total), "status":"new"
    }
    created = db.table("orders").insert(order).execute().data[0]
    oid = created["id"]
    short = oid.split("-")[0].upper()

    lines = [f"Hello {settings['shop_name']} 👋", "", "I have placed a new order.", "", f"Order: #{short}", ""]
    for i in items:
        lines.append(f"{i['quantity']} × {i['name']} — ₹{i['line_total']:.2f}")
    lines += ["", f"Subtotal: ₹{subtotal:.2f}", f"Delivery: ₹{delivery_fee:.2f}", f"Total: ₹{total:.2f}", "",
              fulfillment.title(), "", f"Name: {name}", f"Phone: {phone}"]
    if fulfillment == "delivery": lines.append(f"Address: {address}")
    if notes: lines.append(f"Notes: {notes}")
    lines += ["", "Please confirm my order."]

    wa_number = re.sub(r"\D", "", settings.get("whatsapp_number",""))
    whatsapp_url = f"https://wa.me/{wa_number}?text={quote(chr(10).join(lines))}"
    return {"order_id":oid,"short_id":short,"total":float(total),"whatsapp_url":whatsapp_url}

@app.get("/order/{order_id}", response_class=HTMLResponse)
def confirmation(request: Request, order_id: str, total: str = "", short: str = "", wa: str = ""):
    return templates.TemplateResponse("confirmation.html", {"request":request,"order_id":order_id,"total":total,"short":short,"wa":wa})

@app.get("/admin/login", response_class=HTMLResponse)
def admin_login(request: Request):
    return templates.TemplateResponse("admin_login.html", {"request":request,"error":None})

@app.post("/admin/login", response_class=HTMLResponse)
def admin_login_post(request: Request, email: str = Form(...), password: str = Form(...)):
    try:
        c = public()
        auth = c.auth.sign_in_with_password({"email":email,"password":password})
        request.session["access_token"] = auth.session.access_token
        request.session["refresh_token"] = auth.session.refresh_token
        return RedirectResponse("/admin", status_code=303)
    except Exception:
        return templates.TemplateResponse("admin_login.html", {"request":request,"error":"Invalid email or password."}, status_code=401)

@app.get("/admin/logout")
def logout(request: Request):
    request.session.clear()
    return RedirectResponse("/admin/login", status_code=303)

@app.get("/admin")
def admin_home(request: Request):
    if not request.session.get("access_token"): return RedirectResponse("/admin/login", status_code=303)
    return RedirectResponse("/admin/orders", status_code=303)

@app.get("/admin/orders", response_class=HTMLResponse)
def admin_orders(request: Request):
    if not request.session.get("access_token"): return RedirectResponse("/admin/login", status_code=303)
    try:
        rows = admin_client(request).table("orders").select("*").order("created_at", desc=True).limit(200).execute().data or []
        return templates.TemplateResponse("admin_orders.html", {"request":request,"orders":rows})
    except Exception:
        request.session.clear()
        return RedirectResponse("/admin/login", status_code=303)

@app.post("/admin/orders/{order_id}/status")
def update_status(request: Request, order_id: str, status: str = Form(...)):
    if status not in ("new","confirmed","preparing","ready","delivered","cancelled"):
        raise HTTPException(400,"Invalid status")
    admin_client(request).table("orders").update({"status":status}).eq("id",order_id).execute()
    return RedirectResponse("/admin/orders", status_code=303)

@app.get("/admin/catalogue", response_class=HTMLResponse)
def catalogue(request: Request):
    if not request.session.get("access_token"): return RedirectResponse("/admin/login", status_code=303)
    rows = admin_client(request).table("catalogue").select("*").order("category").order("name").execute().data or []
    return templates.TemplateResponse("admin_catalogue.html", {"request":request,"products":rows})

@app.post("/admin/catalogue")
def add_product(request: Request, name: str=Form(...), category: str=Form(...), price: float=Form(...), unit: str=Form(...), note: str=Form("")):
    admin_client(request).table("catalogue").insert({"name":name.strip(),"category":category.strip(),"price":price,"unit":unit.strip(),"note":note.strip() or None,"available":True}).execute()
    return RedirectResponse("/admin/catalogue", status_code=303)

@app.post("/admin/catalogue/{pid}/toggle")
def toggle_product(request: Request, pid: str, available: str=Form(...)):
    admin_client(request).table("catalogue").update({"available": available == "true"}).eq("id",pid).execute()
    return RedirectResponse("/admin/catalogue", status_code=303)

@app.post("/admin/catalogue/{pid}/delete")
def delete_product(request: Request, pid: str):
    admin_client(request).table("catalogue").delete().eq("id",pid).execute()
    return RedirectResponse("/admin/catalogue", status_code=303)

@app.get("/admin/settings", response_class=HTMLResponse)
def settings_page(request: Request):
    if not request.session.get("access_token"): return RedirectResponse("/admin/login", status_code=303)
    row = admin_client(request).table("settings").select("*").eq("id","shop").single().execute().data
    return templates.TemplateResponse("admin_settings.html", {"request":request,"settings":row})

@app.post("/admin/settings")
def settings_save(request: Request, shop_name: str=Form(...), whatsapp_number: str=Form(...), address: str=Form(""), delivery_fee: float=Form(0), min_order_free_delivery: float=Form(0)):
    admin_client(request).table("settings").update({
        "shop_name":shop_name.strip(),"whatsapp_number":re.sub(r"\D","",whatsapp_number),
        "address":address.strip() or None,"delivery_fee":delivery_fee,
        "min_order_free_delivery":min_order_free_delivery
    }).eq("id","shop").execute()
    return RedirectResponse("/admin/settings", status_code=303)

@app.get("/health")
def health():
    return {"ok": True}
