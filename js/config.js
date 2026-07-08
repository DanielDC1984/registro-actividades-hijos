// ============================================================
// 🔥 CONFIGURACIÓN SUPABASE
// ============================================================
// Nota: la anon key es pública por diseño (Supabase la protege con
// Row Level Security en el backend), por eso puede vivir en el cliente.
const SUPABASE_URL = "https://gomgfwqqvufxzkcsfgkf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvbWdmd3FxdnVmeHprY3NmZ2tmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NTgyMTgsImV4cCI6MjA5OTAzNDIxOH0.HpRb8p4EIJSQg6xjQx2LO2TJt8L6eG5FOZjnxkqeK_s";
const FAMILIA_ID = "familia_default";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
