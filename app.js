
let BOOKS = [];
const els = {
  grid: document.getElementById('grid'),
  list: document.getElementById('list'),
  tbody: document.querySelector('#list tbody'),
  search: document.getElementById('search'),
  genre: document.getElementById('genre'),
  status: document.getElementById('status'),
  availability: document.getElementById('availability'),
  sort: document.getElementById('sort'),
  viewGrid: document.getElementById('viewGrid'),
  viewList: document.getElementById('viewList'),
};

async function loadBooks(){
  const res = await fetch('data/library.json?_=' + Date.now());
  BOOKS = await res.json();
}

function spineColor(cssColor){
  // Use text color as-is; if empty, fallback to a parchment-friendly neutral
  return cssColor && cssColor.trim() ? cssColor.trim() : '#c8c2b6';
}

function unique(arr, key){ return [...new Set(arr.map(x => x[key]).filter(Boolean))]; }

function populateFilters(){
  const genres = unique(BOOKS, 'main_genre').sort((a,b)=>a.localeCompare(b));
  els.genre.innerHTML = '<option value="">All Genres</option>' + genres.map(g=>`<option>${g}</option>`).join('');
}

function normalize(s){ return (s||'').toString().toLowerCase(); }

function applyFilters(){
  const q = normalize(els.search.value);
  const g = els.genre.value;
  const st = els.status.value;
  const av = els.availability.value; // '', 'in', 'out'

  let rows = BOOKS.filter(b => {
    if(q && !(normalize(b.title).includes(q) || normalize(b.author).includes(q) || normalize(b.series).includes(q))) return false;
    if(g && b.main_genre !== g) return false;
    if(st && (normalize(b.read_status) !== normalize(st))) return false;
    if(av === 'in' && b.is_checked_out) return false;
    if(av === 'out' && !b.is_checked_out) return false;
    return true;
  });

  // sort
  const s = els.sort.value;
  const coll = (x)=>normalize(x||'');
  if(s === 'title-asc') rows.sort((a,b)=>coll(a.title).localeCompare(coll(b.title)));
  if(s === 'title-desc') rows.sort((a,b)=>coll(b.title).localeCompare(coll(a.title)));
  if(s === 'author-asc') rows.sort((a,b)=>coll(a.author).localeCompare(coll(b.author)));
  if(s === 'author-desc') rows.sort((a,b)=>coll(b.author).localeCompare(coll(a.author)));
  if(s === 'series-asc') rows.sort((a,b)=>coll(a.series).localeCompare(coll(b.series)));
  if(s === 'rating-desc') rows.sort((a,b)=>(parseFloat(b.rating||0) - parseFloat(a.rating||0)));

  return rows;
}

function renderGrid(rows){
  els.grid.innerHTML = '';
  for(const b of rows){
    const card = document.createElement('article');
    card.className = 'card';
    const spine = document.createElement('div');
    spine.className = 'spine';
    spine.style.setProperty('--spine', spineColor(b.jacket_color));
    if(b.jacket_color) spine.dataset.color = b.jacket_color;
    const body = document.createElement('div');
    body.className = 'body';
    body.innerHTML = `
      <div class="title">${b.title}</div>
      <div class="meta">
        <span class="badge">${b.author || '—'}</span>
        ${b.series ? `<span class="badge">${b.series}</span>` : ''}
      </div>
      <div class="kv">
        ${b.main_genre ? `<span>${b.main_genre}</span>`:''}
        ${b.shelf_location ? `<span>Shelf ${b.shelf_location}</span>`:''}
        ${b.rating ? `<span>★ ${b.rating}</span>`:''}
      </div>
      <div class="avail ${b.is_checked_out ? 'out':'in'}">${b.is_checked_out ? 'Checked Out' : 'Available'}</div>
    `;
    card.append(spine, body);
    els.grid.append(card);
  }
}

function renderList(rows){
  els.tbody.innerHTML = '';
  for(const b of rows){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${b.title}</td>
      <td>${b.author || ''}</td>
      <td>${b.series || ''}</td>
      <td>${b.main_genre || ''}</td>
      <td>${b.read_status || ''}</td>
      <td class="avail ${b.is_checked_out ? 'out':'in'}">${b.is_checked_out ? (b.checked_out_to_name ? 'Out to ' + b.checked_out_to_name : 'Out') : 'In'}</td>
      <td>${b.rating || ''}</td>
      <td>${b.shelf_location || ''}</td>
    `;
    els.tbody.append(tr);
  }
}

function setView(mode){
  const grid = (mode === 'grid');
  els.grid.hidden = !grid;
  els.list.hidden = grid;
  els.viewGrid.setAttribute('aria-pressed', grid ? 'true':'false');
  els.viewList.setAttribute('aria-pressed', grid ? 'false':'true');
  localStorage.setItem('vh_view', mode);
  const rows = applyFilters();
  grid ? renderGrid(rows) : renderList(rows);
}

function bind(){
  ['input','change'].forEach(ev=>{
    els.search.addEventListener(ev, ()=>setView(currentView()));
    els.genre.addEventListener(ev, ()=>setView(currentView()));
    els.status.addEventListener(ev, ()=>setView(currentView()));
    els.availability.addEventListener(ev, ()=>setView(currentView()));
    els.sort.addEventListener(ev, ()=>setView(currentView()));
  });
  els.viewGrid.addEventListener('click', ()=>setView('grid'));
  els.viewList.addEventListener('click', ()=>setView('list'));
}

function currentView(){ return els.viewList.getAttribute('aria-pressed') === 'true' ? 'list' : 'grid'; }

async function init(){
  await loadBooks();
  populateFilters();
  // default to grid, but remember preference
  const pref = localStorage.getItem('vh_view') || 'grid';
  if(pref === 'list'){ setView('list'); } else { setView('grid'); }
}
bind();
init();
