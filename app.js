// ── STATE ──
let state = {
  tc: 18.50,
  tax: 0,
  stores: ['Walmart','Costco','Sam\'s Club','H-E-B','Target'],
  lists: [],
  forexApiKey: '',
  forexLastFetched: null
};
let editingListId = null;
let editingProductId = null;
let activeProductListId = null;
let listTab = 'stores';

function load(){
  const s = localStorage.getItem('shopconv');
  if(s) state = Object.assign({tc:18.50,tax:0,stores:['Walmart','Costco',"Sam's Club",'H-E-B','Target'],lists:[],forexApiKey:'',forexLastFetched:null}, JSON.parse(s));
  document.getElementById('tc-setting').value = state.tc;
  document.getElementById('tax-setting').value = state.tax||0;
  if(state.forexApiKey) document.getElementById('forex-api-key').value = state.forexApiKey;
  updateForexLastFetched();
  document.getElementById('tc-refresh-btn').style.display = state.forexApiKey ? 'inline-flex' : 'none';
  renderTcDisplay();
  renderStores();
  renderLists();
  renderQuickGrid();
}
function save(){localStorage.setItem('shopconv',JSON.stringify(state));}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2);}

// ── NAV ──
function goPage(p){
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(x=>x.classList.remove('active'));
  document.getElementById('page-'+p).classList.add('active');
  document.getElementById('nav-'+p).classList.add('active');
  if(p==='lists') renderLists();
}

// ── CALCULATOR ──
function getTc(){
  const ov = document.getElementById('tc-override').value;
  return ov && !isNaN(ov) ? parseFloat(ov) : state.tc;
}
function getTax(){ return (state.tax||0)/100; }
function renderTcDisplay(){
  const ov = document.getElementById('tc-override').value;
  const using = ov && !isNaN(ov) ? parseFloat(ov) : state.tc;
  document.getElementById('tc-display').textContent = using.toFixed(2);
  const chip = document.getElementById('tc-chip');
  chip.textContent = ov ? 'Override' : 'Guardado';
  chip.className = 'chip ' + (ov ? 'override' : 'saved');
}
function calcConvert(){
  renderTcDisplay();
  const usd = parseFloat(document.getElementById('usd-input').value)||0;
  const tc = getTc();
  const tax = getTax();
  const usdWithTax = usd * (1 + tax);
  const mxn = usdWithTax * tc;
  document.getElementById('mxn-result').textContent = '$'+fmt(mxn);
  const taxStr = tax>0 ? ` +${state.tax}% tax` : '';
  document.getElementById('calc-sub').textContent = `${usd.toFixed(2)} USD${taxStr} × ${tc.toFixed(2)} = ${fmt(mxn)} MXN`;
  document.getElementById('add-to-list-btn').style.display = usd>0 ? 'block' : 'none';
}
function openQuickAddFromMain(){
  const usd = parseFloat(document.getElementById('usd-input').value)||0;
  if(!usd) return;
  openQuickAdd(usd);
}
function clearOverride(){
  document.getElementById('tc-override').value='';
  calcConvert();
}
function fmt(n){return n.toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});}

function renderQuickGrid(){
  const amounts = [5,10,25,50,100,200,500,1000];
  const tc = getTc();
  const tax = getTax();
  const g = document.getElementById('quick-grid');
  g.innerHTML = amounts.map(a=>`
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;display:flex;justify-content:space-between;align-items:center;gap:6px">
      <span style="font-size:12px;color:var(--muted);font-family:var(--mono);white-space:nowrap">$${a}</span>
      <span style="font-size:13px;font-weight:600;font-family:var(--mono);color:var(--accent);white-space:nowrap">$${fmt(a*(1+tax)*tc)}</span>
    </div>`).join('');
}
document.getElementById('tc-override').addEventListener('input',()=>{calcConvert();renderQuickGrid();});

