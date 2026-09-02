const form = document.getElementById('authForm');
const email = document.getElementById('authEmail');
const password = document.getElementById('authPassword');
const notice = document.getElementById('authNotice');
const submit = document.getElementById('authSubmit');
const toggle = document.getElementById('authToggle');
const title = document.getElementById('authTitle');
const subtitle = document.getElementById('authSubtitle');
const helper = document.getElementById('authHelper');
const back = document.getElementById('backAdmin');

let mode = 'login';

function setNotice(message='', error=false){
  notice.textContent = message;
  notice.classList.toggle('hidden', !message);
  notice.classList.toggle('error', error);
}

function renderMode(){
  const signup = mode === 'signup';
  title.textContent = signup ? 'Créer un compte' : 'Connexion équipe';
  subtitle.textContent = signup
    ? 'Créez votre accès pour rejoindre l’espace privé de la SPAA.'
    : 'Connectez-vous pour accéder au back-office et gérer les animaux du refuge.';
  submit.textContent = signup ? 'Créer mon compte' : 'Se connecter';
  toggle.textContent = signup ? 'J’ai déjà un compte' : 'Créer un compte';
  helper.textContent = signup
    ? 'Après inscription, votre compte peut nécessiter une confirmation par e-mail selon les réglages Supabase.'
    : 'Accès réservé à l’équipe du refuge.';
  back.textContent = 'Retour à l’administration';
  setNotice();
}

toggle.addEventListener('click', () => {
  mode = mode === 'login' ? 'signup' : 'login';
  renderMode();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setNotice();
  submit.disabled = true;
  submit.textContent = mode === 'signup' ? 'Création…' : 'Connexion…';
  const credentials = { email: email.value.trim(), password: password.value };

  try {
    if (mode === 'signup') {
      const { data, error } = await supabaseClient.auth.signUp(credentials);
      if (error) throw error;
      if (data.session) {
        window.location.href = 'admin.html';
      } else {
        setNotice('Compte créé. Vérifiez votre e-mail si une confirmation est demandée, puis connectez-vous.');
        mode = 'login';
        renderMode();
      }
    } else {
      const { data, error } = await supabaseClient.auth.signInWithPassword(credentials);
      if (error) throw error;
      if (data.session) window.location.href = 'admin.html';
    }
  } catch (error) {
    setNotice(error.message || 'Une erreur est survenue.', true);
  } finally {
    submit.disabled = false;
    renderMode();
  }
});

(async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) window.location.href = 'admin.html';
  renderMode();
})();
