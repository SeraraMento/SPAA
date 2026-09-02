(function () {
  'use strict';

  const root = document.getElementById('animalDetail');

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[c]));
  }

  function statusLabel(status) {
    return ({ available: 'Disponible', reserved: 'Réservé', adopted: 'Adopté' })[status] || status || '';
  }
  function statusClass(status) {
    return status === 'available' ? 'badge-available' : status === 'adopted' ? 'badge-adopted' : 'badge-reserved';
  }
  function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
  async function waitForSupabase(timeoutMs = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (window.supabaseClient && typeof window.supabaseClient.from === 'function') return window.supabaseClient;
      await wait(100);
    }
    throw new Error('Supabase JS ou le client Supabase n’a pas été initialisé.');
  }

  function show(text, error = false) {
    root.innerHTML = `<div class="animal-loading${error ? ' news-error' : ''}">${escapeHtml(text)}</div>`;
  }

  async function load() {
    if (!root) return;
    show('Chargement de la fiche…');
    const id = new URLSearchParams(location.search).get('id');
    if (!id) { show('Fiche animal introuvable.', true); return; }
    try {
      const client = await waitForSupabase();
      const { data, error } = await client.from('animals').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!data) { show('Cet animal n’existe plus ou n’est pas disponible.', true); return; }

      const image = data.photo_url
        ? `<img class="animal-detail-image" src="${escapeHtml(data.photo_url)}" alt="Photo de ${escapeHtml(data.name)}">`
        : '<div class="animal-detail-placeholder">Photo à venir</div>';
      const infos = [
        ['Espèce', data.species], ['Race', data.breed], ['Âge', data.age], ['Sexe', data.sex]
      ].filter(([,v]) => v);

      root.innerHTML = `<div class="animal-detail-layout">
        <div class="animal-detail-media">${image}</div>
        <div class="animal-detail-copy">
          <div class="animal-detail-kicker">Fiche animal</div>
          <h1>${escapeHtml(data.name)}</h1>
          <span class="badge ${statusClass(data.status)}">${escapeHtml(statusLabel(data.status))}</span>
          <dl class="animal-detail-meta">${infos.map(([k,v]) => `<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`).join('')}</dl>
          ${data.description ? `<div class="animal-description"><h2>À propos de ${escapeHtml(data.name)}</h2>${data.description.split(/\n\s*\n/).map(p => `<p>${escapeHtml(p).replace(/\n/g,'<br>')}</p>`).join('')}</div>` : ''}
          ${data.status === 'available' ? `<div class="animal-detail-action"><a class="btn btn-primary btn-lg" href="mailto:contact@spaa.fr?subject=${encodeURIComponent('Demande d’adoption — ' + data.name)}">Contacter pour adopter</a></div>` : ''}
        </div>
      </div>`;
      document.title = `SPAA — ${data.name}`;
    } catch (error) {
      console.error('[SPAA] Erreur fiche animal:', error);
      show(`Impossible de charger cette fiche${error?.message ? ` (${error.message})` : ''}`, true);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, { once: true });
  else load();
})();
