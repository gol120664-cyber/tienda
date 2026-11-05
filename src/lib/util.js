export const slugify = (t = '') =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export function waLink(numero, texto) {
  const n = (numero || '').replace(/\D/g, '')
  return `https://wa.me/${n}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`
}

// Reduce el tamaño de las fotos antes de subirlas (más rápido y ahorra espacio).
export async function comprimirImagen(file, max = 1400) {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return file
  try {
    const bmp = await createImageBitmap(file)
    const esc = Math.min(1, max / Math.max(bmp.width, bmp.height))
    const c = document.createElement('canvas')
    c.width = Math.round(bmp.width * esc)
    c.height = Math.round(bmp.height * esc)
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
    const blob = await new Promise((r) => c.toBlob(r, 'image/webp', 0.85))
    if (!blob) return file
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' })
  } catch {
    return file
  }
}

export function rutaDesdeUrl(url) {
  const parte = url?.split('/object/public/productos/')[1]
  return parte ? decodeURIComponent(parte) : null
}
