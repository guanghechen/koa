/* !
 * bytes
 * Copyright(c) 2012-2014 TJ Holowaychuk
 * Copyright(c) 2015 Jed Watson
 * MIT Licensed
 */

const formatThousandsRegExp = /\B(?=(\d{3})+(?!\d))/g
const formatDecimalsRegExp = /(?:\.0*|(\.[^0]+)0+)$/

export type IBytesUnit = 'b' | 'kb' | 'mb' | 'gb' | 'tb' | 'pb'

const map: Record<IBytesUnit, number> = {
  b: 1,
  kb: 1 << 10,
  mb: 1 << 20,
  gb: 1 << 30,
  tb: Math.pow(1024, 4),
  pb: Math.pow(1024, 5),
}

const parseRegExp = /^((-|\+)?(\d+(?:\.\d+)?)) *(kb|mb|gb|tb|pb)$/i

interface IFormatOptions {
  decimalPlaces?: number
  fixedDecimals?: number
  thousandsSeparator?: string
  unit?: string
  unitSeparator?: string
}

/**
 * Convert the given value in bytes into a string or parse to string to an integer in bytes.
 */
export function bytes(
  value: string | number,
  options: IFormatOptions = {},
): string | number | null {
  if (typeof value === 'string') return parse(value)
  if (typeof value === 'number') return format(value, options)
  return null
}

/**
 * Format the given value in bytes into a string.
 * If the value is negative, it is kept as such. If it is a float, it is rounded.
 */
export function format(value: number, options: IFormatOptions = {}): string | null {
  if (!Number.isFinite(value)) return null

  const mag = Math.abs(value)
  const thousandsSeparator = (options && options.thousandsSeparator) || ''
  const unitSeparator = (options && options.unitSeparator) || ''
  const decimalPlaces = options && options.decimalPlaces !== undefined ? options.decimalPlaces : 2
  const fixedDecimals = Boolean(options && options.fixedDecimals)
  let unit: IBytesUnit =
    (typeof options.unit === 'string' && (options.unit.toLowerCase() as IBytesUnit)) || 'b'

  if (!unit || !map[unit.toLowerCase() as IBytesUnit]) {
    if (mag >= map.pb) {
      unit = 'pb'
    } else if (mag >= map.tb) {
      unit = 'tb'
    } else if (mag >= map.gb) {
      unit = 'gb'
    } else if (mag >= map.mb) {
      unit = 'mb'
    } else if (mag >= map.kb) {
      unit = 'kb'
    } else {
      unit = 'b'
    }
  }

  const val = value / map[unit]

  let str = val.toFixed(decimalPlaces)
  if (!fixedDecimals) str = str.replace(formatDecimalsRegExp, '$1')
  if (thousandsSeparator) {
    str = str
      .split('.')
      .map(function (s, i) {
        return i === 0 ? s.replace(formatThousandsRegExp, thousandsSeparator) : s
      })
      .join('.')
  }

  return str + unitSeparator + unit
}

/**
 * Parse the string value into an integer in bytes.
 * If no unit is given, it is assumed the value is in bytes.
 */
export function parse(val: number | string): number | null {
  if (typeof val === 'number' && !Number.isNaN(val)) return val

  if (typeof val !== 'string') return null

  // Test if the string passed is valid
  const results = parseRegExp.exec(val)
  let floatValue
  let unit: IBytesUnit = 'b'

  if (!results) {
    // Nothing could be extracted from the given string
    floatValue = parseInt(val, 10)
    unit = 'b'
  } else {
    // Retrieve the value and the unit
    floatValue = parseFloat(results[1])
    unit = results[4].toLowerCase() as IBytesUnit
  }

  if (Number.isNaN(floatValue)) return null
  return Math.floor(map[unit] * floatValue)
}
