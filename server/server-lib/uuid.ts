import { v4 as uuidv4 } from 'uuid'

export const generateUniqueKey = (prefix: string = '') => {
  return `${prefix}${uuidv4()}`
}
