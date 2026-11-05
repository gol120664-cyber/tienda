import { createClient } from '@supabase/supabase-js'

// Las dos variables se leen del archivo .env (o de las variables de Vercel).
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const configured = Boolean(url && key)

export const supabase = configured ? createClient(url, key) : null

// Cliente temporal (no guarda sesión) usado solo para crear usuarios nuevos
// sin cerrar la sesión del administrador.
export function clienteTemporal() {
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: 'hormymet-temporal',
    },
  })
}
