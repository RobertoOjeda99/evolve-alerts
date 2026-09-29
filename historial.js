// historial.js — guarda los avisos dentro del teléfono (IndexedDB). Lo usan la página y el service worker.
// Nada sale del teléfono: el historial es local y se borra solo a los 30 días.
//
// Cada aviso guardado:
//   { id, ts, titulo, cuerpo, completo, categoria, carpeta, segundos, evento }
//   categoria: 'claude' (terminó una tarea) · 'permiso' · 'github' · 'suite' · 'prueba'
const Historial = (() => {
  const BASE = 'evolve-alerts';
  const DIAS_QUE_SE_GUARDAN = 30;

  function abrir() {
    return new Promise((ok, mal) => {
      const r = indexedDB.open(BASE, 1);
      r.onupgradeneeded = () => {
        const db = r.result;
        const avisos = db.createObjectStore('avisos', { keyPath: 'id', autoIncrement: true });
        avisos.createIndex('ts', 'ts');
        db.createObjectStore('meta');
      };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => mal(r.error);
    });
  }

  const pedir = (req) => new Promise((ok, mal) => { req.onsuccess = () => ok(req.result); req.onerror = () => mal(req.error); });
  const terminar = (t) => new Promise((ok, mal) => { t.oncomplete = () => ok(); t.onerror = () => mal(t.error); t.onabort = () => mal(t.error); });

  // Guarda un aviso. Devuelve { id, sinLeer }.
  async function guardar(aviso) {
    const db = await abrir();
    const t = db.transaction(['avisos', 'meta'], 'readwrite');
    const avisos = t.objectStore('avisos');
    const meta = t.objectStore('meta');
    const id = await pedir(avisos.add({ ...aviso, ts: aviso.ts || Date.now() }));
    const limite = Date.now() - DIAS_QUE_SE_GUARDAN * 86400000;
    const viejos = avisos.index('ts').openCursor(IDBKeyRange.upperBound(limite));
    viejos.onsuccess = () => { const c = viejos.result; if (c) { c.delete(); c.continue(); } };
    const sinLeer = ((await pedir(meta.get('sinLeer'))) || 0) + 1;
    meta.put(sinLeer, 'sinLeer');
    await terminar(t);
    return { id, sinLeer };
  }

  // Todos los avisos, del más nuevo al más viejo.
  async function todos() {
    const db = await abrir();
    const lista = await pedir(db.transaction('avisos').objectStore('avisos').getAll());
    return lista.sort((a, b) => b.ts - a.ts);
  }

  async function uno(id) {
    const db = await abrir();
    return pedir(db.transaction('avisos').objectStore('avisos').get(Number(id)));
  }

  async function marcarLeidos() {
    const db = await abrir();
    const t = db.transaction('meta', 'readwrite');
    t.objectStore('meta').put(0, 'sinLeer');
    return terminar(t);
  }

  async function borrarTodo() {
    const db = await abrir();
    const t = db.transaction(['avisos', 'meta'], 'readwrite');
    t.objectStore('avisos').clear();
    t.objectStore('meta').put(0, 'sinLeer');
    return terminar(t);
  }

  return { guardar, todos, uno, marcarLeidos, borrarTodo };
})();
