(() => {
  const form = document.getElementById('authForm');
  const email = document.getElementById('authEmail');
  const password = document.getElementById('authPassword');
  const passwordConfirm = document.getElementById('authPasswordConfirm');
  const passwordConfirmField = document.getElementById('authPasswordConfirmField');
  const notice = document.getElementById('authNotice');
  const submit = document.getElementById('authSubmit');
  const toggle = document.getElementById('authToggle');
  const title = document.getElementById('authTitle');
  const subtitle = document.getElementById('authSubtitle');
  const helper = document.getElementById('authHelper');
  const back = document.getElementById('backAdmin');

  let mode = 'login';
  let mustChangePassword = false;

  function setNotice(message = '', error = false) {
    notice.textContent = message;
    notice.classList.toggle('hidden', !message);
    notice.classList.toggle('error', !!error);
  }

  function renderMode(clearNotice = true) {
    const signup = mode === 'signup';
    const change = mode === 'change-password';
    title.textContent = change ? 'Choisissez votre nouveau mot de passe' : (signup ? 'Créer un compte' : 'Connexion équipe');
    subtitle.textContent = change
      ? 'Première connexion : votre mot de passe doit être modifié avant d’accéder à l’espace équipe.'
      : (signup
        ? 'Créez un compte. Il devra être validé par un administrateur avant d’accéder au back-office.'
        : 'Connectez-vous pour accéder au back-office et gérer le site de la SPAA.');

    email.closest('.auth-field')?.classList.toggle('hidden', change);
    passwordConfirmField?.classList.toggle('hidden', !change);
    password.autocomplete = change ? 'new-password' : (signup ? 'new-password' : 'current-password');
    if (passwordConfirm) passwordConfirm.autocomplete = 'new-password';

    submit.textContent = change ? 'Modifier mon mot de passe' : (signup ? 'Créer mon compte' : 'Se connecter');
    toggle.classList.toggle('hidden', change);
    helper.textContent = change
      ? 'Le changement se fait directement sur le site. Aucun e-mail de réinitialisation n’est nécessaire.'
      : (signup
        ? 'Utilisez une adresse fictive uniquement si votre configuration de classe le prévoit.'
        : 'Accès réservé aux membres autorisés de l’équipe.');
    back.textContent = 'Retour au site';
    back.href = 'index.html';
    if (clearNotice) setNotice();
  }

  function getClient() {
    if (!window.supabaseClient || !window.supabaseClient.auth) {
      throw new Error('Supabase n’est pas chargé. Vérifiez votre connexion internet puis rechargez la page.');
    }
    return window.supabaseClient;
  }

  async function getTeamMember(client, userId) {
    const { data, error } = await client
      .from('team_members')
      .select('role,active,must_change_password')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function finishLogin(client, session) {
    const member = await getTeamMember(client, session.user.id);

    if (member?.must_change_password === true) {
      mustChangePassword = true;
      form.dataset.modeBeforeChange = mode;
      mode = 'change-password';
      renderMode(false);
      password.value = '';
      if (passwordConfirm) passwordConfirm.value = '';
      setNotice('Première connexion : définissez maintenant votre nouveau mot de passe.');
      password.focus();
      return;
    }

    if (!member || member.active !== true || member.role === 'pending') {
      await client.auth.signOut();
      throw new Error('Votre compte est en attente de validation par un administrateur.');
    }

    window.location.replace('admin.html');
  }

  if (toggle) {
    toggle.addEventListener('click', () => {
      mode = mode === 'login' ? 'signup' : 'login';
      renderMode();
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setNotice();
    submit.disabled = true;

    try {
      const client = getClient();
      const emailValue = email.value.trim();
      const passwordValue = password.value;

      if (mode === 'change-password') {
        if (passwordValue.length < 8) throw new Error('Le nouveau mot de passe doit contenir au moins 8 caractères.');
        if (passwordValue !== passwordConfirm.value) throw new Error('Les deux mots de passe ne correspondent pas.');

        submit.textContent = 'Modification…';
        const { error: updateError } = await client.auth.updateUser({ password: passwordValue });
        if (updateError) throw updateError;

        const { data: sessionData, error: sessionError } = await client.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData?.session) throw new Error('La session a expiré. Reconnectez-vous.');

        const { error: memberError } = await client
          .from('team_members')
          .update({ must_change_password: false })
          .eq('user_id', sessionData.session.user.id);
        if (memberError) throw memberError;

        mustChangePassword = false;
        setNotice('Mot de passe modifié avec succès. Redirection vers l’espace équipe…');
        setTimeout(() => window.location.replace('admin.html'), 700);
        return;
      }

      if (!emailValue || !passwordValue) throw new Error('Veuillez renseigner votre e-mail et votre mot de passe.');
      if (passwordValue.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères.');

      submit.textContent = mode === 'signup' ? 'Création…' : 'Connexion…';

      if (mode === 'signup') {
        const { data, error } = await client.auth.signUp({ email: emailValue, password: passwordValue });
        if (error) throw error;

        if (data?.session) {
          await finishLogin(client, data.session);
          return;
        }

        mode = 'login';
        renderMode(false);
        setNotice('Compte créé. Il doit être validé par un administrateur avant l’accès à l’espace équipe.');
      } else {
        const { data, error } = await client.auth.signInWithPassword({ email: emailValue, password: passwordValue });
        if (error) throw error;
        if (!data?.session) throw new Error('Connexion effectuée mais aucune session n’a été créée.');
        await finishLogin(client, data.session);
        return;
      }
    } catch (error) {
      console.error('[SPAA Auth]', error);
      setNotice(error?.message || 'Une erreur est survenue pendant l’authentification.', true);
    } finally {
      submit.disabled = false;
      if (document.body.contains(submit) && mode !== 'change-password') {
        submit.textContent = mode === 'signup' ? 'Créer mon compte' : 'Se connecter';
      }
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
      if (data?.session) await finishLogin(client, data.session);
    } catch (error) {
      console.error('[SPAA Auth init]', error);
      setNotice(error?.message || 'Impossible de contacter Supabase.', true);
    }
  }

  init();
})();
