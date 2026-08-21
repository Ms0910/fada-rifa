/**
 * ═══════════════════════════════════════════════════════════
 *  FADA — Aplicación principal (UI)
 *  La lógica de negocio vive en data.js; aquí solo hay
 *  renderizado e interacción.
 * ═══════════════════════════════════════════════════════════
 */

import { CONFIG } from "./config.js";
import {
  NumberStatus,
  getRaffle,
  getNumbers,
  createReservation,
  confirmReservation,
} from "./data.js";

/* ── Utilidades ──────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const fmtCOP = new Intl.NumberFormat(CONFIG.raffle.locale, {
  style: "currency",
  currency: CONFIG.raffle.currency,
  maximumFractionDigits: 0,
});
const money = (v) => fmtCOP.format(v);
const pad = (n) => String(n).padStart(2, "0");

/* ── Estado de la UI ─────────────────────────────────────── */
const state = {
  numbers: [],            // [{ number, status }]
  selected: new Set(),    // números elegidos por el usuario
  customer: null,         // { name, phone, email }
  reservationId: null,
};

/* ── Toasts ──────────────────────────────────────────────── */
function toast(message, type = "default", duration = 3200) {
  const el = document.createElement("div");
  el.className = `toast toast--${type}`;
  el.textContent = message;
  $("#toasts").appendChild(el);
  setTimeout(() => {
    el.classList.add("toast--out");
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }, duration);
}

/* ── Confetti ────────────────────────────────────────────── */
function confetti(pieces = 90) {
  const colors = ["#f1553c", "#f2a73b", "#0f3b3d", "#4f9e90", "#d8402a"];
  for (let i = 0; i < pieces; i++) {
    const el = document.createElement("span");
    el.className = "confetti-piece";
    el.style.left = `${Math.random() * 100}vw`;
    el.style.background = colors[i % colors.length];
    el.style.animationDuration = `${1.8 + Math.random() * 1.6}s`;
    el.style.animationDelay = `${Math.random() * 0.5}s`;
    el.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(el);
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }
}

/* ── Reveal on scroll ────────────────────────────────────── */
function initReveal() {
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".reveal, .impact-card").forEach((el) => io.observe(el));
}

/* ── Navbar ──────────────────────────────────────────────── */
function initNavbar() {
  const navbar = $("#navbar");
  const burger = $("#burger");
  const links = $("#navLinks");

  const onScroll = () =>
    navbar.classList.toggle("navbar--scrolled", window.scrollY > 24);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  burger.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
  });

  // Smooth scroll + cerrar menú móvil
  $$("[data-scroll]").forEach((a) =>
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id?.startsWith("#")) return;
      e.preventDefault();
      $(id)?.scrollIntoView({ behavior: "smooth" });
      links.classList.remove("is-open");
      burger.classList.remove("is-open");
    })
  );
}

/* ── Volver arriba ───────────────────────────────────── */
function initToTop() {
  const btn = $("#toTop");
  const onScroll = () =>
    btn.classList.toggle("is-visible", window.scrollY > 600);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  btn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );
}

/* ── Countdown ───────────────────────────────────────────── */
function initCountdown() {
  const target = new Date(CONFIG.raffle.drawDate).getTime();
  $("#drawDateLabel").textContent = new Intl.DateTimeFormat(CONFIG.raffle.locale, {
    weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit",
  }).format(new Date(target));

  const cells = {
    d: $("#cdDays"), h: $("#cdHours"), m: $("#cdMins"), s: $("#cdSecs"),
  };
  const tick = () => {
    let diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / 86400000); diff -= d * 86400000;
    const h = Math.floor(diff / 3600000); diff -= h * 3600000;
    const m = Math.floor(diff / 60000); diff -= m * 60000;
    const s = Math.floor(diff / 1000);
    cells.d.textContent = pad(d);
    cells.h.textContent = pad(h);
    cells.m.textContent = pad(m);
    cells.s.textContent = pad(s);
  };
  tick();
  setInterval(tick, 1000);
}

