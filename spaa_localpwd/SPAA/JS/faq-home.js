const homeFaqRoot = document.getElementById('homeFaqList');
async function loadHomeFAQ(){
  if(!homeFaqRoot || !window.supabaseClient) return;
  const {data,error} = await supabaseClient
    .from('faq_items')
    .select('*')
    .eq('published', true)
    .order('sort_order',{ascending:true})
    .order('created_at',{ascending:true})
    .limit(4);
  if(error) return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ans=v=>esc(v).replace(/\n\s*\n/g,'</p><p>').replace(/\n/g,'<br>');
  homeFaqRoot.innerHTML=(data||[]).map(x=>`<details class="faq-item"><summary><span>${esc(x.question)}</span><span class="faq-plus" aria-hidden="true">+</span></summary><div class="faq-answer"><p>${ans(x.answer)}</p></div></details>`).join('');
  homeFaqRoot.querySelectorAll('.faq-item').forEach(item=>item.addEventListener('toggle',()=>{if(item.open) homeFaqRoot.querySelectorAll('.faq-item[open]').forEach(o=>{if(o!==item)o.open=false;});}));
}
loadHomeFAQ();
