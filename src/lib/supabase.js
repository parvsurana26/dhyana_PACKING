import { createClient } from '@supabase/supabase-js';

const fallbackSupabaseUrl = 'https://wybojoozkfpmczdfgzkx.supabase.co';
const fallbackSupabaseKey = 'sb_publishable_fMuSF1EHO3lsAsPBgr6HQw_Yc3rX2at';

const configuredUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
const configuredKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

const isDhyanaProject = configuredUrl.includes('wybojoozkfpmczdfgzkx.supabase.co');
const supabaseUrl = isDhyanaProject ? configuredUrl : fallbackSupabaseUrl;
const supabaseKey = isDhyanaProject && configuredKey ? configuredKey : fallbackSupabaseKey;

export const supabase = createClient(supabaseUrl, supabaseKey);
