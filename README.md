# Evolve Alerts

App web del equipo de Evolve Digital para recibir en el celular los avisos de Claude Code, de GitHub
y de Sereno (el QA nocturno). Cada servicio tiene su color: Claude naranja, GitHub morado y Sereno
azul noche.

- **Avisos**: el historial de lo que te ha llegado, con filtros por servicio y búsqueda.
- **Sereno**: cómo amaneció cada sistema (fallas nuevas, las que siguen, las arregladas y los
  cambios que entraron).
- **Resumen**: cuántas tareas terminaron tus ventanas de Claude y qué pasó en GitHub.
- **Ajustes**: qué avisos quieres de cada servicio y de qué sistemas; se guardan solos en el
  servidor. Los administradores invitan y quitan gente desde aquí.

## Cómo funciona

- **Alta por invitación.** Un administrador crea en Ajustes → Equipo una invitación (nombre y
  usuario de GitHub) y le pasa a la persona un código de 8 letras. La app lo canjea en el servidor.
- **Servidor** (`servidor.mjs` del paquete del equipo, en el devcloud detrás de Caddy):
  guarda los teléfonos y sus ajustes y sirve los resultados de Sereno. Cada teléfono se identifica
  con su propia suscripción push (endpoint + llave `auth`), sin contraseñas.
- **Quién manda los avisos.** El vigilante de GitHub y Sereno corren en el devcloud; los de Claude
  salen de la PC de cada quien (que se conecta con el código de Ajustes → Este teléfono). Todos
  firman con la llave privada VAPID, que nunca está en este repo; aquí sólo vive la pública.
- **Historial** en el teléfono (IndexedDB), se borra solo a los 30 días.
- El iPhone no deja colorear una notificación: cada una lleva el símbolo de su servicio al inicio
  del título (🟠 Claude, 🟣 GitHub, 🌙 Sereno).

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La app: alta con invitación, las cuatro pestañas y el detalle de un aviso. |
| `sw.js` | Recibe cada aviso, lo guarda en el historial y lo muestra. |
| `historial.js` | Guardar y leer avisos en el teléfono. Lo usan la app y `sw.js`. |
| `manifest.webmanifest` | Nombre, ícono y colores para instalarla en la pantalla de inicio. |

La parte de la PC y del servidor (hooks, emisor, vigilante, servidor e instalador) se reparte aparte,
porque lleva la llave privada.
