(function () {
  'use strict';

  const newsList = document.getElementById('newsList');

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[c]));
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(date);
  }

  function showMessage(text, isError = false) {
    if (!newsList) return;
    newsList.innerHTML = `<div class="news-loading${isError ? ' news-error' : ''}">${escapeHtml(text)}</div>`;
  }

  async function waitForSupabase(timeoutMs = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (window.supabaseClient && typeof window.supabaseClient.from === 'function') {
        return window.supabaseClient;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('Supabase JS ou le client Supabase n’a pas été initialisé.');
  }

  async function loadNews() {
    if (!newsList) return;
    showMessage('Chargement des actualités…');

    try {
      const client = await waitForSupabase();

      const { data, error, count } = await client
        .from('news')
        .select('id,title,excerpt,content,image_url,published_at,created_at', { count: 'exact' })
        .eq('published', true)
        .order('published_at', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = Array.isArray(data) ? data : [];
      console.info('[SPAA] Actualités chargées :', rows.length, 'sur', count ?? rows.length);

      if (!rows.length) {
        showMessage('Aucune actualité publiée pour le moment.');
        return;
      }

      newsList.innerHTML = rows.map(item => {
        const img = item.image_url
          ? `<img class="news-image" src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" loading="lazy">`
          : '<div class="news-placeholder">Photo à venir</div>';

        return `<article class="news-card">
          <a class="news-card-link" href="actualite.html?id=${encodeURIComponent(item.id)}">
            ${img}
            <div class="news-content">
              <p class="news-date">${escapeHtml(formatDate(item.published_at || item.created_at))}</p>
              <h2>${escapeHtml(item.title)}</h2>
              <p class="news-excerpt">${escapeHtml(item.excerpt || '')}</p>
            </div>
          </a>
        </article>`;
      }).join('');
    } catch (error) {
      console.error('[SPAA] Erreur chargement actualités:', error);
      const details = error && error.message ? ` (${error.message})` : '';
      showMessage(`Impossible de charger les actualités${details}`, true);
    }
  }

  // La page peut être chargée avec les scripts en bas de body ou en cache.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNews, { once: true });
  } else {
    loadNews();
  }
})();
