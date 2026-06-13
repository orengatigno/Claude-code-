import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { config, hasSupabase } from './config';

// A null client means "not configured" — the storage layer falls back to a
// local in-memory/AsyncStorage store so the app still runs without Supabase.
export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: false },
    })
  : null;
