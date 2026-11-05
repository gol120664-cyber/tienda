import Home from './pages/Home.jsx'
import Admin from './pages/Admin.jsx'
import { configured } from './lib/supabase.js'

function SinConfig() {
  return (
    <div className="center-screen">
      <div className="card-msg">
        <h2>Falta conectar Supabase</h2>
        <p>
          La aplicación no encontró las variables <b>VITE_SUPABASE_URL</b> y{' '}
          <b>VITE_SUPABASE_ANON_KEY</b>.
        </p>
        <p>
          En Vercel: Settings → Environment Variables → agrégalas (o impórtalas desde el archivo
          .env) y vuelve a publicar (Redeploy).
        </p>
      </div>
    </div>
  )
}

export default function App() {
  if (!configured) return <SinConfig />
  return window.location.pathname.startsWith('/admin') ? <Admin /> : <Home />
}
