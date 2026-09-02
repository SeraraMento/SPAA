const newsList = document.getElementById('newsList');
const navToggle = document.getElementById('navToggle');
const primaryNav = document.getElementById('primaryNav');
if (navToggle && primaryNav) {
  navToggle.addEventListener('click', () => { const open = primaryNav.classList.toggle('open'); navToggle.setAttribute('aria-expanded', String(open)); });
}
function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function formatDate(v){return new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long',year:'numeric'}).format(new Date(v));}
async function loadNews(){
  if(!window.supabaseClient) { newsList.innerHTML='<div class="news-loading">Les actualités sont momentanément indisponibles.</div>'; return; }
  const {data,error}=await supabaseClient.from('news').select('id,title,excerpt,content,image_url,published_at,created_at').eq('published',true).order('published_at',{ascending:false}).order('created_at',{ascending:false});
  if(error){console.error(error);newsList.innerHTML='<div class="news-loading">Les actualités sont momentanément indisponibles.</div>';return;}
  if(!data?.length){newsList.innerHTML='<div class="news-loading">Aucune actualité publiée pour le moment.</div>';return;}
  newsList.innerHTML=data.map(item=>{const img=item.image_url?`<img class="news-image" src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" loading="lazy">`:'<div class="news-placeholder">Photo à venir</div>';return `<article><a class="news-card-link" href="actualite.html?id=${encodeURIComponent(item.id)}">${img}<div class="news-content"><p class="news-date">${formatDate(item.published_at||item.created_at)}</p><h2>${escapeHtml(item.title)}</h2><p class="news-excerpt">${escapeHtml(item.excerpt||'')}</p></div></a></article>`;}).join('');
}
loadNews();
