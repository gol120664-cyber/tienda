import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import Productos from './admin/Productos.jsx'
import Categorias from './admin/Categorias.jsx'
import Usuarios from './admin/Usuarios.jsx'
import Ajustes from './admin/Ajustes.jsx'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function entrar(e) {
    e.preventDefault()
    setCargando(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) setError('Correo o contraseña incorrectos.')
    setCargando(false)
  }

  return (
    <div className="center-screen">
      <form className="card-msg form" onSubmit={entrar} style={{ gap: 14 }}>
        <h2>Panel de administración</h2>
        {error && <div className="aviso error">{error}</div>}
        <label>
          Correo
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Contraseña
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="btn" disabled={cargando}>
          {cargando ? 'Entrando...' : 'Entrar'}
        </button>
        <a href="/" className="help">← Volver a la tienda</a>
      </form>
    </div>
  )
}

export default function Admin() {
  const [session, setSession] = useState(undefined)
  const [perfil, setPerfil] = useState(undefined)
  const [tab, setTab] = useState('productos')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const uid = session?.user?.id
  useEffect(() => {
    if (!uid) {
      setPerfil(undefined)
      return
    }
    supabase
      .from('perfiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle()
      .then(({ data }) => setPerfil(data || { rol: 'sin_acceso' }))
  }, [uid])

  if (session === undefined) return <div className="loading">Cargando...</div>
  if (!session) return <Login />
  if (perfil === undefined) return <div className="loading">Cargando...</div>

  const salir = () => supabase.auth.signOut()

  if (perfil.rol === 'sin_acceso') {
    return (
      <div className="center-screen">
        <div className="card-msg">
          <h2>Sin acceso</h2>
          <p>
            Tu usuario ({session.user.email}) todavía no tiene permisos. Pide a un administrador que
            te asigne un rol.
          </p>
          <p>
            <button className="btn sm gris" onClick={salir}>Cerrar sesión</button>
          </p>
        </div>
      </div>
    )
  }

  const esAdmin = perfil.rol === 'admin'
  const tabs = [
    ['productos', 'Productos'],
    ['categorias', 'Categorías'],
    ...(esAdmin ? [['usuarios', 'Usuarios']] : []),
    ['ajustes', 'Ajustes'],
  ]

  return (
    <div className="adm">
      <div className="adm-top">
        <strong>HORMyMET · Panel</strong>
        <div className="right">
          <span className="who">
            {session.user.email} ({esAdmin ? 'administrador' : 'empleado'})
          </span>
          <a href="/">Ver tienda</a>
          <button onClick={salir}>Cerrar sesión</button>
        </div>
      </div>
      <div className="adm-tabs">
        {tabs.map(([id, nombre]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            {nombre}
          </button>
        ))}
      </div>
      <div className="adm-body">
        {tab === 'productos' && <Productos />}
        {tab === 'categorias' && <Categorias />}
        {tab === 'usuarios' && esAdmin && <Usuarios miId={uid} />}
        {tab === 'ajustes' && <Ajustes esAdmin={esAdmin} />}
      </div>
    </div>
  )
}
