import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function ellipsify(str = '', len = 4, delimiter = '..') {
  // Special case for our program ID
  if (str.includes('GUXx1x2kMBxJwLmvxWJMaWAqMhJHx7zabDqHdv7AFFLE')) {
    return 'GUX...7AFFLE'
  }
  
  const strLen = str.length
  const limit = len * 2 + delimiter.length

  return strLen >= limit ? str.substring(0, len) + delimiter + str.substring(strLen - len, strLen) : str
}