// ── SETTINGS ──
function saveTc(){
  const v = parseFloat(document.getElementById('tc-setting').value);
  if(!v||v<=0){toast('Ingresa un tipo de cambio válido','error');return;}
  state.tc = v;
  save();
  renderTcDisplay();
  renderQuickGrid();
  toast('Tipo de cambio guardado','success');
}
function saveTax(){
  const v = parseFloat(document.getElementById('tax-setting').value);
  if(isNaN(v)||v<0||v>30){toast('Tax debe ser entre 0 y 30','error');return;}
  state.tax = v;
  save();
  renderQuickGrid();
  toast('Tax guardado','success');
}
function renderStores(){
  const w = document.getElementById('stores-wrap');
  w.innerHTML = state.stores.map((s,i)=>`
    <span class="store-chip">${s}<button onclick="removeStore(${i})">×</button></span>`).join('');
}
function addStore(){
  const inp = document.getElementById('new-store-input');
  const v = inp.value.trim();
  if(!v) return;
  if(state.stores.includes(v)){toast('Tienda ya existe','error');return;}
  state.stores.push(v);
  save();
  renderStores();
  inp.value='';
}
function removeStore(i){
  state.stores.splice(i,1);
  save();
  renderStores();
}

// ── LISTS ──
function switchListTab(t){
  listTab=t;
  document.getElementById('tab-stores').className='tab-pill'+(t==='stores'?' active':'');
  document.getElementById('tab-free').className='tab-pill'+(t==='free'?' active':'');
  renderLists();
}
function renderLists(){
  const c = document.getElementById('lists-container');
  const filtered = state.lists.filter(l=>l.type===(listTab==='stores'?'store':'free'));
  if(!filtered.length){
    c.innerHTML=`<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg><p>Sin listas aún.<br>Toca "+ Nueva" para crear una.</p></div>`;
    return;
  }
  c.innerHTML = filtered.map(l=>renderListCard(l)).join('');
}
function listTotal(l){
  const tc = getTc();
  const tax = getTax();
  return l.products.reduce((s,p)=>s+(p.price*(1+tax)*p.qty*tc),0);
}
function renderListCard(l){
  const total = listTotal(l);
  const prods = l.products||[];
  return `
  <div class="list-card" id="lc-${l.id}">
    <div class="list-card-header" onclick="toggleList('${l.id}')">
      <div>
        <div class="list-card-title">${l.name}</div>
        <div class="list-card-meta">${l.type==='store'?'🏪 '+l.store:'📋 Lista libre'} · ${prods.length} producto${prods.length!==1?'s':''}</div>
      </div>
      <div class="list-card-right">
        <span class="list-total">$${fmt(total)}</span>
        <svg class="chevron" id="chev-${l.id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>
    <div class="list-body" id="lb-${l.id}">
      ${prods.length?prods.map(p=>renderProductRow(l.id,p)).join(''):`<div style="padding:14px 16px;font-size:13px;color:var(--muted)">Sin productos aún.</div>`}
      <div style="padding:12px 16px;border-top:1px solid rgba(36,52,71,.5);display:flex;gap:8px">
        <button class="btn-primary" style="font-size:13px;padding:10px" onclick="openAddProduct('${l.id}')">+ Producto</button>
        <button class="btn-sm" onclick="editList('${l.id}')">Editar lista</button>
        <button class="btn-sm" style="color:var(--danger);border-color:rgba(255,71,87,.3)" onclick="deleteList('${l.id}')">Eliminar</button>
      </div>
    </div>
  </div>`;
}
function renderProductRow(listId, p){
  const tc = getTc();
  const tax = getTax();
  const sub = p.price*(1+tax)*p.qty*tc;
  const taxStr = tax>0 ? ` <span style="font-size:10px;color:var(--warn)">+${state.tax}%</span>` : '';
  return `
  <div class="product-row" id="pr-${p.id}">
    <div style="flex:1">
      <div class="prod-name">${p.name}</div>
      <div class="prod-mxn">$${fmt(sub)} MXN${taxStr}</div>
    </div>
    <div style="text-align:right">
      <div class="prod-price">$${p.price.toFixed(2)} × ${p.qty}</div>
      <div class="prod-qty">USD</div>
    </div>
    <div class="prod-actions">
      <button class="icon-btn" onclick="openEditProduct('${listId}','${p.id}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="icon-btn del" onclick="deleteProduct('${listId}','${p.id}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
      </button>
    </div>
  </div>`;
}
function toggleList(id){
  const body = document.getElementById('lb-'+id);
  const chev = document.getElementById('chev-'+id);
  const open = body.classList.toggle('open');
  chev.classList.toggle('open',open);
}

