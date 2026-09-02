// Configuration Supabase SPAA
// La clé sb_publishable_... est prévue pour être utilisée côté navigateur.
// Ne jamais mettre ici une clé sb_secret_... / service_role.
const SUPABASE_URL = 'https://oyqwwjhwkgpsdpfgujxb.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Eb4l0PpujEjVknS6LAy4SQ_v90h0jbg';

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
