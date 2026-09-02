(() => {
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

  function setNotice(message = '', error = false) {
    notice.textContent = message;
    notice.classList.toggle('hidden', !message);
    notice.classList.toggle('error', !!error);
  }

  function renderMode(clearNotice = true) {
    const signup = mode === 'signup';
    title.textContent = signup ? 'Créer un compte' : 'Connexion équipe';
    subtitle.textContent = signup
      ? 'Créez votre accès pour rejoindre l’espace privé de la SPAA.'
      : 'Connectez-vous pour accéder au back-office et gérer les animaux du refuge.';
    submit.textContent = signup ? 'Créer mon compte' : 'Se connecter';
    toggle.textContent = signup ? 'J’ai déjà un compte' : 'Créer un compte';
    helper.textContent = signup
      ? 'Un e-mail de confirmation peut être demandé selon la configuration Supabase.'
      : 'Accès réservé à l’équipe du refuge.';
    back.textContent = 'Retour à l’administration';
    if (clearNotice) setNotice();
  }

  function getClient() {
    if (!window.supabaseClient || !window.supabaseClient.auth) {
      throw new Error('Supabase n’est pas chargé. Vérifiez votre connexion internet puis rechargez la page.');
    }
    return window.supabaseClient;
  }

  if (toggle) toggle.addEventListener('click', () => {
    mode = mode === 'login' ? 'signup' : 'login';
    renderMode();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setNotice();

    const client = getClient();
    const credentials = {
      email: email.value.trim(),
      password: password.value
    };

    submit.disabled = true;
    submit.textContent = mode === 'signup' ? 'Création…' : 'Connexion…';

    try {
      if (!credentials.email || !credentials.password) {
        throw new Error('Veuillez renseigner votre e-mail et votre mot de passe.');
      }

      if (credentials.password.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
      }

      if (mode === 'signup') {
        const { data, error } = await client.auth.signUp({
          ...credentials,
          options: {
            emailRedirectTo: `${window.location.origin}/connexion.html`
          }
        });

        if (error) throw error;

        if (data?.session) {
          window.location.replace('admin.html');
          return;
        }

        mode = 'login';
        renderMode(false);
        setNotice('Compte créé. Vérifiez votre boîte e-mail puis connectez-vous si une confirmation est demandée.');
      } else {
        const { data, error } = await client.auth.signInWithPassword(credentials);
        if (error) throw error;

        if (!data?.session) {
          throw new Error('Connexion effectuée mais aucune session n’a été créée. Vérifiez la configuration Auth de Supabase.');
        }

        window.location.replace('admin.html');
        return;
      }
    } catch (error) {
      console.error('[SPAA Auth]', error);
      setNotice(error?.message || 'Une erreur est survenue pendant l’authentification.', true);
    } finally {
      submit.disabled = false;
      if (document.body.contains(submit)) {
        submit.textContent = mode === 'signup' ? 'Créer mon compte' : 'Se connecter';
      }
    }
  });

  async function init() {
    renderMode();

    if (!window.supabaseClient) {
      setNotice('Le module Supabase n’est pas chargé. Vérifiez que JS/supabase.js est bien publié sur Vercel.', true);
      return;
    }

    try {
      const client = getClient();
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (data?.session) {
        window.location.replace('admin.html');
      }
    } catch (error) {
      console.error('[SPAA Auth init]', error);
      setNotice(error?.message || 'Impossible de contacter Supabase.', true);
    }
  }

  init();
})();
