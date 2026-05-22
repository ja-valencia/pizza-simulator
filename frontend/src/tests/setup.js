// Setup global para tests de Vitest.
// jsdom provee el DOM pero no localStorage — lo mockeamos aquí.
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    _store: {},
    getItem: (k) => global.localStorage._store[k] ?? null,
    setItem: (k, v) => { global.localStorage._store[k] = String(v) },
    removeItem: (k) => { delete global.localStorage._store[k] },
    clear: () => { global.localStorage._store = {} },
  }
}
