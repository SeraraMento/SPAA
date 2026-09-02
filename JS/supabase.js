// Configuration Supabase SPAA
// Cette clé publishable peut être exposée dans le navigateur.
// Ne jamais utiliser ici une clé sb_secret_... ou service_role.
const SUPABASE_URL = 'https://oyqwwjhwkgpsdpfgujxb.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Eb4l0PpujEjVknS6LAy4SQ_v90h0jbg';

if (!window.supabase?.createClient) {
  console.error('[SPAA] La librairie Supabase JS n’est pas disponible.');
} else {
  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
}