/* ── Contenido dinámico (premio, stats, historias…) ──────── */
function renderStaticContent() {
  const { prize, stats } = CONFIG;

  // Hero
  $("#heroPrice").textContent = money(CONFIG.raffle.pricePerNumber);
  $("#heroPrize").textContent = prize.name;
  $('[data-stat="perros"]').textContent = stats.dogsInFoundation;
  $('[data-stat="gatos"]').textContent = stats.catsRescued;

  // Premio
  $("#prizeImage").src = prize.image;
  $("#prizeName").textContent = prize.name;
  $("#prizeValue").textContent = money(prize.approxValue);
  $("#prizeDescription").textContent = prize.description;
  $("#prizeWinCriteria").textContent = CONFIG.raffle.winningCriteria;
  $("#prizeConditions").textContent = prize.conditions;
  $("#prizeDrawDate").textContent = new Intl.DateTimeFormat(CONFIG.raffle.locale, {
    day: "numeric", month: "long", year: "numeric",
  }).format(new Date(CONFIG.raffle.drawDate));

  // Impacto
  $('[data-impact="food"]').textContent = stats.impact.foodDays;
  $('[data-impact="vet"]').textContent = stats.impact.vetTreatments;
  $('[data-impact="rescue"]').textContent = stats.impact.recentRescues;
  $('[data-impact="adoption"]').textContent = stats.impact.adoptions;

  // Historias
  $("#storiesGrid").innerHTML = CONFIG.stories
    .map(
      (s) => `
      <article class="story-card reveal">
        <div class="story-card__photo" data-lightbox-open data-src="${s.image}" data-alt="${s.name}, ${s.statusLabel.toLowerCase()} por FADA">
          <img src="${s.image}" alt="${s.name}, ${s.statusLabel.toLowerCase()} por FADA" loading="lazy" style="object-position: ${s.focus || "center"}" />
          <span class="story-card__status story-card__status--${s.status}">${s.statusLabel}</span>
          <span class="story-card__zoom" aria-hidden="true">🔍</span>
        </div>
        <div class="story-card__body">
          <h3 class="story-card__name">${s.name}</h3>
          <p class="story-card__text">${s.text}</p>
        </div>
      </article>`
    )
    .join("");

  $$("[data-lightbox-open]").forEach((el) =>
    el.addEventListener("click", () => openLightbox(el.dataset.src, el.dataset.alt))
  );

  // FAQ
  $("#faqList").innerHTML = CONFIG.faq
    .map(
      (f, i) => `
      <div class="faq-item reveal">
        <button class="faq-item__q" type="button" aria-expanded="false" data-faq="${i}">
          ${f.q}<span class="faq-item__chevron">▾</span>
        </button>
        <div class="faq-item__a"><p>${f.a}</p></div>
      </div>`
    )
    .join("");

  $$(".faq-item__q").forEach((btn) =>
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      const answer = $(".faq-item__a", item);
      const open = item.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
      answer.style.maxHeight = open ? `${answer.scrollHeight}px` : "0px";
    })
  );

  // Footer
  $("#year").textContent = new Date().getFullYear();
  $("#footerWhatsapp").href = whatsappLink("Hola FADA 🐾, quiero información sobre la rifa.");
}

/* ── Contadores animados de métricas ─────────────────────── */
function animateCounter(el, target, duration = 1400, format = (v) => v) {
  const start = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = format(Math.round(target * eased));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initMetrics(availableCount) {
  const { stats } = CONFIG;
  const goal = CONFIG.raffle.pricePerNumber * CONFIG.raffle.totalNumbers;
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        animateCounter($("#metricDogs"), stats.dogsInFoundation);
        animateCounter($("#metricCats"), stats.catsRescued);
        animateCounter($("#metricAvailable"), availableCount);
        animateCounter($("#metricGoal"), goal, 1400, money);
        io.disconnect();
      }),
    { threshold: 0.4 }
  );
  io.observe($("#metrics"));
}

