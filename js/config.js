/**
 * ═══════════════════════════════════════════════════════════
 *  FADA — Configuración central de la rifa
 *  Edita AQUÍ todos los datos de negocio. Nada más en la app
 *  debería hardcodear precios, premios, fechas ni contactos.
 * ═══════════════════════════════════════════════════════════
 */

export const CONFIG = {
  foundation: {
    name: "FADA",
    fullName: "Fundación de Ayuda para Perros y Gatos",
    email: "hola@fada.org",
  },

  /** WhatsApp de contacto en formato internacional sin "+" ni espacios. */
  whatsappNumber: "573144713476",

  /**
   * 🌐 API de estados de los puestos (Cloudflare Worker + D1, ver worker/).
   * Deja baseUrl vacío ("") para desarrollo local con el mock de data.js.
   * En producción apunta al Worker, ej:
   *   baseUrl: "https://fada-rifa-api.<tu-subdominio>.workers.dev"
   */
  api: {
    baseUrl: "",
  },

  /**
   * 💜 PAGO CON NEQUI — transferencia Nequi → Nequi.
   * Ojo: Nequi NO permite pre-llenar monto/destino desde una URL web;
   * la persona digita el número y el valor en su app. Para cobro
   * automático (pago push) se necesita la API de Nequi para comercios
   * — ver data.js.
   */
  nequi: {
    phone: "3144713476",            // número Nequi destino
    accountHolder: "Fundación FADA",
    webUrl: "https://www.nequi.com.co",
  },

  raffle: {
    pricePerNumber: 10000,          // COP
    totalNumbers: 100,              // 1..100
    currency: "COP",
    locale: "es-CO",
    /** Fecha objetivo del sorteo (ISO 8601 con zona horaria). La cuenta regresiva usa este valor. */
    drawDate: "2026-09-05T19:00:00-05:00",
    /** Cómo se elige el ganador — se muestra tal cual en la sección del premio. */
    winningCriteria:
      "Últimas 2 cifras de la Lotería de Santander (el 00 equivale al 100)",
  },

  prize: {
    name: "2 colonias de tu elección",
    approxValue: 200000,            // COP (valor aproximado de las dos colonias)
    description:
      "Dos colonias originales de las mejores marcas, nuevas y selladas. " +
      "Si ganas, tú eliges las referencias que más te gusten. " +
      "Participa con tu número de la suerte y, de paso, ayuda a los 63 " +
      "perritos y a los gatitos que cuidamos en FADA.",
    image:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1200&auto=format&fit=crop",
    conditions:
      "El ganador se contactará por WhatsApp y correo dentro de las 24 horas siguientes al sorteo, " +
      "y podrá elegir sus dos colonias del catálogo disponible. " +
      "El premio se entrega en persona o se envía a cualquier ciudad de Colombia sin costo.",
  },

  /** 📊 Datos reales de la fundación — actualizar cuando cambien. */
  stats: {
    dogsInFoundation: 63,           // perritos actualmente en la fundación
    catsRescued: 24,                // gatitos rescatados
    // Un número ($10.000) ≈ 2 días de comida de un peludo (~$5.000/día).
    // Si se venden los 100 números: $1.000.000 COP de meta total.
    impact: { foodDays: 2, vetTreatments: 26, recentRescues: 14, adoptions: 38 },
  },

  stories: [
    // 📸 Fotos placeholder (Unsplash). Cuando tengas las fotos reales,
    // guárdalas en la carpeta img/ y cambia cada `image` por su ruta
    // local, ej: image: "img/luna.jpg" — ver img/README.md
    {
      name: "Luna",
      status: "recovery", // rescued | recovery | adopted
      statusLabel: "En recuperación",
      text: "Fue encontrada en condiciones críticas junto a una carretera. Hoy come sola, gana peso y espera una familia.",
      image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Simón",
      status: "adopted",
      statusLabel: "Adoptado",
      text: "Llegó desconfiado y lleno de miedo. Tres meses después conquistó a su nueva familia… y a su sofá favorito.",
      image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Rocky",
      status: "rescued",
      statusLabel: "Rescatado",
      text: "Vivía atado a un poste. Ahora corre todos los días en el patio de la fundación mientras encuentra hogar.",
      image: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Mía",
      status: "adopted",
      statusLabel: "Adoptada",
      text: "La recogimos con sus tres gatitos. Todos encontraron hogar. Mía ronronea en brazos de su nueva mamá.",
      image: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Toby",
      status: "recovery",
      statusLabel: "En recuperación",
      text: "Un criollito noble que está superando una cirugía de cadera gracias al aporte de personas como tú. Falta poco para que esté listo para adopción.",
      image: "https://images.unsplash.com/photo-1558788353-f76d92427f16?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Nala",
      status: "rescued",
      statusLabel: "Rescatada",
      text: "Apareció en un parque, desnutrida. Hoy es la primera en saludar a quien visita la fundación.",
      image: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?q=80&w=900&auto=format&fit=crop",
    },
  ],

  faq: [
    {
      q: "¿Cómo sé que el sorteo es transparente?",
      a: "El ganador se define con las últimas 2 cifras de la Lotería de Santander (el 00 equivale al 100): nadie en la fundación puede elegir ni alterar el resultado. Como la rifa se anuncia el sábado 5 de septiembre y la lotería juega los viernes, se toma el sorteo del viernes 4 de septiembre a las 11:00 p.m. Publicamos el resultado y al ganador el mismo día.",
    },
    {
      q: "¿Cómo reservo mis números?",
      a: "Elige tus números en la tabla, completa tus datos y realiza el pago. También puedes continuar por WhatsApp: te enviaremos un mensaje con tu selección lista para confirmar.",
    },
    {
      q: "¿Qué pasa si compro un número y no gano?",
      a: "Tu aporte igual cumplió su propósito: el 100% de lo recaudado se destina a alimentación, veterinaria, rescate y preparación para adopción de nuestros animales.",
    },
    {
      q: "¿Cuándo y cómo me entero si gané?",
      a: "Te contactamos por WhatsApp y correo dentro de las 24 horas siguientes al sorteo. También publicamos el resultado en nuestras redes oficiales.",
    },
    {
      q: "¿Puedo comprar números desde fuera de Colombia?",
      a: "Sí. Escríbenos por WhatsApp y coordinamos un método de pago internacional. El premio se entrega en Colombia o se coordina con el ganador.",
    },
  ],
};
