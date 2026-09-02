const root = document.getElementById('agendaList');
const empty = document.getElementById('agendaEmpty');

function escapeHtml(v){
  return String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
}
function formatDate(v){
  return new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long',year:'numeric'}).format(new Date(`${v}T12:00:00`));
}
function monthShort(v){
  return new Intl.DateTimeFormat('fr-FR',{month:'short'}).format(new Date(`${v}T12:00:00`)).replace('.', '').toUpperCase();
}
function formatTime(v){ return v ? String(v).slice(0,5).replace(':','h') : ''; }
function isUpcoming(e){
  const date = e.event_date;
  const time = e.start_time ? String(e.start_time).slice(0,8) : '23:59:59';
  return new Date(`${date}T${time}`) >= new Date();
}
function eventCard(e){
  const meta = [formatTime(e.start_time) ? `${formatTime(e.start_time)}${e.end_time ? `–${formatTime(e.end_time)}` : ''}` : '', e.location].filter(Boolean).map(escapeHtml).join(' · ');
  return `<article class="agenda-card"><div class="agenda-date"><span class="agenda-day">${new Date(`${e.event_date}T12:00:00`).getDate()}</span><span class="agenda-month">${monthShort(e.event_date)}</span></div><div class="agenda-content"><h3>${escapeHtml(e.title)}</h3>${meta ? `<p class="agenda-meta">${meta}</p>` : ''}<p>${escapeHtml(e.description || '')}</p></div></article>`;
}

async function loadAgenda(){
  if(!window.supabaseClient || !root) return;
  const {data,error} = await supabaseClient.from('events').select('*').eq('published',true).order('event_date',{ascending:true}).order('start_time',{ascending:true});
  if(error){ root.innerHTML = `<div class="article-loading">Impossible de charger l’agenda : ${escapeHtml(error.message)}</div>`; return; }
  const events = data || [];
  if(!events.length){ empty?.classList.remove('hidden'); root.innerHTML=''; return; }
  const upcoming = events.filter(isUpcoming);
  const past = events.filter(e=>!isUpcoming(e)).reverse();
  root.innerHTML = `${upcoming.length ? `<section><div class="section-head"><h2>À venir</h2></div><div class="agenda-list">${upcoming.map(eventCard).join('')}</div></section>`:''}${past.length ? `<section class="agenda-past"><div class="section-head"><h2>Événements passés</h2></div><div class="agenda-list">${past.map(eventCard).join('')}</div></section>`:''}`;
}
loadAgenda();
