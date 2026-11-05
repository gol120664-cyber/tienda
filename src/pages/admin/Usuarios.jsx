import { useEffect, useState } from 'react'
import { supabase, clienteTemporal } from '../../lib/supabase.js'

const ROLES = {
  admin: 'Administrador (todo)',
  empleado: 'Empleado (productos y categorías)',
  sin_acceso: 'Sin acceso',
}

export default function Usuarios({ miId }) {
  const [lista, setLista] = useState([])
  const [form, setForm] = useState(null)
  const [msg, setMsg] = useState(null)
  const [trabajando, setTrabajando] = useState(false)

  async function cargar() {
    const { data, error } = await supabase.from('perfiles').select('*').order('creado_en')
    if (error) setMsg({ t: 'error', m: error.message })
    setLista(data || [])
  }
  useEffect(() => {
    cargar()
  }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function crear(e) {
    e.preventDefault()
    setTrabajando(true)
    setMsg(null)
    try {
      const temp = clienteTemporal()
      const { data, error } = await temp.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: { data: { nombre: form.nombre.trim() } },
      })
      if (error) throw error
      if (!data.user || data.user.identities?.length === 0) {
        throw new Error('Ese correo ya está registrado.')
      }
      const { error: e2 } = await supabase.rpc('admin_asignar_rol', {
        p_id: data.user.id,
        p_rol: form.rol,
        p_nombre: form.nombre.trim(),
      })
      if (e2) throw e2
      setForm(null)
      setMsg({
        t: 'ok',
        m: 'Usuario creado. Ya puede entrar en /admin con su correo y contraseña.',
      })
      cargar()
    } catch (err) {
      let m = err.message || 'No se pudo crear el usuario.'
      if (/password/i.test(m)) m = 'La contraseña debe tener al menos 6 caracteres.'
      if (/rate limit/i.test(m)) m = 'Demasiados intentos seguidos. Espera unos minutos e inténtalo de nuevo.'
      setMsg({ t: 'error', m })
    }
    setTrabajando(false)
  }

  async function cambiarRol(p, rol) {
    const { error } = await supabase.rpc('admin_asignar_rol', { p_id: p.id, p_rol: rol, p_nombre: null })
    setMsg(error ? { t: 'error', m: error.message } : { t: 'ok', m: 'Rol actualizado.' })
    cargar()
  }

  async function eliminar(p) {
    if (!window.confirm(`¿Eliminar al usuario ${p.email}? Ya no podrá entrar.`)) return
    const { error } = await supabase.rpc('admin_eliminar_usuario', { p_id: p.id })
    setMsg(error ? { t: 'error', m: error.message } : { t: 'ok', m: 'Usuario eliminado.' })
    cargar()
  }

  return (
    <>
      <div className="adm-head">
        <h2>Usuarios</h2>
        {!form && (
          <button
            className="btn sm"
            onClick={() => { setForm({ nombre: '', email: '', password: '', rol: 'empleado' }); setMsg(null) }}
          >
            + Crear usuario
          </button>
        )}
      </div>

      {msg && <div className={'aviso ' + msg.t}>{msg.m}</div>}

      {form && (
        <form className="form" onSubmit={crear}>
          <label>
            Nombre
            <input type="text" required value={form.nombre} onChange={(e) => set('nombre', e.target.value)} />
          </label>
          <div className="two">
            <label>
              Correo
              <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} />
            </label>
            <label>
              Contraseña (mínimo 6 caracteres)
              <input type="text" required minLength={6} value={form.password} onChange={(e) => set('password', e.target.value)} />
            </label>
          </div>
          <label>
            Permisos
            <select value={form.rol} onChange={(e) => set('rol', e.target.value)}>
              <option value="empleado">{ROLES.empleado}</option>
              <option value="admin">{ROLES.admin}</option>
            </select>
          </label>
          <div className="btns">
            <button className="btn sm" disabled={trabajando}>{trabajando ? 'Creando...' : 'Crear usuario'}</button>
            <button type="button" className="btn sm claro" onClick={() => setForm(null)}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="adm-list">
        {lista.map((p) => (
          <div className="adm-row" key={p.id}>
            <div className="info">
              <b>{p.nombre || p.email}{p.id === miId && <span className="tag">TÚ</span>}</b>
              <small>{p.email}</small>
            </div>
            <div className="acts">
              <select
                value={p.rol}
                disabled={p.id === miId}
                onChange={(e) => cambiarRol(p, e.target.value)}
                style={{ padding: 9, borderRadius: 6, border: '1px solid #d7dcda' }}
              >
                {Object.entries(ROLES).map(([v, n]) => (
                  <option key={v} value={v}>{n}</option>
                ))}
              </select>
              {p.id !== miId && (
                <button className="btn sm rojo" onClick={() => eliminar(p)}>Eliminar</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
