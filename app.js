
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

async function loadBooks(){
  const res = await fetch('data/library.json?_=' + Date.now());
  BOOKS = await res.json();
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

function spineColor(c){ return c && c.trim() ? c : '#cfcfcf'; }

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

function renderGrid(rows){
  els.grid.innerHTML = '';
  for(const b of rows){
    const card = document.createElement('article');
    card.className = 'card';

    const cover = document.createElement('div');
    cover.className = 'cover';
    cover.style.setProperty('--spine', spineColor(b.jacket_color));
    const spine = document.createElement('div');
    spine.className = 'spine'; // purely decorative in CSS
    cover.append(spine);

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
  }
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
}
init();
