const eventSection = document.getElementById('evenement');
async function loadNextEvent(){
  if(!window.supabaseClient || !eventSection) return;
  const {data,error} = await supabaseClient.from('events').select('*').eq('published',true).order('event_date',{ascending:true}).order('start_time',{ascending:true}).limit(20);
  if(error) return;
  const upcoming=(data||[]).filter(e=>{
    const t=e.start_time?String(e.start_time).slice(0,8):'23:59:59';
    return new Date(`${e.event_date}T${t}`)>=new Date();
  });
  const wrap=eventSection.querySelector('.event-inner');
  if(!wrap) return;
  const dateBox=wrap.querySelector('.event-date'); const copy=wrap.querySelector('.event-copy'); const link=wrap.querySelector('.event .btn, .btn');
  if(!upcoming.length){
    dateBox.innerHTML='<span class="event-day">—</span><span class="event-month">Aucun</span>';
    copy.querySelector('h2').textContent='Aucun événement à venir';
    copy.querySelector('p:last-child').textContent='Consultez régulièrement l’agenda pour découvrir les prochaines rencontres du refuge.';
    if(link) link.textContent='Voir l’agenda';
    if(link) link.href='agenda.html';
    return;
  }
  const e=upcoming[0];
  const d=new Date(`${e.event_date}T12:00:00`);
  const month=new Intl.DateTimeFormat('fr-FR',{month:'short'}).format(d).replace('.','');
  dateBox.innerHTML=`<span class="event-day">${d.getDate()}</span><span class="event-month">${month.charAt(0).toUpperCase()+month.slice(1)}</span>`;
  copy.querySelector('h2').textContent=e.title;
  const time=e.start_time?String(e.start_time).slice(0,5).replace(':','h'):'';
  const end=e.end_time?String(e.end_time).slice(0,5).replace(':','h'):'';
  const location=e.location?` — ${e.location}`:'';
  copy.querySelector('p:last-child').textContent=`${e.description || 'Venez rencontrer l’équipe du refuge.'}${time ? ` ${time}${end ? `–${end}`:''}.` : ''}${location}`;
  if(link){link.textContent='Voir l’agenda';link.href='agenda.html';}
}
loadNextEvent();
