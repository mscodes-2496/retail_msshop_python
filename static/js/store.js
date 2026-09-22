const KEY="wa_order_cart_v1";
let cart=JSON.parse(localStorage.getItem(KEY)||"{}");
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function save(){localStorage.setItem(KEY,JSON.stringify(cart));render()}
function add(btn){let id=btn.dataset.id;if(!cart[id])cart[id]={id,name:btn.dataset.name,price:+btn.dataset.price,unit:btn.dataset.unit,quantity:0};cart[id].quantity++;save();$("#drawer").classList.add("open")}
function render(){
 let rows=Object.values(cart), count=rows.reduce((a,x)=>a+x.quantity,0), sub=rows.reduce((a,x)=>a+x.price*x.quantity,0);
 $("#cartCount").textContent=count; $("#cartSubtotal").textContent=`₹${sub.toFixed(2)}`;
 $("#cartItems").innerHTML=rows.length?rows.map(x=>`<div class="cart-line"><div><b>${x.name}</b><small>₹${x.price.toFixed(2)} / ${x.unit}</small></div><div class="qty"><button data-minus="${x.id}">−</button><span>${x.quantity}</span><button data-plus="${x.id}">+</button></div></div>`).join(""):"<p>Your cart is empty.</p>";
 $$("[data-minus]").forEach(b=>b.onclick=()=>{let x=cart[b.dataset.minus];x.quantity--;if(x.quantity<=0)delete cart[b.dataset.minus];save()});
 $$("[data-plus]").forEach(b=>b.onclick=()=>{cart[b.dataset.plus].quantity++;save()});
}
$$(".add").forEach(b=>b.onclick=()=>add(b)); $("#cartBtn").onclick=()=>$("#drawer").classList.add("open"); $("#closeCart").onclick=()=>$("#drawer").classList.remove("open");
$("#fulfillment").onchange=e=>$("#addressWrap").style.display=e.target.value==="delivery"?"block":"none";
function filter(){let q=$("#search").value.toLowerCase(),cat=$(".chip.active").dataset.category;$$(".product").forEach(p=>p.style.display=(p.dataset.name.includes(q)&&(cat==="all"||p.dataset.category===cat))?"":"none")}
$("#search").oninput=filter; $$(".chip").forEach(c=>c.onclick=()=>{$$(".chip").forEach(x=>x.classList.remove("active"));c.classList.add("active");filter()});
$("#checkoutForm").onsubmit=async e=>{
 e.preventDefault(); $("#formError").textContent="";
 let f=new FormData(e.target), items=Object.values(cart).map(x=>({id:x.id,quantity:x.quantity}));
 if(!items.length){$("#formError").textContent="Add at least one item.";return}
 let payload=Object.fromEntries(f.entries());payload.items=items;
 let btn=e.target.querySelector("button[type=submit]");btn.disabled=true;btn.textContent="Creating order...";
 try{
   let r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}),d=await r.json();
   if(!r.ok)throw new Error(d.error||"Could not create order");
   cart={};save();
   location.href=`/order/${d.order_id}?short=${encodeURIComponent(d.short_id)}&total=${encodeURIComponent(d.total.toFixed(2))}&wa=${encodeURIComponent(d.whatsapp_url)}`;
 }catch(err){$("#formError").textContent=err.message;btn.disabled=false;btn.textContent="Place order & open WhatsApp"}
}; render();