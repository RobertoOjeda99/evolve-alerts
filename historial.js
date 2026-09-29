// historial.js — guarda los avisos dentro del teléfono (IndexedDB). Lo usan la página y el service worker.
// Nada sale del teléfono: el historial es local y se borra solo a los 30 días.
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

  function tx(db, tiendas, modo, fn) {
    return new Promise((ok, mal) => {
      const t = db.transaction(tiendas, modo);
      let resultado;
      Promise.resolve(fn(t)).then((v) => { resultado = v; });
      t.oncomplete = () => ok(resultado);
      t.onerror = () => mal(t.error);
      t.onabort = () => mal(t.error);
    });
  }

  const pedir = (req) => new Promise((ok, mal) => { req.onsuccess = () => ok(req.result); req.onerror = () => mal(req.error); });

  // Guarda un aviso y devuelve cuántos hay sin leer.
  async function guardar(aviso) {
    const db = await abrir();
    const limite = Date.now() - DIAS_QUE_SE_GUARDAN * 86400000;
    return tx(db, ['avisos', 'meta'], 'readwrite', async (t) => {
      const avisos = t.objectStore('avisos');
      avisos.add({ ...aviso, ts: aviso.ts || Date.now() });
      // limpieza: lo de hace más de 30 días
      const viejos = avisos.index('ts').openCursor(IDBKeyRange.upperBound(limite));
      viejos.onsuccess = () => { const c = viejos.result; if (c) { c.delete(); c.continue(); } };
      const meta = t.objectStore('meta');
      const sinLeer = ((await pedir(meta.get('sinLeer'))) || 0) + 1;
      meta.put(sinLeer, 'sinLeer');
      return sinLeer;
    });
  }

  // Todos los avisos, del más nuevo al más viejo.
  async function todos() {
    const db = await abrir();
    return tx(db, ['avisos'], 'readonly', (t) => pedir(t.objectStore('avisos').getAll()))
      .then((lista) => lista.sort((a, b) => b.ts - a.ts));
  }

  async function marcarLeidos() {
    const db = await abrir();
    return tx(db, ['meta'], 'readwrite', (t) => { t.objectStore('meta').put(0, 'sinLeer'); });
  }

  async function borrarTodo() {
    const db = await abrir();
    return tx(db, ['avisos', 'meta'], 'readwrite', (t) => { t.objectStore('avisos').clear(); t.objectStore('meta').put(0, 'sinLeer'); });
  }

  return { guardar, todos, marcarLeidos, borrarTodo };
})();
