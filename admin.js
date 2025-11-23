
let books=[];

async function load(){
  const res = await fetch('data/library.json?_=' + Date.now());
  books = await res.json();
  render();
}

function render(){
  const t=document.getElementById('table');
  t.innerHTML='<tr><th>Title</th><th>Author</th><th>Status</th><th>Checked Out To</th><th>Actions</th></tr>';
  for(let [i,b] of books.entries()){
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${b.title}</td><td>${b.author}</td><td>${b.read_status||''}</td>
      <td>${b.is_checked_out?(b.checked_out_to_name||'?'):'—'}</td>
      <td><button onclick="edit(${i})">Edit</button> <button onclick="del(${i})">Delete</button></td>`;
    t.append(tr);
  }
}

function edit(i){
  const b=books[i];
  const title=prompt('Title', b.title)||b.title;
  const author=prompt('Author', b.author)||b.author;
  const status=prompt('Read status', b.read_status||'')||b.read_status;
  const who=prompt('Checked out to (blank if none)', b.checked_out_to_name||'')||'';
  const is_out=!!who;
  books[i]={...b,title,author,read_status:status,checked_out_to_name:who,is_checked_out:is_out};
  save();
}

function del(i){
  if(confirm('Delete '+books[i].title+'?')){
    books.splice(i,1); save();
  }
}

async function save(){
  await fetch('/.netlify/functions/saveData', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify(books)
  });
  render();
}

document.getElementById('newBook').onclick=()=>{
  const title=prompt('Title'); if(!title)return;
  books.push({title,author:'',is_checked_out:false});
  save();
};

document.getElementById('export').onclick=()=>{
  const blob=new Blob([JSON.stringify(books,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='library-export.json';
  a.click();
};

load();


/* ===== Bulk cover fetch (Open Library) ===== */
async function fetchCoverFor(b){
  if(b.cover_url && b.cover_url.trim()) return false;
  // Try ISBN first
  if(b.isbn){
    const url = `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(b.isbn)}-L.jpg?default=false`;
    if(await probe(url)){ b.cover_url = url; return true; }
  }
  // Search by title/author
  const q = new URLSearchParams({ title: b.title||'', author: b.author||'' }).toString();
  const r = await fetch(`https://openlibrary.org/search.json?${q}`);
  if(r.ok){
    const data = await r.json();
    const doc = (data.docs||[]).find(d => d.cover_i);
    if(doc && doc.cover_i){
      b.cover_url = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
      return true;
    }
  }
  return false;
}
async function probe(url){
  try{ let r = await fetch(url, {method:'HEAD'}); if(r.ok) return true; }catch(e){}
  try{ let r2 = await fetch(url, {method:'GET', cache:'no-store'}); return r2.ok; }catch(e){ return false; }
}

document.getElementById('fetchCovers').onclick = async ()=>{
  let changed = 0;
  for(const b of books){
    const ok = await fetchCoverFor(b);
    if(ok) changed++;
  }
  if(changed){
    await save();
    alert(`Added covers for ${changed} book(s).`);
  } else {
    alert('No new covers found.');
  }
};



async function bulkFillCoversAdmin({concurrency=8, saveEvery=20} = {}){
  const queue = books.filter(b => !b.cover_url || !b.cover_url.trim());
  let idx = 0, changed = 0;
  async function worker(){
    while(true){
      const i = idx++; if(i >= queue.length) break;
      const b = queue[i];
      const ok = await fetchCoverFor(b);
      if(ok){
        changed++;
        if(changed % saveEvery === 0){ await save(); }
      }
    }
  }
  const workers = Array.from({length: Math.min(concurrency, queue.length)}, worker);
  await Promise.all(workers);
  if(changed % saveEvery !== 0){ await save(); }
  return changed;
}

document.getElementById('fetchCovers').onclick = async ()=>{
  const changed = await bulkFillCoversAdmin({concurrency:8, saveEvery:25});
  alert(changed ? `Added covers for ${changed} book(s).` : 'No new covers found.');
};