/* ═══ SELECTOR DE NÚMEROS ════════════════════════════════ */
function statusClass(status) {
  return {
    [NumberStatus.AVAILABLE]: "num--available",
    [NumberStatus.RESERVED]: "num--reserved",
    [NumberStatus.SOLD]: "num--sold",
  }[status];
}

function renderGrid() {
  const grid = $("#numberGrid");
  grid.innerHTML = "";
  const frag = document.createDocumentFragment();

  state.numbers.forEach(({ number, status }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `num ${statusClass(status)}`;
    btn.textContent = pad(number);
    btn.dataset.number = number;
    btn.setAttribute("role", "gridcell");
    btn.setAttribute(
      "aria-label",
      `Número ${number} — ${status === NumberStatus.AVAILABLE ? "disponible" : status === NumberStatus.RESERVED ? "reservado" : "vendido"}`
    );
    if (state.selected.has(number)) btn.classList.add("num--selected");
    btn.addEventListener("click", () => onNumberClick(number, btn));
    frag.appendChild(btn);
  });

  grid.appendChild(frag);
}

function onNumberClick(number, btn) {
  const item = state.numbers[number - 1];

  if (item.status === NumberStatus.SOLD) {
    btn.classList.remove("num--shake");
    void btn.offsetWidth; // reinicia la animación
    btn.classList.add("num--shake");
    toast(`El número ${pad(number)} ya fue vendido 😔`, "error");
    return;
  }
  if (item.status === NumberStatus.RESERVED) {
    btn.classList.remove("num--shake");
    void btn.offsetWidth;
    btn.classList.add("num--shake");
    toast(`El número ${pad(number)} está reservado. Intenta en unos minutos.`, "warn");
    return;
  }

  if (state.selected.has(number)) {
    state.selected.delete(number);
    btn.classList.remove("num--selected");
  } else {
    state.selected.add(number);
    btn.classList.add("num--selected");
  }
  syncSelectionUI();
}

/* Selección aleatoria ("Sorpréndeme") */
function pickLucky() {
  const available = state.numbers
    .filter((n) => n.status === NumberStatus.AVAILABLE && !state.selected.has(n.number))
    .map((n) => n.number);

  if (available.length === 0) {
    toast("No quedan números disponibles 😮", "warn");
    return;
  }

  // Mini animación de ruleta sobre números disponibles
  const flashes = Math.min(10, available.length);
  for (let i = 0; i < flashes; i++) {
    const n = available[Math.floor(Math.random() * available.length)];
    const el = $(`.num[data-number="${n}"]`);
    setTimeout(() => el?.classList.add("num--lucky"), i * 70);
    setTimeout(() => el?.classList.remove("num--lucky"), i * 70 + 500);
  }

  setTimeout(() => {
    const pick = available[Math.floor(Math.random() * available.length)];
    state.selected.add(pick);
    const el = $(`.num[data-number="${pick}"]`);
    el?.classList.add("num--selected");
    syncSelectionUI();
    toast(`🍀 El azar eligió el número ${pad(pick)} para ti`, "success");
  }, flashes * 70 + 250);
}

