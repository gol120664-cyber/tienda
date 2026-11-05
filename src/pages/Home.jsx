import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { waLink } from '../lib/util.js'

const AJUSTES_BASE = {
  empresa: 'HORMyMET',
  whatsapp: '59164601072',
  telefono_visible: '+591 64601072',
  pie: 'Bolivia · Prefabricados de hormigón',
}

function IconoCategoria({ slug }) {
  if (slug === 'columnas') {
    return (
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor">
        <rect x="28" y="10" width="44" height="80" strokeWidth="3" />
        <path d="M20 10H80M20 90H80M37 20V80M63 20V80" strokeWidth="2" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor">
      <rect x="18" y="18" width="64" height="64" strokeWidth="3" />
      <path d="M18 35H82M35 18V82M18 65H82" strokeWidth="2" />
    </svg>
  )
}

export default function Home() {
  const [cats, setCats] = useState([])
  const [prods, setProds] = useState([])
  const [aj, setAj] = useState(AJUSTES_BASE)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    let vivo = true
    async function cargar() {
      const [c, p, a] = await Promise.all([
        supabase.from('categorias').select('*').eq('activo', true).order('orden').order('nombre'),
        supabase.from('productos').select('*').eq('activo', true).order('orden').order('nombre'),
        supabase.from('ajustes').select('*'),
      ])
      if (!vivo) return
      if (c.error || p.error) {
        setError('No se pudo cargar el catálogo. Revisa la conexión con Supabase.')
      } else {
        setCats(c.data || [])
        setProds(p.data || [])
      }
      if (a.data?.length) {
        const mapa = { ...AJUSTES_BASE }
        a.data.forEach((x) => (mapa[x.clave] = x.valor))
        setAj(mapa)
      }
      setCargando(false)
    }
    cargar()
    return () => {
      vivo = false
    }
  }, [])

  const catPorId = useMemo(() => Object.fromEntries(cats.map((c) => [c.id, c])), [cats])

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return prods.filter((p) => {
      const cat = catPorId[p.categoria_id]
      const okCat = filtro === 'todos' || cat?.slug === filtro
      const okTxt =
        !q || p.nombre.toLowerCase().includes(q) || (p.descripcion || '').toLowerCase().includes(q)
      return okCat && okTxt
    })
  }, [prods, filtro, busqueda, catPorId])

  const irACatalogo = (slug) => {
    setFiltro(slug)
    document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })
  }

  const wa = (texto) => waLink(aj.whatsapp, texto)
  const empresa = aj.empresa

  return (
    <>
      <header>
        <div className="container nav">
          <a href="#inicio" className="logo">
            <span className="logo-icon">{empresa.charAt(0)}</span>
            <span className="logo-name">
              {empresa}
              <small>PREFABRICADOS DE HORMIGÓN</small>
            </span>
          </a>

          <nav className={'menu' + (menu ? ' open' : '')} onClick={() => setMenu(false)}>
            <a href="#inicio">Inicio</a>
            <a href="#categorias">Categorías</a>
            <a href="#productos">Catálogo</a>
            <a href="#nosotros">Nosotros</a>
            <a href="#contacto">Contacto</a>
          </nav>

          <a className="btn" href={wa()} target="_blank" rel="noreferrer">
            Cotizar por WhatsApp
          </a>

          <button className="menu-toggle" onClick={() => setMenu(!menu)} aria-label="Menú">
            ☰
          </button>
        </div>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div>
            <div className="eyebrow">INGENIERÍA · PRECISIÓN · CONFIANZA</div>
            <h1>
              Soluciones prefabricadas <span>para construir mejor.</span>
            </h1>
            <p>
              Prefabricados de hormigón para empresas constructoras, arquitectos, contratistas,
              maestros de obra y clientes particulares.
            </p>
            <div className="hero-actions">
              <a
                className="btn"
                href={wa(`Hola, quiero una cotización de ${empresa}`)}
                target="_blank"
                rel="noreferrer"
              >
                Solicitar cotización →
              </a>
              <a href="#productos">Explorar catálogo ↓</a>
            </div>
          </div>

          <div className="hero-art">
            <div className="panel-art"></div>
            <div className="panel-art two"></div>
            <div className="art-caption">
              PREFABRICADOS
              <br />
              PARA CONSTRUIR MEJOR
            </div>
          </div>
        </section>

        {cats.length > 0 && (
          <section className="section" id="categorias">
            <div className="container">
              <div className="section-title">
                <div>
                  <div className="eyebrow">NUESTRAS LÍNEAS</div>
                  <h2>Múltiples categorías. Múltiples soluciones.</h2>
                </div>
                <p>Productos prefabricados para responder a las necesidades de cada proyecto.</p>
              </div>

              <div className="categories">
                {cats.map((c, i) => (
                  <article className="category-card" key={c.id}>
                    <div className={'category-image' + (i % 2 === 1 ? ' columns' : '')}>
                      <IconoCategoria slug={c.slug} />
                      <span>{String(i + 1).padStart(2, '0')} / LÍNEA DE PRODUCTOS</span>
                    </div>
                    <div className="category-info">
                      <h3>{c.nombre}</h3>
                      <p>{c.descripcion}</p>
                      <button onClick={() => irACatalogo(c.slug)}>VER PRODUCTOS →</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="section products-section" id="productos">
          <div className="container">
            <div className="section-title">
              <div>
                <div className="eyebrow">CATÁLOGO {empresa.toUpperCase()}</div>
                <h2>Nuestros productos</h2>
              </div>
              <p>Solicita información técnica y cotización directamente con nuestro equipo.</p>
            </div>

            <input
              className="search"
              type="search"
              placeholder="Buscar un producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />

            <div className="filters">
              <button
                className={'filter' + (filtro === 'todos' ? ' active' : '')}
                onClick={() => setFiltro('todos')}
              >
                Todos
              </button>
              {cats.map((c) => (
                <button
                  key={c.id}
                  className={'filter' + (filtro === c.slug ? ' active' : '')}
                  onClick={() => setFiltro(c.slug)}
                >
                  {c.nombre.charAt(0) + c.nombre.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="product-grid">
              {cargando && <div className="empty">Cargando catálogo...</div>}
              {error && <div className="empty">{error}</div>}
              {!cargando && !error && visibles.length === 0 && (
                <div className="empty">No encontramos productos con ese nombre.</div>
              )}
              {visibles.map((p) => (
                <article className="product" key={p.id}>
                  <div className="product-image">
                    {p.imagen_url ? (
                      <img src={p.imagen_url} alt={p.nombre} loading="lazy" />
                    ) : (
                      <span style={{ fontSize: 65 }}>{p.icono || '▦'}</span>
                    )}
                  </div>
                  <div className="product-info">
                    <small>{(catPorId[p.categoria_id]?.nombre || '').toUpperCase()}</small>
                    <h3>{p.nombre}</h3>
                    <p>{p.descripcion}</p>
                    {p.precio && <span className="price">{p.precio}</span>}
                    <button
                      className="wa"
                      onClick={() =>
                        window.open(
                          wa(`Hola, deseo información y cotización del producto: ${p.nombre} de ${empresa}.`),
                          '_blank'
                        )
                      }
                    >
                      CONSULTAR POR WHATSAPP →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="about" id="nosotros">
          <div className="container about-grid">
            <div>
              <div className="eyebrow">SOBRE {empresa.toUpperCase()}</div>
              <h2>Respaldo para tus proyectos de construcción.</h2>
              <p>
                Trabajamos para acercar soluciones prefabricadas de hormigón a profesionales y
                clientes particulares. Nuestro objetivo es ofrecer información clara, atención
                directa y cotizaciones sencillas.
              </p>
            </div>
            <div className="benefits">
              <div className="benefit">
                <span className="benefit-icon">✓</span>
                <div>
                  <strong>Información técnica</strong>
                  <small>Datos de producto y dimensiones según ficha técnica.</small>
                </div>
              </div>
              <div className="benefit">
                <span className="benefit-icon">◆</span>
                <div>
                  <strong>Atención directa</strong>
                  <small>Consulta disponibilidad y condiciones de entrega.</small>
                </div>
              </div>
              <div className="benefit">
                <span className="benefit-icon">↗</span>
                <div>
                  <strong>Cotización sencilla</strong>
                  <small>Contacto directo por WhatsApp.</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="contact" id="contacto">
          <div className="container contact-inner">
            <div>
              <div className="eyebrow">HABLEMOS DE TU PROYECTO</div>
              <h2>¿Qué necesitas construir?</h2>
              <p>Cuéntanos sobre tu obra y solicita una cotización.</p>
              <div className="contact-number">{aj.telefono_visible}</div>
            </div>
            <a
              className="btn"
              href={wa(`Hola, quiero solicitar una cotización de ${empresa}`)}
              target="_blank"
              rel="noreferrer"
            >
              ☎ Contactar por WhatsApp
            </a>
          </div>
        </section>
      </main>

      <footer>
        <div className="container footer-inner">
          <strong>{empresa}</strong>
          <span>{aj.pie}</span>
          <span>
            © {new Date().getFullYear()} {empresa} · <a className="acceso" href="/admin">Acceso</a>
          </span>
        </div>
      </footer>

      <a
        className="whatsapp-float"
        href={wa(`Hola, quiero información de ${empresa}`)}
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp"
      >
        ☎
      </a>
    </>
  )
}
