// Utilitaires d'accès à l'espace équipe.
async function getCurrentTeamMember() {
  if (!window.supabaseClient) throw new Error('Supabase n’est pas initialisé.');
  const { data: userData, error: userError } = await window.supabaseClient.auth.getUser();
  if (userError) throw userError;
  const user = userData?.user;
  if (!user) return null;

  const { data, error } = await window.supabaseClient
    .from('team_members')
    .select('user_id,role,active,must_change_password')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function getCurrentTeamRole() {
  const member = await getCurrentTeamMember();
  return member?.role || 'legacy';
}
