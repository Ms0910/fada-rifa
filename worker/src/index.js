/**
 * ═══════════════════════════════════════════════════════════
 *  FADA — API de la rifa (Cloudflare Worker + D1)
 *
 *  Endpoints:
 *    GET  /api/numbers       → público: [{ number, status }]
 *                              (nunca expone datos del comprador)
 *    GET  /api/admin/spots   → admin: tabla completa, con nombre,
 *                              teléfono y correo de cada comprador
 *    POST /api/admin/update  → admin: marcar puestos
 *                              body: { numbers: [5, 12],
 *                                      status: "RESERVED" | "SOLD" | "AVAILABLE",
 *                                      name?, phone?, email? }
 *                              ("AVAILABLE" libera el puesto y borra
 *                               los datos del comprador)
 *
 *  Auth admin: header  Authorization: Bearer <ADMIN_TOKEN>
 *  (ADMIN_TOKEN se configura con `npx wrangler secret put ADMIN_TOKEN`)
 * ═══════════════════════════════════════════════════════════
 */

const STATUSES = new Set(["AVAILABLE", "RESERVED", "SOLD"]);
const MAX_NUMBER = 100; // puestos de la rifa: 1..100

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function json(data, env, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(env) },
  });
}

function isAdmin(request, env) {
  const token = request.headers
    .get("Authorization")
    ?.replace(/^Bearer\s+/i, "");
  return Boolean(env.ADMIN_TOKEN) && token === env.ADMIN_TOKEN;
}

async function handleAdminUpdate(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "BODY_JSON_INVALIDO" }, env, 400);
  }

  const { numbers, status, name = null, phone = null, email = null } = body ?? {};

  if (!Array.isArray(numbers) || numbers.length === 0)
    return json({ ok: false, error: "NUMBERS_REQUERIDO" }, env, 400);
  if (!STATUSES.has(status))
    return json({ ok: false, error: "STATUS_INVALIDO", valid: [...STATUSES] }, env, 400);

  const valid = numbers.filter((n) => Number.isInteger(n) && n >= 1 && n <= MAX_NUMBER);
  if (valid.length !== numbers.length)
    return json({ ok: false, error: `NUMEROS_FUERA_DE_RANGO_1_${MAX_NUMBER}` }, env, 400);

  const now = new Date().toISOString();
  const stmts = valid.map((n) =>
    status === "AVAILABLE"
      ? env.DB.prepare(
          "UPDATE spots SET status = 'AVAILABLE', name = NULL, phone = NULL, email = NULL, updated_at = ? WHERE number = ?"
        ).bind(now, n)
      : env.DB.prepare(
          "UPDATE spots SET status = ?, name = ?, phone = ?, email = ?, updated_at = ? WHERE number = ?"
        ).bind(status, name, phone, email, now, n)
  );
  await env.DB.batch(stmts);

  return json({ ok: true, updated: valid, status }, env);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Preflight CORS
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: corsHeaders(env) });

    // Público: estados de los números (lo consume la landing)
    if (url.pathname === "/api/numbers" && request.method === "GET") {
      const { results } = await env.DB.prepare(
        "SELECT number, status FROM spots ORDER BY number"
      ).all();
      return json(results, env);
    }

    // Admin: tabla completa con datos de compradores
    if (url.pathname === "/api/admin/spots" && request.method === "GET") {
      if (!isAdmin(request, env))
        return json({ ok: false, error: "NO_AUTORIZADO" }, env, 401);
      const { results } = await env.DB.prepare(
        "SELECT * FROM spots ORDER BY number"
      ).all();
      return json(results, env);
    }

    // Admin: marcar puestos (reservado / vendido / liberado)
    if (url.pathname === "/api/admin/update" && request.method === "POST") {
      if (!isAdmin(request, env))
        return json({ ok: false, error: "NO_AUTORIZADO" }, env, 401);
      return handleAdminUpdate(request, env);
    }

    return json({ ok: false, error: "RUTA_NO_ENCONTRADA" }, env, 404);
  },
};
