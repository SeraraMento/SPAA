// Menu mobile — ouverture/fermeture simple
const navToggle = document.getElementById('navToggle');
const primaryNav = document.getElementById('primaryNav');

if (navToggle && primaryNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = primaryNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
  primaryNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      primaryNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Animaux dynamiques depuis Supabase
const homeAnimalsGrid = document.getElementById('homeAnimalsGrid');

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}

function animalStatusLabel(status) {
  return { available: 'Disponible', reserved: 'Réservé', adopted: 'Adopté' }[status] || status;
}

function animalStatusClass(status) {
  if (status === 'available') return 'badge-available';
  if (status === 'adopted') return 'badge-adopted';
  return 'badge-reserved';
}

function renderHomeAnimals(animals) {
  if (!homeAnimalsGrid) return;
  if (!animals.length) {
    homeAnimalsGrid.innerHTML = '<div class="animal-loading">Aucun animal n’est actuellement renseigné.</div>';
    return;
  }

  homeAnimalsGrid.innerHTML = animals.map((animal) => {
    const visual = animal.photo_url
      ? `<img class="animal-photo" src="${escapeHtml(animal.photo_url)}" alt="Photo de ${escapeHtml(animal.name)}" loading="lazy">`
      : `<div class="animal-photo-placeholder">Photo à venir</div>`;
    return `
      <article class="animal-card">
        <div class="animal-portrait">${visual}</div>
        <div class="animal-body">
          <div class="animal-title-row">
            <h3>${escapeHtml(animal.name)}</h3>
            <span class="badge ${animalStatusClass(animal.status)}">${animalStatusLabel(animal.status)}</span>
          </div>
          <p class="animal-meta">${escapeHtml(animal.breed || animal.species || '')} · ${escapeHtml(animal.age || 'Âge non renseigné')} · ${escapeHtml(animal.sex || '')}</p>
          <p class="animal-desc">${escapeHtml(animal.description || 'Découvrez sa fiche pour en savoir plus.')}</p>
          <a href="#contact" class="link-card">Voir sa fiche</a>
        </div>
      </article>`;
  }).join('');
}

async function loadHomeAnimals() {
  if (!homeAnimalsGrid || !window.supabaseClient) return;
  const { data, error } = await supabaseClient
    .from('animals')
    .select('id,name,species,breed,age,sex,status,description,photo_url')
    .eq('status', 'available')
    .order('created_at', { ascending: false })
    .limit(4);

  if (error) {
    console.error('Supabase animals:', error);
    homeAnimalsGrid.innerHTML = '<div class="animal-loading">Les animaux seront bientôt disponibles.</div>';
    return;
  }
  renderHomeAnimals(data || []);
}

loadHomeAnimals();
