// ============================================================
// CLIENT SUPABASE
// Ce fichier crée la connexion à ta base de données
// Tu l'importes partout où tu as besoin d'accéder aux données
// ============================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// On utilise la "service role key" (pas l'anon key) car c'est
// un outil interne — pas besoin de Row Level Security
export const supabase = createClient(supabaseUrl, supabaseKey)
