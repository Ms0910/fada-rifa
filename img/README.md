# 📸 Fotos reales de los peludos de FADA

Pon aquí las fotos reales de los perritos y gatitos de la fundación.

## Nombres esperados

| Archivo        | Dónde aparece                          |
| -------------- | -------------------------------------- |
| `hero.jpg`     | Foto grande del inicio (un peludo protagonista, vertical si puedes) |
| `luna.jpg`     | Historia de Luna                       |
| `simon.jpg`    | Historia de Simón                      |
| `rocky.jpg`    | Historia de Rocky                      |
| `mia.jpg`      | Historia de Mía                        |
| `toby.jpg`     | Historia de Toby                       |
| `nala.jpg`     | Historia de Nala                       |

## Cómo activarlas

Cuando subas una foto, edita `js/config.js` y cambia la URL de Unsplash
por la ruta local. Por ejemplo:

```js
image: "img/luna.jpg",
```

## Recomendaciones

- Formato `.jpg` (o `.webp`), peso ideal menor a 500 KB por foto.
- Fotos horizontales (4:3) para las historias; vertical para el hero.
- Los peludos de las historias son criollos: fotos reales > fotos de stock.
- Si falta alguna foto, la página seguirá mostrando la imagen de
  placeholder hasta que la reemplaces en `js/config.js`.
