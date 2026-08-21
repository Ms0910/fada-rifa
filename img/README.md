# 📸 Fotos reales de los peludos de FADA

Pon aquí las fotos reales de los perritos y gatitos de la fundación.

## Fotos en uso

| Archivo                | Dónde aparece                                |
| ----------------------- | --------------------------------------------- |
| `abuelito_portada.jpg`  | Foto grande del inicio (hero, en `index.html`) |
| `escaladora.jpg`        | Historia "La Escaladora" (`js/config.js`)     |
| `moquillosurvivor.jpg`  | Historia "El Sobreviviente" (`js/config.js`)  |
| `puppybrothers.jpg`     | Historia "Los Hermanitos" (`js/config.js`)    |
| `puppyskin.jpg`         | Historia "Piel de Ángel" (`js/config.js`)     |
| `allpuppys.jpg`         | Historia "La Manada FADA" (`js/config.js`)    |

## Cómo cambiarlas

La foto del hero se cambia directamente en `index.html`
(`<figure class="hero__photo">`). Las fotos de historias se cambian en
`js/config.js`, dentro de `CONFIG.stories`:

```js
image: "img/escaladora.jpg",
```

## Recomendaciones

- Formato `.jpg` (o `.webp`), peso ideal menor a 500 KB por foto.
- Fotos horizontales (4:3) para las historias; vertical para el hero.
- Los peludos de las historias son criollos: fotos reales > fotos de stock.
- Si falta alguna foto, la página seguirá mostrando la imagen de
  placeholder hasta que la reemplaces en `js/config.js`.
