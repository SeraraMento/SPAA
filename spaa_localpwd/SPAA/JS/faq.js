const faqRoot = document.getElementById('faqList');
const faqEmpty = document.getElementById('faqEmpty');

function faqEscape(v){
  return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function faqAnswer(v){
  return faqEscape(v).replace(/\n\s*\n/g,'</p><p>').replace(/\n/g,'<br>');
}
function faqItem(item){
  return `<details class="faq-item"><summary><span>${faqEscape(item.question)}</span><span class="faq-plus" aria-hidden="true">+</span></summary><div class="faq-answer"><p>${faqAnswer(item.answer)}</p></div></details>`;
}
async function loadFAQ(){
  if(!faqRoot || !window.supabaseClient) return;
  const {data,error} = await supabaseClient
    .from('faq_items')
    .select('*')
    .eq('published', true)
    .order('sort_order',{ascending:true})
    .order('created_at',{ascending:true});
  if(error){
    faqRoot.innerHTML = `<div class="faq-message faq-error">Impossible de charger la FAQ : ${faqEscape(error.message)}</div>`;
    faqEmpty?.classList.add('hidden');
    return;
  }
  const items = data || [];
  faqRoot.innerHTML = items.map(faqItem).join('');
  faqEmpty?.classList.toggle('hidden', items.length !== 0);
  faqRoot.querySelectorAll('.faq-item').forEach(item => item.addEventListener('toggle', () => {
    if(item.open) faqRoot.querySelectorAll('.faq-item[open]').forEach(other => { if(other !== item) other.open = false; });
  }));
}
loadFAQ();
