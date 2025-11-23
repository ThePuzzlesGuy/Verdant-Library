
let BOOKS=[];
const els = {
  genreList: document.getElementById('genreList'),
  search: document.getElementById('search'),
  status: document.getElementById('status'),
  availability: document.getElementById('availability'),
  sort: document.getElementById('sort'),
  grid: document.getElementById('grid'),
  sectionLabel: document.getElementById('sectionLabel'),
};

const normalize = s => (s||'').toString().toLowerCase();
const unique = (arr, key) => [...new Set(arr.map(x => x[key]).filter(Boolean))];


async function safeLoad(){
  try{
    const r = await fetch('/.netlify/functions/loadData?_=' + Date.now());
    if(!r.ok) throw new Error('loadData ' + r.status);
    return await r.json();
  }catch(e){
    // Fallback to static seed so the page isn't empty
    try{
      const s = await fetch('data/library.json?_=' + Date.now());
      if(!s.ok) throw new Error('seed ' + s.status);
      const j = await s.json();
      // Attempt to seed blobs asynchronously
      try{
        await fetch('/.netlify/functions/saveData', {
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(j)
        });
      }catch(_e){ /* ignore */ }
      return j;
    }catch(e2){
      const main = document.querySelector('main') || document.body;
      const div = document.createElement('div');
      div.style = 'margin:16px;padding:12px;border:1px solid #e6e7e9;background:#fff;color:#b3261e;border-radius:6px;';
      div.textContent = 'Error loading books. If you just deployed, Netlify may still be installing dependencies. Try again in a minute.';
      main.prepend(div);
      return [];
    }
  }
}


function ensureBanner(){
  let b = document.getElementById('vh-banner');
  if(!b){
    b = document.createElement('div');
    b.id='vh-banner';
    b.style='margin:12px; padding:10px; border:1px solid #e6e7e9; background:#fff8e1; color:#5d4200; border-radius:6px;';
    const main = document.querySelector('main') || document.body;
    main.prepend(b);
  }
  return b;
}
async function seedFromStatic(){
  const s = await fetch('data/library.json?_=' + Date.now());
  const j = await s.json();
  await fetch('/.netlify/functions/saveData', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(j) });
  return j;
}

async function loadBooks(){ 
  BOOKS = await safeLoad(); 
  if(!Array.isArray(BOOKS) || BOOKS.length === 0){ 
    const b = ensureBanner();
    b.innerHTML = 'Initializing library data… <button id="vh-seed">Seed Now</button>';
    document.getElementById('vh-seed').onclick = async ()=>{ 
      b.textContent = 'Seeding…'; 
      BOOKS = await seedFromStatic(); 
      b.remove(); 
      update(); 
    };
  }
}

function renderGenres(){
  const genres = unique(BOOKS, 'main_genre').sort((a,b)=>a.localeCompare(b));
  els.genreList.innerHTML = '<li><a href="#" data-genre="" class="active">All</a></li>' + genres.map(g=>`<li><a href="#" data-genre="${g}">${g}</a></li>`).join('');
  els.genreList.addEventListener('click', (e)=>{
    const a = e.target.closest('a[data-genre]'); if(!a) return;
    e.preventDefault();
    els.genreList.querySelectorAll('a').forEach(x=>x.classList.remove('active'));
    a.classList.add('active');
    els.sectionLabel.textContent = a.dataset.genre ? a.dataset.genre : 'All Books';
    update();
  });
}

function starify(r){
  const n = parseFloat(r||0);
  if(!n || n<=0) return '';
  const full = Math.floor(n);
  const half = (n - full) >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half?'½':''); // simple display
}

function getActiveGenre(){
  const a = els.genreList.querySelector('a.active');
  return a ? a.dataset.genre : '';
}

