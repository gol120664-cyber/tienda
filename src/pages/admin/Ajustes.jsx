import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'

const CAMPOS = [
  ['empresa', 'Nombre de la empresa'],
  ['whatsapp', 'WhatsApp para cotizaciones (solo números, con código de país. Ej: 59164601072)'],
  ['telefono_visible', 'Teléfono que se muestra en la web (Ej: +591 64601072)'],
  ['pie', 'Texto del pie de página'],
]

export default function Ajustes({ esAdmin }) {
  const [valores, setValores] = useState({})
  const [msg, setMsg] = useState(null)
  const [msgPass, setMsgPass] = useState(null)
  const [pass, setPass] = useState('')

  useEffect(() => {
    supabase
      .from('ajustes')
      .select('*')
      .then(({ data }) => setValores(Object.fromEntries((data || []).map((x) => [x.clave, x.valor]))))
  }, [])

  async function guardar(e) {
    e.preventDefault()
    const filas = CAMPOS.map(([clave]) => ({ clave, valor: (valores[clave] || '').trim() }))
    const { error } = await supabase.from('ajustes').upsert(filas)
    setMsg(error ? { t: 'error', m: error.message } : { t: 'ok', m: 'Ajustes guardados.' })
  }

  async function cambiarPass(e) {
    e.preventDefault()
    const { error } = await supabase.auth.updateUser({ password: pass })
    if (error) setMsgPass({ t: 'error', m: error.message })
    else {
      setMsgPass({ t: 'ok', m: 'Contraseña actualizada.' })
      setPass('')
    }
  }

  return (
    <>
      {esAdmin && (
        <>
          <div className="adm-head"><h2>Datos de la empresa</h2></div>
          {msg && <div className={'aviso ' + msg.t}>{msg.m}</div>}
          <form className="form" onSubmit={guardar}>
            {CAMPOS.map(([clave, etiqueta]) => (
              <label key={clave}>
                {etiqueta}
                <input
                  type="text"
                  value={valores[clave] || ''}
                  onChange={(e) => setValores({ ...valores, [clave]: e.target.value })}
                />
              </label>
            ))}
            <div className="btns"><button className="btn sm">Guardar</button></div>
          </form>
        </>
      )}

      <div className="adm-head"><h2>Mi contraseña</h2></div>
      {msgPass && <div className={'aviso ' + msgPass.t}>{msgPass.m}</div>}
      <form className="form" onSubmit={cambiarPass}>
        <label>
          Nueva contraseña (mínimo 6 caracteres)
          <input type="password" required minLength={6} value={pass} onChange={(e) => setPass(e.target.value)} />
        </label>
        <div className="btns"><button className="btn sm">Cambiar contraseña</button></div>
      </form>
    </>
  )
}