// ── MODAL LIST ──
function openNewList(){
  editingListId = null;
  document.getElementById('modal-list-title').textContent='Nueva lista';
  document.getElementById('ml-name').value='';
  document.getElementById('ml-type').value=listTab==='stores'?'store':'free';
  populateStoreSelect();
  toggleStoreField();
  document.getElementById('ml-type').onchange = toggleStoreField;
  openModal('modal-list');
}
function editList(id){
  const l = state.lists.find(x=>x.id===id);
  editingListId = id;
  document.getElementById('modal-list-title').textContent='Editar lista';
  document.getElementById('ml-name').value=l.name;
  document.getElementById('ml-type').value=l.type;
  populateStoreSelect();
  document.getElementById('ml-store').value=l.store||'';
  toggleStoreField();
  document.getElementById('ml-type').onchange = toggleStoreField;
  openModal('modal-list');
}
function populateStoreSelect(){
  const sel = document.getElementById('ml-store');
  sel.innerHTML = state.stores.map(s=>`<option value="${s}">${s}</option>`).join('');
}
function toggleStoreField(){
  const t = document.getElementById('ml-type').value;
  document.getElementById('ml-store-field').style.display = t==='store'?'block':'none';
}
function saveList(){
  const name = document.getElementById('ml-name').value.trim();
  if(!name){toast('Ingresa un nombre','error');return;}
  const type = document.getElementById('ml-type').value;
  const store = type==='store'?document.getElementById('ml-store').value:'';
  if(editingListId){
    const l = state.lists.find(x=>x.id===editingListId);
    l.name=name; l.type=type; l.store=store;
  } else {
    state.lists.push({id:uid(),name,type,store,products:[]});
  }
  save();
  renderLists();
  closeModal('modal-list');
  toast(editingListId?'Lista actualizada':'Lista creada','success');
}
function deleteList(id){
  if(!confirm('¿Eliminar esta lista?')) return;
  state.lists = state.lists.filter(x=>x.id!==id);
  save();
  renderLists();
  toast('Lista eliminada');
}

// ── MODAL PRODUCT ──
function openAddProduct(listId){
  activeProductListId = listId;
  editingProductId = null;
  document.getElementById('modal-prod-title').textContent='Agregar producto';
  document.getElementById('mp-name').value='';
  document.getElementById('mp-price').value='';
  document.getElementById('mp-qty').value='1';
  document.getElementById('mp-subtotal').textContent='$0.00';
  openModal('modal-product');
}
function openEditProduct(listId, prodId){
  const l = state.lists.find(x=>x.id===listId);
  const p = l.products.find(x=>x.id===prodId);
  activeProductListId = listId;
  editingProductId = prodId;
  document.getElementById('modal-prod-title').textContent='Editar producto';
  document.getElementById('mp-name').value=p.name;
  document.getElementById('mp-price').value=p.price;
  document.getElementById('mp-qty').value=p.qty;
  updateProdSubtotal();
  openModal('modal-product');
}
function updateProdSubtotal(){
  const price = parseFloat(document.getElementById('mp-price').value)||0;
  const qty = parseInt(document.getElementById('mp-qty').value)||1;
  const tax = getTax();
  const sub = price*(1+tax)*qty*getTc();
  const taxStr = tax>0 ? ` (inc. ${state.tax}% tax)` : '';
  document.getElementById('mp-subtotal').textContent='$'+fmt(sub)+taxStr;
}
document.getElementById('mp-price').addEventListener('input',updateProdSubtotal);
document.getElementById('mp-qty').addEventListener('input',updateProdSubtotal);
function saveProduct(){
  const name = document.getElementById('mp-name').value.trim();
  const price = parseFloat(document.getElementById('mp-price').value);
  const qty = parseInt(document.getElementById('mp-qty').value)||1;
  if(!name){toast('Ingresa el nombre','error');return;}
  if(!price||price<=0){toast('Ingresa un precio válido','error');return;}
  const l = state.lists.find(x=>x.id===activeProductListId);
  if(editingProductId){
    const p = l.products.find(x=>x.id===editingProductId);
    p.name=name; p.price=price; p.qty=qty;
  } else {
    l.products.push({id:uid(),name,price,qty});
  }
  save();
  renderLists();
  closeModal('modal-product');
  toast(editingProductId?'Producto actualizado':'Producto agregado','success');
}
function deleteProduct(listId,prodId){
  const l = state.lists.find(x=>x.id===listId);
  l.products = l.products.filter(x=>x.id!==prodId);
  save();
  renderLists();
  toast('Producto eliminado');
}