function applyFilters(){
  const q = normalize(els.search.value);
  const st = els.status.value;
  const av = els.availability.value;
  const g = getActiveGenre();

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

function coverImg(url, spineColor){
  if(url && url.trim()){
    return `<img src="${url}" alt="" loading="lazy" />`;
  }
  // fallback: spine color block as faux cover
  const c = spineColor && spineColor.trim() ? spineColor : '#cfcfcf';
  return `<div style="width:100%;height:100%;background:${c};"></div>`;
}

async function tryFetchCover(book){
  // If cover already present, skip
  if(book.cover_url && book.cover_url.trim()) return null;

  // 1) ISBN direct cover
  if(book.isbn){
    const url = `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(book.isbn)}-L.jpg?default=false`;
    // optimistic use; let the image try to load; if it 404s, fallback to search
    const ok = await probe(url);
    if(ok){ book.cover_url = url; return url; }
  }
  // 2) Search by title + author to get cover id
  const q = new URLSearchParams({ title: book.title || '', author: book.author || '' }).toString();
  const resp = await fetch(`https://openlibrary.org/search.json?${q}`);
  if(resp.ok){
    const data = await resp.json();
    const doc = (data.docs||[]).find(d => d.cover_i);
    if(doc && doc.cover_i){
      const url = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
      book.cover_url = url;
      return url;
    }
  }
  return null;
}

async function probe(url){
  try{
    let r = await fetch(url, { method:'HEAD' });
    if(r.ok) return true;
  }catch(e){}
  try{
    let r2 = await fetch(url, { method:'GET', cache:'no-store' });
    return r2.ok;
  }catch(e){ return false; }
}

function renderGrid(rows){
  els.grid.innerHTML = '';
  rows.forEach((b, idx) => {
    const card = document.createElement('article');
    card.className = 'card';

    const cover = document.createElement('div');
    cover.className = 'cover';
    cover.style.setProperty('--spine', b.jacket_color || '#cfcfcf');
    // initially render what we have
    cover.innerHTML = b.cover_url ? `<img src="${b.cover_url}" alt="" loading="lazy" />`
                                  : `<div style="width:100%;height:100%;background:${b.jacket_color||'#cfcfcf'}"></div>`;

    const body = document.createElement('div');
    body.className = 'card-body';
    const stars = starify(b.rating);
    body.innerHTML = `
      <div class="title">${b.title}</div>
      <div class="author">${b.author||''}</div>
      <div class="row">
        <div class="stars">${stars}</div>
        <span class="tag ${b.is_checked_out ? 'out':'in'}">${b.is_checked_out ? 'Checked Out' : 'Available'}</span>
      </div>
    `;

    card.append(cover, body);
    els.grid.append(card);

    // Lazy fetch cover if missing and persist
    if(!b.cover_url){
      tryFetchCover(b).then(found => {
        if(found){
          cover.innerHTML = `<img src="${found}" alt="" loading="lazy" />`;
          persistBooks(); // write back to library.json so it stays
        }
      });
    }
  });
}

async function persistBooks(){
  try{
    await fetch('/.netlify/functions/saveData', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(BOOKS)
    });
  }catch(e){ /* ignore */ }
}

function bind(){
  ['input','change'].forEach(ev=>{
    els.search.addEventListener(ev, update);
    els.status.addEventListener(ev, update);
    els.availability.addEventListener(ev, update);
    els.sort.addEventListener(ev, update);
  });
  document.getElementById('go').addEventListener('click', update);
}

function update(){
  const rows = applyFilters();
  renderGrid(rows);
}

async function init(){
  await loadBooks();
  renderGenres();
  bind();
  update();

  // Auto seed covers once per device if many are missing
  const missing = BOOKS.filter(b => !b.cover_url || !b.cover_url.trim()).length;
  if(missing > 0 && localStorage.getItem('vh_covers_seeded') !== 'yes'){
    bulkFillCovers(BOOKS, {concurrency:8, saveEvery:25}).then(changed => {
      if(changed > 0){ update(); }
      localStorage.setItem('vh_covers_seeded','yes');
    });
  }
}
init();


// ===== Bulk cover fill across ALL books, with concurrency =====
async function bulkFillCovers(books, {concurrency=8, saveEvery=20} = {}){
  const queue = books.filter(b => !b.cover_url || !b.cover_url.trim());
  let idx = 0, changed = 0;

  async function worker(){
    while(true){
      const i = idx++; if(i >= queue.length) break;
      const b = queue[i];
      const ok = await tryFetchCover(b);
      if(ok){
        changed++;
        if(changed % saveEvery === 0){ await persistBooks(); }
      }
    }
  }
  const workers = Array.from({length: Math.min(concurrency, queue.length)}, worker);
  await Promise.all(workers);
  if(changed % saveEvery !== 0){ await persistBooks(); }
  return changed;
}

