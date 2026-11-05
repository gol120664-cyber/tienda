import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { slugify } from '../../lib/util.js'

const VACIO = { nombre: '', descripcion: '', orden: 0, activo: true }

export default function Categorias() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(null)
  const [msg, setMsg] = useState(null)

  async function cargar() {
    const { data, error } = await supabase.from('categorias').select('*').order('orden').order('nombre')
    if (error) setMsg({ t: 'error', m: error.message })
    setItems(data || [])
  }
  useEffect(() => {
    cargar()
  }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function guardar(e) {
    e.preventDefault()
    setMsg(null)
    const datos = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion,
      orden: Number(form.orden) || 0,
      activo: form.activo,
    }
    let res
    if (form.id) {
      res = await supabase.from('categorias').update(datos).eq('id', form.id)
    } else {
      res = await supabase.from('categorias').insert({ ...datos, slug: slugify(datos.nombre) })
    }
    if (res.error) {
      setMsg({
        t: 'error',
        m: res.error.message.includes('duplicate') ? 'Ya existe una categoría con ese nombre.' : res.error.message,
      })
      return
    }
    setForm(null)
    setMsg({ t: 'ok', m: 'Categoría guardada.' })
    cargar()
  }

  async function borrar(c) {
    if (!window.confirm(`¿Eliminar la categoría "${c.nombre}"? Sus productos quedarán "Sin categoría".`)) return
    const { error } = await supabase.from('categorias').delete().eq('id', c.id)
    setMsg(error ? { t: 'error', m: error.message } : { t: 'ok', m: 'Categoría eliminada.' })
    cargar()
  }

  return (
    <>
      <div className="adm-head">
        <h2>Categorías</h2>
        {!form && (
          <button className="btn sm" onClick={() => { setForm({ ...VACIO }); setMsg(null) }}>
            + Nueva categoría
          </button>
        )}
      </div>

      {msg && <div className={'aviso ' + msg.t}>{msg.m}</div>}

      {form && (
        <form className="form" onSubmit={guardar}>
          <label>
            Nombre
            <input type="text" required value={form.nombre} onChange={(e) => set('nombre', e.target.value)} />
          </label>
          <label>
            Descripción
            <textarea value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
          </label>
          <label>
            Orden (número menor = aparece primero)
            <input type="number" value={form.orden} onChange={(e) => set('orden', e.target.value)} />
          </label>
          <label className="check">
            <input type="checkbox" checked={form.activo} onChange={(e) => set('activo', e.target.checked)} />
            Visible en la tienda
          </label>
          <div className="btns">
            <button className="btn sm">Guardar</button>
            <button type="button" className="btn sm claro" onClick={() => setForm(null)}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="adm-list">
        {items.map((c) => (
          <div className="adm-row" key={c.id}>
            <div className="info">
              <b>
                {c.nombre}
                {!c.activo && <span className="tag off">OCULTA</span>}
              </b>
              <small>{c.descripcion}</small>
            </div>
            <div className="acts">
              <button
                className="btn sm gris"
                onClick={() => { setForm({ ...c, descripcion: c.descripcion || '' }); setMsg(null) }}
              >
                Editar
              </button>
              <button className="btn sm rojo" onClick={() => borrar(c)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
