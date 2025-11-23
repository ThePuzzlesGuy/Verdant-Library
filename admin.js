
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