/* Sincroniza resumen, bottom bar y progreso */
function syncSelectionUI() {
  const selected = [...state.selected].sort((a, b) => a - b);
  const qty = selected.length;
  const total = qty * CONFIG.raffle.pricePerNumber;

  // Resumen (desktop)
  const wrap = $("#summaryNumbers");
  wrap.innerHTML = qty
    ? selected
        .map(
          (n) => `
        <span class="chip">#${pad(n)}
          <button type="button" aria-label="Quitar número ${pad(n)}" data-remove="${n}">✕</button>
        </span>`
        )
        .join("")
    : `<p class="summary__empty" id="summaryEmpty">Aún no has elegido números.<br />Toca los disponibles para empezar ✨</p>`;

  $$("[data-remove]", wrap).forEach((b) =>
    b.addEventListener("click", () => {
      const n = Number(b.dataset.remove);
      state.selected.delete(n);
      $(`.num[data-number="${n}"]`)?.classList.remove("num--selected");
      syncSelectionUI();
    })
  );

  $("#summaryQty").textContent = qty;
  $("#summaryUnit").textContent = money(CONFIG.raffle.pricePerNumber);
  $("#summaryTotal").textContent = money(total);
  $("#checkoutBtn").disabled = qty === 0;

  // Bottom bar (móvil)
  const bar = $("#bottombar");
  const visible = qty > 0 && window.innerWidth <= 1020;
  bar.classList.toggle("is-visible", visible);
  bar.setAttribute("aria-hidden", String(!visible));
  $("#bottombarNumbers").textContent = `${qty} número${qty > 1 ? "s" : ""}: ${selected.map(pad).join(" · ")}`;
  $("#bottombarTotal").textContent = money(total);
}

function updateProgress() {
  const sold = state.numbers.filter((n) => n.status === NumberStatus.SOLD).length;
  const reserved = state.numbers.filter((n) => n.status === NumberStatus.RESERVED).length;
  const total = state.numbers.length;
  const available = total - sold - reserved;

  $("#totalCount").textContent = total;
  $("#availableHint").textContent = `${available} disponibles · ${reserved} reservados`;
  $("#progressFill").style.width = `${(sold / total) * 100}%`;
  $("#heroParticipants").textContent = sold;

  // Contador animado de vendidos
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        animateCounter($("#soldCount"), sold, 1200);
        io.disconnect();
      }),
    { threshold: 0.5 }
  );
  io.observe($(".raffle__progress"));

  return available;
}

/* ═══ CHECKOUT ═══════════════════════════════════════════ */
const modal = () => $("#checkoutModal");

function openCheckout() {
  if (state.selected.size === 0) {
    toast("Primero elige al menos un número ✨", "warn");
    $("#rifa").scrollIntoView({ behavior: "smooth" });
    return;
  }
  gotoStep(1);
  modal().classList.add("is-open");
  modal().setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  const selected = [...state.selected].sort((a, b) => a - b);
  $("#modalNumbersChips").innerHTML = selected
    .map((n) => `<span class="chip">#${pad(n)}</span>`)
    .join("");
  $("#modalTotal").textContent = money(selected.length * CONFIG.raffle.pricePerNumber);
}

