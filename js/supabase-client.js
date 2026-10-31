/* Public browser configuration only. Never put a secret/service_role key here. */
window.ayfarSupabase = window.supabase.createClient(window.AYFAR_SUPABASE_CONFIG.url, window.AYFAR_SUPABASE_CONFIG.publishableKey);
