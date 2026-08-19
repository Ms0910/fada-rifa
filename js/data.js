/**
 * ═══════════════════════════════════════════════════════════
 *  FADA — Capa de datos (mock)
 *
 *  Simula la API del backend. Todas las funciones son async y
 *  devuelven promesas con latencia artificial, de modo que
 *  reemplazarlas por llamadas fetch() reales no requiere tocar
 *  la UI.
 *
 *  Endpoints futuros sugeridos:
 *    GET  /api/raffles/current          → getRaffle()
 *    GET  /api/raffles/:id/numbers      → getNumbers()
 *    POST /api/reservations             → createReservation()
 *    POST /api/payments                 → createPayment()
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
  await delay();
  // Copia profunda para que la UI no mute el "backend".
  return db.numbers.map((n) => ({ ...n }));
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
