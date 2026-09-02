// Récupère le rôle de l'utilisateur connecté.
async function getCurrentTeamRole() {
  const { data, error } = await supabaseClient.rpc('current_user_role');
  if (error) throw error;
  return data || 'pending';
}
