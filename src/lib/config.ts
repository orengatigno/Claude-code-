// Centralized access to environment configuration.
// Expo inlines `process.env.EXPO_PUBLIC_*` at build time.

export const config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',

  aiApiBaseUrl: process.env.EXPO_PUBLIC_AI_API_BASE_URL ?? '',
  aiApiKey: process.env.EXPO_PUBLIC_AI_API_KEY ?? '',

  // When false (default), the app runs fully offline using mock AI functions.
  // Flip to true once Supabase + AI keys are wired up.
  useRealAi: process.env.EXPO_PUBLIC_USE_REAL_AI === 'true',
};

export const hasSupabase = Boolean(config.supabaseUrl && config.supabaseAnonKey);
