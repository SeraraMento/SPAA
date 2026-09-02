(function () {
  'use strict';
  const grid = document.getElementById('homeAnimalsGrid');
  const loading = document.getElementById('animalsLoading');
  if (!grid) return;

  function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function badge(s){return s==='available'?'badge-available':s==='adopted'?'badge-adopted':'badge-reserved';}
  function label(s){return ({available:'Disponible',reserved:'Réservé',adopted:'Adopté'})[s]||s||'';}
  function wait(ms){return new Promise(r=>setTimeout(r,ms));}
  async function clientReady(){let t=Date.now();while(Date.now()-t<10000){if(window.supabaseClient?.from)return window.supabaseClient;await wait(100);}throw new Error('Supabase n’a pas été initialisé.');}
  function card(a){
    const img=a.photo_url?`<img class="animal-photo" src="${esc(a.photo_url)}" alt="Photo de ${esc(a.name)}" loading="lazy">`:'<div class="animal-photo-placeholder">Photo à venir</div>';
    const meta=[a.species,a.breed,a.age,a.sex].filter(Boolean).join(' · ');
    return `<article class="animal-card"><a class="animal-card-link" href="animal.html?id=${encodeURIComponent(a.id)}"><div class="animal-portrait">${img}</div><div class="animal-body"><div class="animal-title-row"><h3>${esc(a.name)}</h3><span class="badge ${badge(a.status)}">${esc(label(a.status))}</span></div><p class="animal-meta">${esc(meta)}</p></div></a></article>`;
  }
  async function load(){
    if(loading) loading.textContent='Chargement des animaux…';
    try{
      const c=await clientReady();
      const {data,error}=await c.from('animals').select('id,name,species,breed,age,sex,status,photo_url,created_at').eq('status','available').order('created_at',{ascending:false}).limit(4);
      if(error)throw error;
      const rows=Array.isArray(data)?data:[];
      grid.innerHTML=rows.length?rows.map(card).join(''):'<div class="animal-loading">Aucun animal disponible à l’adoption pour le moment.</div>';
    }catch(e){console.error('[SPAA] Accueil animaux:',e);grid.innerHTML=`<div class="animal-loading news-error">Impossible de charger les animaux${e?.message?` (${esc(e.message)})`:''}</div>`;}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
