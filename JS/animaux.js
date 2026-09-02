(function () {
  'use strict';

  const grid = document.getElementById('animalsList');

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

  function showMessage(text, error = false) {
    if (!grid) return;
    grid.innerHTML = `<div class="animal-loading${error ? ' news-error' : ''}">${escapeHtml(text)}</div>`;
  }

  function card(animal) {
    const firstGallery = Array.isArray(animal.animal_photos) ? [...animal.animal_photos].sort((x,y)=>(x.sort_order??0)-(y.sort_order??0))[0]?.photo_url : null;
    const primaryUrl = firstGallery || animal.photo_url;
    const image = primaryUrl
      ? `<img class="animal-photo" src="${escapeHtml(primaryUrl)}" alt="Photo de ${escapeHtml(animal.name)}" loading="lazy">`
      : '<div class="animal-photo-placeholder">Photo à venir</div>';
    const meta = [animal.species, animal.breed, animal.age, animal.sex].filter(Boolean).join(' · ');
    return `<article class="animal-card">
      <a class="animal-card-link" href="animal.html?id=${encodeURIComponent(animal.id)}">
        <div class="animal-portrait">${image}</div>
        <div class="animal-body">
          <div class="animal-title-row"><h3>${escapeHtml(animal.name)}</h3><span class="badge ${statusClass(animal.status)}">${escapeHtml(statusLabel(animal.status))}</span></div>
          <p class="animal-meta">${escapeHtml(meta)}</p>
          ${animal.description ? `<p class="animal-desc">${escapeHtml(animal.description.length > 130 ? animal.description.slice(0, 127) + '…' : animal.description)}</p>` : ''}
          <span class="animal-more">Voir la fiche →</span>
        </div>
      </a>
    </article>`;
  }

  async function loadAnimals() {
    if (!grid) return;
    showMessage('Chargement des animaux…');
    try {
      const client = await waitForSupabase();
      const { data, error } = await client
        .from('animals')
        .select('id,name,species,breed,age,sex,status,description,photo_url,created_at,animal_photos(photo_url,sort_order)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      if (!rows.length) {
        showMessage('Aucun animal n’est enregistré pour le moment.');
        return;
      }
      grid.innerHTML = rows.map(card).join('');
    } catch (error) {
      console.error('[SPAA] Erreur chargement animaux:', error);
      showMessage(`Impossible de charger les animaux${error?.message ? ` (${error.message})` : ''}`, true);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadAnimals, { once: true });
  else loadAnimals();
})();
