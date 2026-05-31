import jwt from 'jsonwebtoken'

const SKRIVNOST = process.env.JWT_SECRET || 'studyos-jwt-skrivnost-2024'

export function ustvariZeton(payload) {
  return jwt.sign(payload, SKRIVNOST, { expiresIn: '30d' })
}

export function preveriZeton(req, res, next) {
  const glava = req.headers.authorization
  if (!glava?.startsWith('Bearer ')) {
    return res.status(401).json({ napaka: 'Ni avtorizacije' })
  }
  try {
    req.uporabnik = jwt.verify(glava.slice(7), SKRIVNOST)
    next()
  } catch {
    res.status(401).json({ napaka: 'Neveljaven žeton' })
  }
}

export function zahtevajAdmin(req, res, next) {
  if (req.uporabnik?.vloga !== 'admin') {
    return res.status(403).json({ napaka: 'Samo admin dostop' })
  }
  next()
}
