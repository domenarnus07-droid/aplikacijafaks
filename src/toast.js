/**
 * Globalni toast sistem — neodvisen od React hooks.
 * App.jsx registrira obravnavo z registrirajToast().
 * api.js in ostali moduli pokličejo prikaziObvestilo().
 */

let _obravnava = null

export function registrirajToast(fn) {
  _obravnava = fn
}

/**
 * @param {string} sporocilo
 * @param {'uspeh'|'napaka'|'info'} tip
 */
export function prikaziObvestilo(sporocilo, tip = 'uspeh') {
  if (_obravnava) {
    _obravnava(sporocilo, tip)
  } else {
    console.warn('[StudyOS toast]', tip, sporocilo)
  }
}
