// Switch to mock implementation by uncommenting the next line and commenting the real one
import { supabase as mockSupabase } from './mockSupabase';
// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// export const supabase = createClient(
//   supabaseUrl || '',
//   supabaseAnonKey || ''
// );

export const supabase = mockSupabase;