function closeCheckout() {
  modal().classList.remove("is-open");
  modal().setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function gotoStep(step) {
  $$(".modal__step").forEach((s) => (s.hidden = s.dataset.step !== String(step)));
  if (step === 1) setTimeout(() => $("#fieldName").focus(), 300);
}

function validateForm() {
  const fields = {
    fieldName: {
      el: $("#fieldName"),
      ok: (v) => v.trim().length >= 3,
      msg: "Escribe tu nombre completo.",
    },
    fieldPhone: {
      el: $("#fieldPhone"),
      ok: (v) => v.replace(/\D/g, "").length >= 10,
      msg: "Escribe un WhatsApp válido (mín. 10 dígitos).",
    },
    fieldEmail: {
      el: $("#fieldEmail"),
      ok: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      msg: "Escribe un correo válido.",
    },
  };

  let valid = true;
  for (const [id, f] of Object.entries(fields)) {
    const ok = f.ok(f.el.value);
    f.el.closest(".field").classList.toggle("field--error", !ok);
    $(`[data-error-for="${id}"]`).textContent = ok ? "" : f.msg;
    if (!ok) valid = false;
  }
  return valid;
}

async function handleFormSubmit(e) {
  e.preventDefault();
  if (!validateForm()) return;

  state.customer = {
    name: $("#fieldName").value.trim(),
    phone: $("#fieldPhone").value.trim(),
    email: $("#fieldEmail").value.trim(),
  };

  const submitBtn = $('#checkoutForm button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Reservando…";

  const numbers = [...state.selected];
  const res = await createReservation(numbers, state.customer);

  submitBtn.disabled = false;
  submitBtn.innerHTML = 'Ir al pago <span class="btn__arrow">→</span>';

  if (!res.ok) {
    // Alguien compró alguno de los números mientras tanto
    res.conflicts.forEach((n) => {
      state.selected.delete(n);
      state.numbers[n - 1].status = NumberStatus.SOLD;
    });
    renderGrid();
    syncSelectionUI();
    closeCheckout();
    toast(
      `Lo sentimos, ${res.conflicts.map(pad).join(", ")} acaba de venderse. Te los quitamos de la selección.`,
      "error",
      5000
    );
    return;
  }

  state.reservationId = res.reservationId;
  const total = numbers.length * CONFIG.raffle.pricePerNumber;
  $("#paymentSummary").textContent =
    `${state.customer.name.split(" ")[0]}, vas a reservar ${numbers.length} número(s) ` +
    `(${numbers.map(pad).join(", ")}) por ${money(total)}.`;

  // Rellenar la tarjeta de transferencia Nequi
  const digits = CONFIG.nequi.phone.replace(/\D/g, "");
  const phonePretty = digits.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
  $("#nequiPhone").textContent = phonePretty;
  $("#nequiPhone").dataset.raw = digits;
  $("#nequiAmount").textContent = money(total);
  $("#nequiAmount").dataset.raw = String(total);
  $("#nequiHolder").textContent = CONFIG.nequi.accountHolder;
  $("#nequiRef").textContent = state.reservationId;

  gotoStep(2);
}

function whatsappLink(message) {
  return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function buildWhatsappMessage() {
  const numbers = [...state.selected].sort((a, b) => a - b);
  const total = numbers.length * CONFIG.raffle.pricePerNumber;
  const c = state.customer ?? { name: "", phone: "", email: "" };
  return [
    "Hola FADA 🐾, quiero participar en la rifa.",
    "",
    `Mis números: ${numbers.map(pad).join(", ")}`,
    `Total: ${money(total)} COP`,
    "",
    `Nombre: ${c.name}`,
    `WhatsApp: ${c.phone}`,
    `Email: ${c.email}`,
    state.reservationId ? `Reserva: ${state.reservationId}` : "",
    "",
    "✅ Ya hice la transferencia por Nequi. Te envío el comprobante.",
    "Gracias ❤️",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Botones "Copiar" de la tarjeta Nequi (número y valor). */
async function handleCopy(btn) {
  const source = $(`#${btn.dataset.copy === "nequiAmountRaw" ? "nequiAmount" : btn.dataset.copy}`);
  const text = source?.dataset.raw ?? source?.textContent ?? "";
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback para navegadores sin API de portapapeles
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
  btn.classList.add("is-copied");
  btn.textContent = "¡Copiado!";
  setTimeout(() => {
    btn.classList.remove("is-copied");
    btn.textContent = "Copiar";
  }, 1800);
}

async function handleWhatsapp() {
  // En el flujo real, la confirmación llega cuando FADA verifica
  // manualmente la transferencia Nequi (o vía webhook de la API de
  // Nequi cuando se integre). Aquí confirmamos la reserva para que
  // la demo refleje el estado final.
  await confirmReservation(state.reservationId);
  window.open(whatsappLink(buildWhatsappMessage()), "_blank", "noopener");
  showSuccess("Te abrimos WhatsApp para que envíes tu comprobante de Nequi.");
}

function showSuccess(customMessage) {
  const numbers = [...state.selected].sort((a, b) => a - b);

  // Reflejar la compra en el tablero
  numbers.forEach((n) => (state.numbers[n - 1].status = NumberStatus.SOLD));
  state.selected.clear();

  $("#successChips").innerHTML = numbers
    .map((n) => `<span class="chip">#${pad(n)}</span>`)
    .join("");
  $("#successMessage").textContent =
    customMessage ??
    `${state.customer?.name?.split(" ")[0] ?? "Gracias"}, tus ${numbers.length} número(s) quedaron registrados a tu nombre.`;

  gotoStep(3);
  confetti();

  // Actualizar tablero detrás del modal
  renderGrid();
  syncSelectionUI();
  updateProgress();
}

function initCheckout() {
  $("#checkoutBtn").addEventListener("click", openCheckout);
  $("#bottombarBtn").addEventListener("click", openCheckout);
  $("#checkoutForm").addEventListener("submit", handleFormSubmit);
  $("#whatsappBtn").addEventListener("click", handleWhatsapp);

  $$("[data-modal-close]").forEach((el) => el.addEventListener("click", closeCheckout));
  $$("[data-goto-step]").forEach((el) =>
    el.addEventListener("click", () => gotoStep(Number(el.dataset.gotoStep)))
  );
  $$(".copy-btn").forEach((el) =>
    el.addEventListener("click", () => handleCopy(el))
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal().classList.contains("is-open")) closeCheckout();
  });

  // Limpiar errores al escribir
  $$("#checkoutForm input").forEach((input) =>
    input.addEventListener("input", () => {
      input.closest(".field").classList.remove("field--error");
      $(`[data-error-for="${input.id}"]`).textContent = "";
    })
  );
}

/* ── Lightbox: ver imagen de historia maximizada ─────────── */
const lightbox = () => $("#lightbox");

function openLightbox(src, alt) {
  const img = $("#lightboxImg");
  img.src = src;
  img.alt = alt ?? "";
  lightbox().classList.add("is-open");
  lightbox().setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox().classList.remove("is-open");
  lightbox().setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function initLightbox() {
  $$("[data-lightbox-close]").forEach((el) => el.addEventListener("click", closeLightbox));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox().classList.contains("is-open")) closeLightbox();
  });
}

/* ── Refresco periódico del tablero ──────────────────────── */
const BOARD_REFRESH_MS = 30000;

async function refreshBoard() {
  // No interrumpir a quien ya está pagando/confirmando su selección.
  if (modal().classList.contains("is-open")) return;

  const numbers = await getNumbers();
  state.numbers = numbers;

  // Si alguno de los números que el visitante tenía elegidos (sin
  // confirmar aún) fue tomado por otra persona mientras tanto, se
  // le quita de la selección y se le avisa — igual que al confirmar.
  const takenWhileSelecting = [...state.selected].filter(
    (n) => state.numbers[n - 1].status !== NumberStatus.AVAILABLE
  );
  if (takenWhileSelecting.length > 0) {
    takenWhileSelecting.forEach((n) => state.selected.delete(n));
    toast(
      `${takenWhileSelecting.map(pad).join(", ")} se acaba${takenWhileSelecting.length > 1 ? "ron" : ""} de reservar. Te lo${takenWhileSelecting.length > 1 ? "s" : ""} quitamos de tu selección.`,
      "warn",
      5000
    );
  }

  renderGrid();
  syncSelectionUI();
  updateProgress();
}

/* ═══ BOOT ═══════════════════════════════════════════════ */
async function init() {
  renderStaticContent();
  initNavbar();
  initToTop();
  initCountdown();
  initCheckout();
  initLightbox();
  $("#luckyBtn").addEventListener("click", pickLucky);

  // Carga de datos (mock API)
  const [, numbers] = await Promise.all([getRaffle(), getNumbers()]);
  state.numbers = numbers;

  renderGrid();
  syncSelectionUI();
  const available = updateProgress();
  initMetrics(available);

  initReveal();
  window.addEventListener("resize", syncSelectionUI, { passive: true });
  setInterval(refreshBoard, BOARD_REFRESH_MS);
}

document.addEventListener("DOMContentLoaded", init);
