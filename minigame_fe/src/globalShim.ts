// SockJS expects a Node-like global; provide it in the browser.
if (!('global' in globalThis)) {
  ;(globalThis as { global?: typeof globalThis }).global = globalThis
}

