import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://drkhwnqkvlvuhtstamhx.supabase.co'
const supabaseAnonKey = 'sb_publishable_R-w_9uQCeotJbtfvm_CEyw_K5BOWXAy'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)