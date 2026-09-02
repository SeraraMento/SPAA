const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const loginForm = document.getElementById('loginForm');
const loginNotice = document.getElementById('loginNotice');
const dashboardNotice = document.getElementById('dashboardNotice');
const logoutBtn = document.getElementById('logoutBtn');
const newAnimalBtn = document.getElementById('newAnimalBtn');
const animalFormPanel = document.getElementById('animalFormPanel');
const animalForm = document.getElementById('animalForm');
const tableBody = document.getElementById('animalsTableBody');
const emptyAnimals = document.getElementById('emptyAnimals');
const fileInput = document.getElementById('animalPhoto');

const fields = {
  id: document.getElementById('animalId'),
  name: document.getElementById('animalName'),
  species: document.getElementById('animalSpecies'),
  breed: document.getElementById('animalBreed'),
  age: document.getElementById('animalAge'),
  sex: document.getElementById('animalSex'),
  status: document.getElementById('animalStatus'),
  description: document.getElementById('animalDescription'),
};

let currentAnimals = [];

function showNotice(element, message, error = false) {
  element.textContent = message;
  element.classList.remove('hidden');
  element.classList.toggle('error', error);
}

function hideNotice(element) { element.classList.add('hidden'); }

function statusLabel(status) {
  return { available: 'Disponible', reserved: 'Réservé', adopted: 'Adopté' }[status] || status;
}

function statusClass(status) {
  return status === 'available' ? 'badge-available' : 'badge-reserved';
}

function resetForm() {
  animalForm.reset();
  fields.id.value = '';
  document.getElementById('formTitle').textContent = 'Ajouter un animal';
  document.getElementById('fileName').textContent = 'Aucune nouvelle photo sélectionnée.';
  animalFormPanel.classList.add('hidden');
}

function openForm(animal = null) {
  hideNotice(dashboardNotice);
  animalFormPanel.classList.remove('hidden');
  document.getElementById('formTitle').textContent = animal ? `Modifier ${animal.name}` : 'Ajouter un animal';
  fields.id.value = animal?.id || '';
  fields.name.value = animal?.name || '';
  fields.species.value = animal?.species || 'Chien';
  fields.breed.value = animal?.breed || '';
  fields.age.value = animal?.age || '';
  fields.sex.value = animal?.sex || 'Mâle';
  fields.status.value = animal?.status || 'available';
  fields.description.value = animal?.description || '';
  fileInput.value = '';
  document.getElementById('fileName').textContent = animal?.photo_url ? 'Photo actuelle conservée si aucune nouvelle photo n’est choisie.' : 'Aucune photo actuelle.';
  animalFormPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadAnimals() {
  const { data, error } = await supabaseClient.from('animals').select('*').order('created_at', { ascending: false });
  if (error) {
    showNotice(dashboardNotice, `Impossible de charger les animaux : ${error.message}`, true);
    return;
  }
  currentAnimals = data || [];
  renderAnimals();
}

function renderAnimals() {
  tableBody.innerHTML = '';
  emptyAnimals.classList.toggle('hidden', currentAnimals.length !== 0);
  currentAnimals.forEach((animal) => {
    const tr = document.createElement('tr');
    const image = animal.photo_url ? `<img class="admin-thumb" src="${escapeHtml(animal.photo_url)}" alt="Photo de ${escapeHtml(animal.name)}">` : '<div class="admin-thumb"></div>';
    tr.innerHTML = `
      <td>${image}</td>
      <td><strong>${escapeHtml(animal.name)}</strong><br><small>${escapeHtml(animal.species || '')}</small></td>
      <td>${escapeHtml(animal.breed || '—')} · ${escapeHtml(animal.age || 'âge non renseigné')} · ${escapeHtml(animal.sex || '—')}</td>
      <td><span class="badge ${statusClass(animal.status)}">${statusLabel(animal.status)}</span></td>
      <td><div class="admin-actions"><button data-action="edit" data-id="${animal.id}">Modifier</button><button class="danger" data-action="delete" data-id="${animal.id}">Supprimer</button></div></td>`;
    tableBody.appendChild(tr);
  });
}

async function uploadPhoto(file, animalId) {
  if (!file) return null;
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.\-_]/g, '-');
  const path = `${animalId}/${Date.now()}-${safeName}`;
  const { error } = await supabaseClient.storage.from('animal-photos').upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = supabaseClient.storage.from('animal-photos').getPublicUrl(path);
  return data.publicUrl;
}

async function saveAnimal(event) {
  event.preventDefault();
  hideNotice(dashboardNotice);
  const id = fields.id.value || crypto.randomUUID();
  let photoUrl = currentAnimals.find((a) => a.id === id)?.photo_url || null;

  try {
    const file = fileInput.files[0];
    if (file) photoUrl = await uploadPhoto(file, id);

    const payload = {
      id,
      name: fields.name.value.trim(),
      species: fields.species.value,
      breed: fields.breed.value.trim() || null,
      age: fields.age.value.trim() || null,
      sex: fields.sex.value,
      status: fields.status.value,
      description: fields.description.value.trim() || null,
      photo_url: photoUrl,
    };

    const { error } = await supabaseClient.from('animals').upsert(payload);
    if (error) throw error;

    resetForm();
    showNotice(dashboardNotice, 'Animal enregistré avec succès.');
    await loadAnimals();
  } catch (error) {
    showNotice(dashboardNotice, `Erreur lors de l’enregistrement : ${error.message}`, true);
  }
}

async function deleteAnimal(id) {
  const animal = currentAnimals.find((a) => a.id === id);
  if (!animal || !confirm(`Supprimer ${animal.name} ?`)) return;
  const { error } = await supabaseClient.from('animals').delete().eq('id', id);
  if (error) {
    showNotice(dashboardNotice, `Impossible de supprimer l’animal : ${error.message}`, true);
    return;
  }
  showNotice(dashboardNotice, `${animal.name} a été supprimé.`);
  await loadAnimals();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}

async function updateView(session) {
  if (session) {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
    await loadAnimals();
  } else {
    loginView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
    logoutBtn.classList.add('hidden');
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideNotice(loginNotice);
  const { error } = await supabaseClient.auth.signInWithPassword({ email: document.getElementById('email').value.trim(), password: document.getElementById('password').value });
  if (error) showNotice(loginNotice, error.message, true);
});

logoutBtn.addEventListener('click', async () => { await supabaseClient.auth.signOut(); });
newAnimalBtn.addEventListener('click', () => openForm());
document.getElementById('cancelFormBtn').addEventListener('click', resetForm);
animalForm.addEventListener('submit', saveAnimal);
fileInput.addEventListener('change', () => { document.getElementById('fileName').textContent = fileInput.files[0]?.name || 'Aucune nouvelle photo sélectionnée.'; });
tableBody.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const animal = currentAnimals.find((a) => a.id === button.dataset.id);
  if (button.dataset.action === 'edit') openForm(animal);
  if (button.dataset.action === 'delete') deleteAnimal(button.dataset.id);
});

supabaseClient.auth.onAuthStateChange((_event, session) => updateView(session));

(async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  await updateView(session);
})();
