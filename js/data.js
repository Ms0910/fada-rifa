/**
 * ═══════════════════════════════════════════════════════════
 *  FADA — Capa de datos
 *
 *  Los estados de los puestos se leen de la API real
 *  (Cloudflare Worker + D1, ver worker/) cuando
 *  CONFIG.api.baseUrl está configurado. Si está vacío o la API
 *  falla, se usa el mock local para no dejar la página rota.
 *
 *  El flujo de compra es manual: el comprador paga por Nequi,
 *  confirma por WhatsApp y FADA marca los puestos llamando el
 *  endpoint de admin del Worker (ver worker/README.md). Por eso
 *  las reservas siguen siendo locales (solo duran la sesión
 *  del visitante).
 *
 *  Endpoints del Worker:
 *    GET  /api/numbers        → getNumbers()  (público)
 *    POST /api/admin/update   → lo usa FADA cuando confirma un pago
 * ═══════════════════════════════════════════════════════════
 */

import { CONFIG } from "./config.js";

export const NumberStatus = Object.freeze({
  AVAILABLE: "AVAILABLE",
  RESERVED: "RESERVED",
  SOLD: "SOLD",
});

const NETWORK_DELAY = 250; // ms — simula latencia de red
const delay = (ms = NETWORK_DELAY) => new Promise((r) => setTimeout(r, ms));

/* ── Estado inicial del tablero ─────────────────────────────
   Rifa recién lanzada: todos los números disponibles.
   Cuando exista backend, los estados llegarán de la base de
   datos y esta función desaparece. */
function buildMockNumbers() {
  const numbers = [];
  for (let n = 1; n <= CONFIG.raffle.totalNumbers; n++) {
    numbers.push({ number: n, status: NumberStatus.AVAILABLE });
  }
  return numbers;
}

/** Estado en memoria (simula la base de datos). */
const db = {
  numbers: buildMockNumbers(),
  reservations: [],
};

/* ── API pública ─────────────────────────────────────────── */

/** Datos generales de la rifa activa. */
export async function getRaffle() {
  await delay();
  return {
    pricePerNumber: CONFIG.raffle.pricePerNumber,
    totalNumbers: CONFIG.raffle.totalNumbers,
    drawDate: CONFIG.raffle.drawDate,
    prize: { ...CONFIG.prize },
  };
}

/** Lista completa de números con su estado actual. */
export async function getNumbers() {
  // Desarrollo local (sin API configurada): mock en memoria.
  if (!CONFIG.api?.baseUrl) {
    await delay();
    // Copia profunda para que la UI no mute el "backend".
    return db.numbers.map((n) => ({ ...n }));
  }

  // Producción: estado real desde el Worker (D1). Si la API
  // falla, se cae al mock para no dejar la página rota.
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${CONFIG.api.baseUrl}/api/numbers`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`API respondió ${res.status}`);
    const numbers = await res.json();
    return numbers.map(({ number, status }) => ({ number, status }));
  } catch (err) {
    console.warn("[data] No se pudo leer la API; usando estados locales:", err);
    await delay();
    return db.numbers.map((n) => ({ ...n }));
  }
}

/**
 * Crea una reserva para los números dados.
 * En producción: POST /api/reservations con expiración (TTL).
 * @returns {{ ok: boolean, reservationId?: string, conflicts?: number[] }}
 */
export async function createReservation(numbers, customer) {
  await delay(600);
  const conflicts = numbers.filter(
    (n) => db.numbers[n - 1].status !== NumberStatus.AVAILABLE
  );
  if (conflicts.length > 0) return { ok: false, conflicts };

  numbers.forEach((n) => (db.numbers[n - 1].status = NumberStatus.RESERVED));
  const reservation = {
    id: `RES-${Date.now().toString(36).toUpperCase()}`,
    numbers: [...numbers],
    customer: { ...customer },
    status: "PENDING_PAYMENT", // PENDING_PAYMENT | PAID | EXPIRED | FAILED
    createdAt: new Date().toISOString(),
  };
  db.reservations.push(reservation);
  return { ok: true, reservationId: reservation.id };
}

/**
 * Punto de conexión del pago con Nequi.
 * ⚠️ NO IMPLEMENTADO — hoy el pago es una transferencia manual
 * Nequi → Nequi que FADA verifica por WhatsApp.
 *
 * Para cobro automático se integraría aquí la API de Nequi para
 * comercios (pago push): el backend crea el pago, Nequi le envía
 * una notificación push al celular del comprador para aprobarla,
 * y el webhook confirma la reserva sin intervención manual.
 * Requiere credenciales de comercio en https://conecta.nequi.com.co
 *
 * @returns {Promise<{ status: "SUCCESS" | "PENDING" | "FAILED" }>}
 */
export async function createPayment(reservationId) {
  await delay(800);
  // ── INTEGRACIÓN PENDIENTE (Nequi API — pago push) ─────────
  // const res = await fetch("/api/payments/nequi", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ reservationId, phone: customer.phone }),
  // });
  // return res.json();
  throw new Error("NEQUI_GATEWAY_NOT_CONNECTED");
}

/**
 * Marca la reserva como pagada (lo llamará el webhook de la
 * pasarela en producción; aquí lo usa el flujo de WhatsApp).
 */
export async function confirmReservation(reservationId) {
  await delay();
  const res = db.reservations.find((r) => r.id === reservationId);
  if (!res) return { ok: false };
  res.status = "PAID";
  res.numbers.forEach((n) => (db.numbers[n - 1].status = NumberStatus.SOLD));
  return { ok: true, reservation: { ...res } };
}

/** Libera una reserva (usuario abandona / expira el tiempo). */
export async function releaseReservation(reservationId) {
  await delay();
  const res = db.reservations.find((r) => r.id === reservationId);
  if (!res || res.status === "PAID") return { ok: false };
  res.status = "EXPIRED";
  res.numbers.forEach((n) => (db.numbers[n - 1].status = NumberStatus.AVAILABLE));
  return { ok: true };
}
