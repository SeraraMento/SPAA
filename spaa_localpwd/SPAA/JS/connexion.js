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
      ? 'Créez votre compte équipe. Aucun e-mail de confirmation n’est nécessaire pour ce projet.'
      : 'Connectez-vous pour accéder à votre espace équipe.';
    submit.textContent = signup ? 'Créer mon compte' : 'Se connecter';
    toggle.textContent = signup ? 'J’ai déjà un compte' : 'Créer un compte';
    helper.textContent = signup
      ? 'Après création, le changement du mot de passe se fait directement sur ce site.'
      : 'Accès réservé aux membres de l’équipe.';
    back.textContent = 'Retour au site';
    if (clearNotice) setNotice();
  }

  function getClient() {
    if (!window.supabaseClient?.auth) throw new Error('Supabase n’est pas chargé. Rechargez la page.');
    return window.supabaseClient;
  }

  async function getMembership(client, userId) {
    const { data, error } = await client
      .from('team_members')
      .select('role, active, must_change_password')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  function showPasswordChange() {
    const existing = document.getElementById('passwordChangePanel');
    if (existing) existing.remove();
    form.classList.add('hidden');
    toggle.classList.add('hidden');
    title.textContent = 'Choisissez votre nouveau mot de passe';
    subtitle.textContent = 'Première connexion : le changement se fait directement sur le site. Aucun e-mail n’est envoyé.';
    helper.textContent = 'Choisissez un mot de passe d’au moins 8 caractères.';
    const panel = document.createElement('div');
    panel.id = 'passwordChangePanel';
    panel.innerHTML = `
      <form id="passwordChangeForm">
        <div class="auth-field"><label for="newPassword">Nouveau mot de passe</label><input id="newPassword" type="password" minlength="8" autocomplete="new-password" required></div>
        <div class="auth-field"><label for="confirmPassword">Confirmer le mot de passe</label><input id="confirmPassword" type="password" minlength="8" autocomplete="new-password" required></div>
        <button class="btn btn-primary auth-submit" type="submit">Modifier mon mot de passe</button>
      </form>`;
    form.parentElement.insertBefore(panel, form);
    panel.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      setNotice();
      const p1 = document.getElementById('newPassword').value;
      const p2 = document.getElementById('confirmPassword').value;
      if (p1.length < 8) return setNotice('Le mot de passe doit contenir au moins 8 caractères.', true);
      if (p1 !== p2) return setNotice('Les deux mots de passe ne correspondent pas.', true);
      const client = getClient();
      const btn = panel.querySelector('button');
      btn.disabled = true;
      btn.textContent = 'Modification…';
      try {
        const { error } = await client.auth.updateUser({ password: p1 });
        if (error) throw error;
        const { data: sessionData } = await client.auth.getSession();
        if (!sessionData?.session?.user) throw new Error('Session introuvable après la modification.');
        const { error: updateError } = await client.from('team_members').update({ must_change_password: false }).eq('user_id', sessionData.session.user.id);
        if (updateError) throw updateError;
        const membership = await getMembership(client, sessionData.session.user.id);
        if (!membership?.active || membership.role === 'pending') {
          setNotice('Mot de passe modifié. Votre compte est maintenant en attente de validation par un administrateur.');
          return;
        }
        window.location.replace('admin.html');
      } catch (err) {
        setNotice(err?.message || 'Impossible de modifier le mot de passe.', true);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Modifier mon mot de passe';
      }
    });
  }

  async function afterAuth(client, user) {
    const membership = await getMembership(client, user.id);
    if (membership?.must_change_password) {
      showPasswordChange();
      return;
    }
    if (!membership || membership.role === 'pending' || membership.active === false) {
      setNotice('Votre compte n’est pas encore autorisé à accéder au back-office. Un administrateur doit valider votre compte.', true);
      return;
    }
    window.location.replace('admin.html');
  }

  toggle?.addEventListener('click', () => { mode = mode === 'login' ? 'signup' : 'login'; renderMode(); });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setNotice();
    const client = getClient();
    const credentials = { email: email.value.trim(), password: password.value };
    submit.disabled = true;
    submit.textContent = mode === 'signup' ? 'Création…' : 'Connexion…';
    try {
      if (!credentials.email || !credentials.password) throw new Error('Veuillez renseigner votre e-mail et votre mot de passe.');
      if (credentials.password.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
      if (mode === 'signup') {
        const { data, error } = await client.auth.signUp({ email: credentials.email, password: credentials.password });
        if (error) throw error;
        if (!data?.session) throw new Error('Le compte a été créé, mais Supabase attend encore une confirmation e-mail. Pour ce projet scolaire, désactivez « Confirm email » dans Supabase > Authentication > Providers > Email.');
        await afterAuth(client, data.user);
      } else {
        const { data, error } = await client.auth.signInWithPassword(credentials);
        if (error) throw error;
        await afterAuth(client, data.user);
      }
    } catch (error) {
      console.error('[SPAA Auth]', error);
      setNotice(error?.message || 'Une erreur est survenue.', true);
    } finally {
      submit.disabled = false;
      if (document.body.contains(submit) && !submit.classList.contains('hidden')) submit.textContent = mode === 'signup' ? 'Créer mon compte' : 'Se connecter';
    }
  });

  async function init() {
    renderMode();
    if (!window.supabaseClient) {
      setNotice('Le module Supabase n’est pas chargé.', true);
      return;
    }
    try {
      const client = getClient();
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (data?.session?.user) await afterAuth(client, data.session.user);
    } catch (error) {
      console.error('[SPAA Auth init]', error);
      setNotice(error?.message || 'Impossible de contacter Supabase.', true);
    }
  }
  init();
})();
