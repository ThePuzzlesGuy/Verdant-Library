
let books = [];
const els = {
  status: document.getElementById('status'),
  search: document.getElementById('search'),
  genre: document.getElementById('genre'),
  statusSel: document.getElementById('status'),
  availability: document.getElementById('availability'),
  sort: document.getElementById('sort'),
  tbody: document.querySelector('#table tbody'),
  exportJSON: document.getElementById('exportJSON'),
  exportCSV: document.getElementById('exportCSV'),
};

const normalize = s => (s||'').toString().toLowerCase();
const unique = (arr, key) => [...new Set(arr.map(x => x[key]).filter(Boolean))];

async function loadStatic(){
  const r = await fetch('data/library.json?_=' + Date.now());
  if(!r.ok){ throw new Error('Failed to load static JSON'); }
  return await r.json();
}

function populateFilters(){
  const genres = unique(books, 'main_genre').sort((a,b)=>a.localeCompare(b));
  els.genre.innerHTML = '<option value="">All genres</option>' + genres.map(g=>`<option>${g}</option>`).join('');
}

function applyFilters(){
  const q = normalize(els.search.value);
  const g = els.genre.value;
  const st = els.statusSel.value;
  const av = els.availability.value;

  let rows = books.filter(b => {
    if(q && !(normalize(b.title).includes(q) || normalize(b.author).includes(q) || normalize(b.series).includes(q))) return false;
    if(g && b.main_genre !== g) return false;
    if(st && (normalize(b.read_status) !== normalize(st))) return false;
    if(av === 'in' && b.is_checked_out) return false;
    if(av === 'out' && !b.is_checked_out) return false;
    return true;
  });

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

function render(){
  const rows = applyFilters();
  els.tbody.innerHTML = '';
  for(const b of rows){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${b.title}</td>
      <td>${b.author || ''}</td>
      <td>${b.series || ''}</td>
      <td>${b.main_genre || ''}</td>
      <td>${b.read_status || ''}</td>
      <td>${b.is_checked_out ? (b.checked_out_to_name ? 'Out to ' + b.checked_out_to_name : 'Out') : 'In'}</td>
      <td>${b.rating || ''}</td>
      <td>${b.shelf_location || ''}</td>
    `;
    els.tbody.append(tr);
  }
  els.status.textContent = `Loaded ${rows.length} / ${books.length} from data/library.json`;
}

function bind(){
  ['input','change'].forEach(ev=>{
    els.search.addEventListener(ev, render);
    els.genre.addEventListener(ev, render);
    els.statusSel.addEventListener(ev, render);
    els.availability.addEventListener(ev, render);
    els.sort.addEventListener(ev, render);
  });

  els.exportJSON.onclick = ()=>{
    const blob = new Blob([JSON.stringify(books, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: 'library.json' });
    document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  els.exportCSV.onclick = ()=>{
    const cols = ['title','author','series','main_genre','sub_genre','read_status','is_checked_out','checked_out_to_name','rating','shelf_location','jacket_color','isbn','cover_url'];
    const esc = (v)=>(''+(v??'')).replaceAll('"','""');
    const lines = [cols.join(',')];
    for(const b of books){
      lines.push(cols.map(k=>`"${esc(b[k])}"`).join(','));
    }
    const blob = new Blob([lines.join('\n')], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: 'library.csv' });
    document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };
}

async function init(){
  try{
    books = await loadStatic();
    populateFilters();
    bind();
    render();
  }catch(e){
    els.status.textContent = 'Error: could not load data/library.json';
    console.error(e);
  }
}
init();
