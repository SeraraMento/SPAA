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
  const passwordPanel = document.getElementById('passwordChangePanel');
  const passwordChangeForm = document.getElementById('passwordChangeForm');
  const newPassword = document.getElementById('newPassword');
  const confirmPassword = document.getElementById('confirmPassword');
  const passwordChangeSubmit = document.getElementById('passwordChangeSubmit');

  let mode = 'login';

  function setNotice(message = '', error = false) {
    notice.textContent = message;
    notice.classList.toggle('hidden', !message);
    notice.classList.toggle('error', !!error);
  }

  function renderMode(clearNotice = true) {
    const signup = mode === 'signup';
    form.classList.remove('hidden');
    passwordPanel?.classList.add('hidden');
    title.textContent = signup ? 'Créer un compte' : 'Connexion équipe';
    subtitle.textContent = signup
      ? 'Créez votre accès pour rejoindre l’espace privé de la SPAA.'
      : 'Connectez-vous pour accéder au back-office et gérer les contenus du refuge.';
    submit.textContent = signup ? 'Créer mon compte' : 'Se connecter';
    toggle.textContent = signup ? 'J’ai déjà un compte' : 'Créer un compte';
    helper.textContent = signup
      ? 'Un compte nouvellement créé est en attente de validation par l’équipe.'
      : 'Accès réservé à l’équipe du refuge.';
    back.textContent = 'Retour au site';
    if (clearNotice) setNotice();
  }

  function getClient() {
    if (!window.supabaseClient?.auth) {
      throw new Error('Supabase n’est pas chargé. Vérifiez votre connexion internet puis rechargez la page.');
    }
    return window.supabaseClient;
  }

  async function getTeamMember(userId) {
    const client = getClient();
    const { data, error } = await client
      .from('team_members')
      .select('role,must_change_password,active')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  async function afterAuthenticated(session) {
    if (!session?.user) return;
    try {
      const member = await getTeamMember(session.user.id);
      if (!member) {
        // Compatibilité avec les comptes historiques créés avant la mise en place de team_members.
        window.location.replace('admin.html');
        return;
      }
      if (member.active === false || member.role === 'pending') {
        setNotice('Votre compte est en attente de validation par un administrateur. Vous ne pouvez pas encore accéder au back-office.', true);
        return;
      }
      if (member.must_change_password) {
        form.classList.add('hidden');
        toggle.classList.add('hidden');
        passwordPanel.classList.remove('hidden');
        title.textContent = 'Première connexion';
        subtitle.textContent = '';
        helper.textContent = '';
        back.textContent = 'Retour au site';
        setNotice('Pour votre sécurité, vous devez choisir un nouveau mot de passe avant de continuer.');
        return;
      }
      window.location.replace('admin.html');
    } catch (error) {
      console.error('[SPAA Team]', error);
      setNotice(error?.message || 'Impossible de vérifier les droits de ce compte.', true);
    }
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
          options: { emailRedirectTo: `${window.location.origin}/connexion.html` }
        });
        if (error) throw error;

        if (data?.session) {
          await afterAuthenticated(data.session);
          return;
        }

        mode = 'login';
        renderMode(false);
        setNotice('Compte créé. Vérifiez votre boîte e-mail si une confirmation est demandée. Votre compte devra ensuite être validé par l’équipe.');
      } else {
        const { data, error } = await client.auth.signInWithPassword(credentials);
        if (error) throw error;
        if (!data?.session) {
          throw new Error('Connexion effectuée mais aucune session n’a été créée.');
        }
        await afterAuthenticated(data.session);
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

  passwordChangeForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setNotice();

    const p1 = newPassword.value;
    const p2 = confirmPassword.value;
    if (p1.length < 8) {
      setNotice('Le nouveau mot de passe doit contenir au moins 8 caractères.', true);
      return;
    }
    if (p1 !== p2) {
      setNotice('Les deux mots de passe ne correspondent pas.', true);
      return;
    }

    passwordChangeSubmit.disabled = true;
    passwordChangeSubmit.textContent = 'Modification…';
    try {
      const client = getClient();
      const { data: updated, error: updateError } = await client.auth.updateUser({ password: p1 });
      if (updateError) throw updateError;

      const userId = updated?.user?.id || (await client.auth.getUser()).data?.user?.id;
      if (!userId) throw new Error('Impossible d’identifier votre compte.');

      const { error: flagError } = await client
        .from('team_members')
        .update({ must_change_password: false })
        .eq('user_id', userId);
      if (flagError) throw flagError;

      setNotice('Mot de passe modifié avec succès. Redirection…');
      setTimeout(() => window.location.replace('admin.html'), 700);
    } catch (error) {
      console.error('[SPAA Password]', error);
      setNotice(error?.message || 'Impossible de modifier le mot de passe.', true);
    } finally {
      passwordChangeSubmit.disabled = false;
      passwordChangeSubmit.textContent = 'Modifier mon mot de passe';
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
      if (data?.session) await afterAuthenticated(data.session);
    } catch (error) {
      console.error('[SPAA Auth init]', error);
      setNotice(error?.message || 'Impossible de contacter Supabase.', true);
    }
  }

  init();
})();