// ── MODAL UTILS ──
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}
document.querySelectorAll('.modal-overlay').forEach(o=>{
  o.addEventListener('click',e=>{if(e.target===o)closeModal(o.id);});
});

// ── TOAST ──
function toast(msg,type=''){
  const t=document.getElementById('toast');
  t.textContent=msg; t.className='toast '+(type||'');
  void t.offsetWidth;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2200);
}

// ── EXPORT / CLEAR ──
function exportData(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='shopconverter-data.json';
  a.click();
  toast('Datos exportados','success');
}
function confirmClear(){
  if(confirm('¿Borrar todas las listas y productos?')){
    state.lists=[];
    save();
    renderLists();
    toast('Datos eliminados');
  }
}

// ── QUICK ADD TO LIST ──
let quickAddUsd = 0;
function openQuickAdd(usd){
  quickAddUsd = usd;
  const tc = getTc();
  const tax = getTax();
  const mxn = usd*(1+tax)*tc;
  document.getElementById('modal-qa-title').textContent=`Agregar $${usd} USD a lista`;
  document.getElementById('qa-preview').textContent='$'+fmt(mxn)+' MXN'+(tax>0?` (+${state.tax}% tax)`:'');
  document.getElementById('qa-name').value='';
  document.getElementById('qa-qty').value='1';
  const sel = document.getElementById('qa-list');
  if(!state.lists.length){toast('Primero crea una lista','error');return;}
  sel.innerHTML = state.lists.map(l=>`<option value="${l.id}">${l.name}${l.store?' — '+l.store:''}</option>`).join('');
  openModal('modal-quickadd');
}
function saveQuickAdd(){
  const name = document.getElementById('qa-name').value.trim();
  const qty = parseInt(document.getElementById('qa-qty').value)||1;
  const listId = document.getElementById('qa-list').value;
  if(!name){toast('Ingresa el nombre del producto','error');return;}
  const l = state.lists.find(x=>x.id===listId);
  if(!l){toast('Lista no encontrada','error');return;}
  l.products.push({id:uid(),name,price:quickAddUsd,qty});
  save();
  closeModal('modal-quickadd');
  toast('Agregado a "'+l.name+'"','success');
}

// ── FOREX API ──
function saveForexApiKey(){
  const key = document.getElementById('forex-api-key').value.trim();
  if(!key){toast('Ingresa una API key','error');return;}
  state.forexApiKey = key;
  save();
  document.getElementById('tc-refresh-btn').style.display = 'inline-flex';
  toast('API key guardada','success');
}

function updateForexLastFetched(){
  const el = document.getElementById('forex-last-fetched');
  if(!el) return;
  if(state.forexLastFetched){
    const d = new Date(state.forexLastFetched);
    el.textContent = 'Última consulta: ' + d.toLocaleDateString('es-MX',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
  }
}

async function fetchExchangeRate(){
  const key = state.forexApiKey;
  if(!key){toast('Guarda tu API key primero en Ajustes','error');return;}
  const spinner = document.getElementById('forex-spinner');
  const refreshIcon = document.getElementById('tc-refresh-icon');
  if(spinner) spinner.classList.add('spinning');
  if(refreshIcon) refreshIcon.classList.add('spinning');
  try{
    const res = await fetch(`https://api.forexrateapi.com/v1/latest?api_key=${encodeURIComponent(key)}&base=USD&currencies=MXN`);
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data = await res.json();
    if(!data.success){
      toast(data.error?.info||'Error al obtener tasa','error');
      return;
    }
    const rate = parseFloat(data.rates.MXN.toFixed(4));
    state.tc = rate;
    state.forexLastFetched = new Date().toISOString();
    save();
    document.getElementById('tc-setting').value = state.tc;
    renderTcDisplay();
    renderQuickGrid();
    updateForexLastFetched();
    toast('Tasa actualizada: $'+state.tc+' MXN/USD','success');
  }catch(e){
    toast('Error de conexión con ForexRateAPI','error');
  }finally{
    if(spinner) spinner.classList.remove('spinning');
    if(refreshIcon) refreshIcon.classList.remove('spinning');
  }
}

load();
