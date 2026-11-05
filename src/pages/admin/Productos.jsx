import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { comprimirImagen, rutaDesdeUrl } from '../../lib/util.js'

const VACIO = {
  nombre: '',
  descripcion: '',
  precio: '',
  icono: '▦',
  categoria_id: '',
  orden: 0,
  activo: true,
  imagen_url: null,
}

export default function Productos() {
  const [items, setItems] = useState([])
  const [cats, setCats] = useState([])
  const [form, setForm] = useState(null)
  const [archivo, setArchivo] = useState(null)
  const [msg, setMsg] = useState(null)
  const [guardando, setGuardando] = useState(false)

  async function cargar() {
    const [p, c] = await Promise.all([
      supabase.from('productos').select('*').order('orden').order('nombre'),
      supabase.from('categorias').select('*').order('orden').order('nombre'),
    ])
    if (p.error) setMsg({ t: 'error', m: p.error.message })
    setItems(p.data || [])
    setCats(c.data || [])
  }
  useEffect(() => {
    cargar()
  }, [])

  const nombreCat = (id) => cats.find((c) => c.id === id)?.nombre || 'Sin categoría'
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)
    setMsg(null)
    try {
      let imagen_url = form.imagen_url
      if (archivo) {
        const f = await comprimirImagen(archivo)
        const ext = f.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
        const ruta = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
        const { error } = await supabase.storage.from('productos').upload(ruta, f, {
          contentType: f.type,
          cacheControl: '31536000',
        })
        if (error) throw error
        imagen_url = supabase.storage.from('productos').getPublicUrl(ruta).data.publicUrl
        const vieja = rutaDesdeUrl(form.imagen_url)
        if (vieja) await supabase.storage.from('productos').remove([vieja])
      }
      const datos = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion,
        precio: form.precio,
        icono: form.icono || '▦',
        categoria_id: form.categoria_id || null,
        orden: Number(form.orden) || 0,
        activo: form.activo,
        imagen_url,
      }
      const { error } = form.id
        ? await supabase.from('productos').update(datos).eq('id', form.id)
        : await supabase.from('productos').insert(datos)
      if (error) throw error
      setForm(null)
      setArchivo(null)
      setMsg({ t: 'ok', m: 'Producto guardado.' })
      cargar()
    } catch (err) {
      setMsg({ t: 'error', m: err.message || 'No se pudo guardar.' })
    }
    setGuardando(false)
  }

  async function quitarFoto() {
    setArchivo(null)
    set('imagen_url', null)
  }

  async function borrar(p) {
    if (!window.confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return
    const ruta = rutaDesdeUrl(p.imagen_url)
    if (ruta) await supabase.storage.from('productos').remove([ruta])
    const { error } = await supabase.from('productos').delete().eq('id', p.id)
    setMsg(error ? { t: 'error', m: error.message } : { t: 'ok', m: 'Producto eliminado.' })
    cargar()
  }

  async function alternar(p) {
    await supabase.from('productos').update({ activo: !p.activo }).eq('id', p.id)
    cargar()
  }

  return (
    <>
      <div className="adm-head">
        <h2>Productos</h2>
        {!form && (
          <button
            className="btn sm"
            onClick={() => {
              setForm({ ...VACIO, categoria_id: cats[0]?.id || '' })
              setArchivo(null)
              setMsg(null)
            }}
          >
            + Nuevo producto
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
          <div className="two">
            <label>
              Categoría
              <select value={form.categoria_id} onChange={(e) => set('categoria_id', e.target.value)}>
                <option value="">Sin categoría</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </label>
            <label>
              Precio (opcional)
              <input type="text" placeholder="Ej: Bs 25 c/u" value={form.precio} onChange={(e) => set('precio', e.target.value)} />
            </label>
          </div>
          <div className="two">
            <label>
              Orden (número menor = aparece primero)
              <input type="number" value={form.orden} onChange={(e) => set('orden', e.target.value)} />
            </label>
            <label>
              Icono si no hay foto
              <input type="text" maxLength={2} value={form.icono} onChange={(e) => set('icono', e.target.value)} />
            </label>
          </div>
          <label>
            Foto del producto
            <input type="file" accept="image/*" onChange={(e) => setArchivo(e.target.files[0] || null)} />
            <span className="help">Se reduce automáticamente de tamaño al subirla.</span>
          </label>
          {(archivo || form.imagen_url) && (
            <div>
              <img className="preview" alt="Vista previa" src={archivo ? URL.createObjectURL(archivo) : form.imagen_url} />
              <div style={{ marginTop: 8 }}>
                <button type="button" className="btn sm claro" onClick={quitarFoto}>Quitar foto</button>
              </div>
            </div>
          )}
          <label className="check">
            <input type="checkbox" checked={form.activo} onChange={(e) => set('activo', e.target.checked)} />
            Visible en la tienda
          </label>
          <div className="btns">
            <button className="btn sm" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button>
            <button type="button" className="btn sm claro" onClick={() => setForm(null)}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="adm-list">
        {items.length === 0 && <div className="empty">Aún no hay productos.</div>}
        {items.map((p) => (
          <div className="adm-row" key={p.id}>
            <div className="thumb">
              {p.imagen_url ? <img src={p.imagen_url} alt="" /> : p.icono || '▦'}
            </div>
            <div className="info">
              <b>
                {p.nombre}
                {!p.activo && <span className="tag off">OCULTO</span>}
              </b>
              <small>{nombreCat(p.categoria_id)}{p.precio ? ` · ${p.precio}` : ''}</small>
            </div>
            <div className="acts">
              <button className="btn sm claro" onClick={() => alternar(p)}>{p.activo ? 'Ocultar' : 'Mostrar'}</button>
              <button
                className="btn sm gris"
                onClick={() => {
                  setForm({ ...VACIO, ...p, precio: p.precio || '', descripcion: p.descripcion || '', categoria_id: p.categoria_id || '' })
                  setArchivo(null)
                  setMsg(null)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              >
                Editar
              </button>
              <button className="btn sm rojo" onClick={() => borrar(p)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
