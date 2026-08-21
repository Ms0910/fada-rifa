# FADA — API de la rifa (Cloudflare Worker + D1)

Servicio mínimo para guardar el estado de los 100 puestos de la rifa.
La landing (Netlify) solo lee los estados; los datos del comprador
(nombre, teléfono, correo) quedan internos y solo se consultan con el
token de admin.

**Ya desplegado.** URL pública:

```
https://fada-rifa-api.fada-worker.workers.dev
```

`js/config.js` → `CONFIG.api.baseUrl` ya apunta ahí. El `ADMIN_TOKEN` quedó
guardado como secreto en Cloudflare (no está en este repo) — pídeselo a
quien hizo el despliegue si lo necesitas.

Si en algún momento hay que reconstruir el servicio desde cero:

```bash
# 1. Iniciar sesión en Cloudflare (abre el navegador)
npx wrangler login

# 2. Crear la base de datos D1
npx wrangler d1 create fada-rifa
#    → copia el "database_id" que aparece y pégalo en wrangler.toml

# 3. Crear la tabla y sembrar los 100 puestos (en producción)
npx wrangler d1 execute fada-rifa --remote --file=schema.sql

# 4. Guardar el token de admin (te pedirá escribirlo; inventa uno largo)
npx wrangler secret put ADMIN_TOKEN

# 5. Desplegar (requiere tener un subdominio workers.dev registrado
#    en la cuenta — se hace una vez desde el dashboard de Cloudflare)
npx wrangler deploy
#    → te da la URL: https://fada-rifa-api.<tu-subdominio>.workers.dev
```

Después, en la landing edita `js/config.js` → `CONFIG.api.baseUrl` con esa URL.

## Uso diario

Cuando alguien pague (o aparte) puestos, llamas el endpoint de admin.
Desde el PC con curl, o desde el celular con una app tipo
**HTTP Shortcuts** (Android) o **Atajos** (iPhone).

```bash
TOKEN="tu-token-de-admin"
API="https://fada-rifa-api.fada-worker.workers.dev"

# Marcar como VENDIDOS los puestos 5 y 12, con datos del comprador
curl -X POST "$API/api/admin/update" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"numbers":[5,12],"status":"SOLD","name":"Laura Gómez","phone":"3001234567","email":"laura@mail.com"}'

# Marcar como APARTADOS (reservados) mientras confirman el pago
curl -X POST "$API/api/admin/update" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"numbers":[7],"status":"RESERVED","name":"Carlos Pérez","phone":"3109876543"}'

# Liberar un puesto (se equivocaron, no pagó, etc.) — borra los datos
curl -X POST "$API/api/admin/update" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"numbers":[7],"status":"AVAILABLE"}'

# Ver la tabla completa con compradores (solo admin)
curl "$API/api/admin/spots" -H "Authorization: Bearer $TOKEN"
```

El endpoint público que consume la landing es simplemente:

```
GET https://fada-rifa-api.fada-worker.workers.dev/api/numbers
→ [{"number":1,"status":"AVAILABLE"},{"number":5,"status":"SOLD"}, ...]
```

## Costos

Todo dentro del plan gratuito de Cloudflare: 100.000 requests/día en
Workers y 5M lecturas/día en D1. Para una rifa, sobra por órdenes de
magnitud.
