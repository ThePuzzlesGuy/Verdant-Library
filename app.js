
async function loadBooks(){
  const res = await fetch('data/library.json?_=' + Date.now());
  return await res.json();
}

function render(books){
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  for(const b of books){
    const card = document.createElement('div');
    card.className='card';
    const jacket=document.createElement('div');
    jacket.className='jacket';
    jacket.style.background=b.jacket_color?b.jacket_color:'#364a64';
    const content=document.createElement('div');
    content.className='content';
    content.innerHTML=`<h3>${b.title}</h3>
      <p>${b.author}</p>
      <p><small>${b.series||''}</small></p>
      <p><small>${b.main_genre||''}</small></p>
      <p><small>${b.read_status||''}</small></p>
      <p><small>${b.is_checked_out?"Checked out to "+(b.checked_out_to_name||'?'):"Available"}</small></p>`;
    card.append(jacket,content);
    grid.append(card);
  }
}

async function init(){
  const books = await loadBooks();
  render(books);
  document.getElementById('search').addEventListener('input', e=>{
    const q=e.target.value.toLowerCase();
    render(books.filter(b=>(b.title+b.author+b.series).toLowerCase().includes(q)));
  });
}
init();
