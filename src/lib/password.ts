import crypto from 'crypto'

/**
 * Cifra una contraseña usando PBKDF2 (SHA-512) con salt único.
 * No requiere librerías nativas externas (como bcrypt C++ bindings)
 * garantizando compatibilidad 100% nativa con Vercel Serverless.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const iterations = 100000
  const keylen = 64
  const digest = 'sha512'
  const hash = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString('hex')
  return `pbkdf2$${iterations}$${salt}$${hash}`
}

/**
 * Compara una contraseña en texto plano contra un hash PBKDF2.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split('$')
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
      return false
    }
    const iterations = parseInt(parts[1], 10)
    const salt = parts[2]
    const originalHash = parts[3]

    const calculatedHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex')
    return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(calculatedHash, 'hex'))
  } catch (error) {
    console.error('Error verifying password:', error)
    return false
  }
}
