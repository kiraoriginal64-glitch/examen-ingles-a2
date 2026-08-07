import { createClient } from '@supabase/supabase-js'

// ¡Reemplaza estos valores con los tuyos!
const supabaseUrl = 'https://gbydjljjnukydqfylzvf.supabase.co'
const supabaseAnonKey = 'sb_publishable_gqhBLzwSHc_JZwie0ms7xw_ZkUqGIdk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)