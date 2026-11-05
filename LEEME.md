# HORMyMET · Tienda online (React + Vite + Supabase)

- Tienda pública: `/`  (escritorio y celular)
- Panel de administración: `/admin`

## Variables de conexión (solo 2)
Se leen del archivo `.env` o de las Variables de Entorno de Vercel. No están dentro del código.

    VITE_SUPABASE_URL=...
    VITE_SUPABASE_ANON_KEY=...

Base de datos: `supabase/01_base_de_datos.sql` y luego `supabase/02_administrador.sql`.

## Probar en tu computadora (opcional)
    copiar .env.example como .env y completar los 2 valores
    npm install
    npm run dev
