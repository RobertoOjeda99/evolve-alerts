# Evolve Alerts

App web del equipo de Evolve Digital para recibir en el celular los avisos de Claude Code, de GitHub
y de la suite de pruebas del ERP.

- **Avisos**: el historial de lo que te ha llegado, con búsqueda. Toca uno para leerlo completo.
- **Resumen**: cuántas tareas terminaron tus ventanas, cuánto trabajaron y qué pasó en GitHub.
- **Ajustes**: qué avisos quieres, carpetas en silencio y horario de no molestar.

## Cómo funciona

No hay servidor. Cada PC del equipo firma sus avisos con una llave privada que nunca sale de las PCs
y los manda directo al servicio de notificaciones de Apple o Google. Aquí sólo vive la llave pública.
El historial se guarda en el teléfono (IndexedDB) y se borra solo a los 30 días.

Los ajustes se eligen en la app y viajan a la PC como un código (`evolve-alerts pegar`), porque es la
PC la que decide qué avisos mandar: el iPhone no deja a una app recibir un aviso y esconderlo.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La app: registro, las tres pestañas y el detalle de un aviso. |
| `sw.js` | Recibe cada aviso, lo guarda en el historial y lo muestra. |
| `historial.js` | Guardar y leer avisos en el teléfono. Lo usan la app y `sw.js`. |
| `manifest.webmanifest` | Nombre, ícono y colores para instalarla en la pantalla de inicio. |

La parte de la PC (hooks, emisor, vigilante de GitHub e instalador) se reparte al equipo aparte,
porque lleva la llave privada.
