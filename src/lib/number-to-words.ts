/**
 * Conversor de cifras numéricas en pesos chilenos a texto legal formal en mayúsculas.
 * Ej: 293500 -> "DOSCIENTOS NOVENTA Y TRES MIL QUINIENTOS PESOS"
 */
export function numberToWordsCLP(amount: number): string {
  const rounded = Math.round(Math.abs(amount))
  if (rounded === 0) return 'CERO PESOS'

  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE']
  const especiales = [
    'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE',
  ]
  const decenas = [
    '', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA',
  ]
  const centenas = [
    '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS',
  ]

  function seccion(num: number): string {
    let output = ''

    if (num === 100) {
      return 'CIEN'
    }

    const c = Math.floor(num / 100)
    const d = Math.floor((num % 100) / 10)
    const u = num % 10

    if (c > 0) {
      output += centenas[c] + ' '
    }

    if (d === 1) {
      output += especiales[u] + ' '
    } else if (d === 2) {
      if (u === 0) {
        output += 'VEINTE '
      } else {
        output += 'VEINTI' + unidades[u] + ' '
      }
    } else if (d > 2) {
      output += decenas[d] + ' '
      if (u > 0) {
        output += 'Y ' + unidades[u] + ' '
      }
    } else if (u > 0) {
      output += unidades[u] + ' '
    }

    return output.trim()
  }

  const millones = Math.floor(rounded / 1000000)
  const miles = Math.floor((rounded % 1000000) / 1000)
  const resto = rounded % 1000

  let resultado = ''

  if (millones > 0) {
    if (millones === 1) {
      resultado += 'UN MILLÓN '
    } else {
      resultado += seccion(millones) + ' MILLONES '
    }
  }

  if (miles > 0) {
    if (miles === 1) {
      resultado += 'MIL '
    } else {
      resultado += seccion(miles) + ' MIL '
    }
  }

  if (resto > 0) {
    resultado += seccion(resto) + ' '
  }

  return resultado.trim() + ' PESOS'
}
