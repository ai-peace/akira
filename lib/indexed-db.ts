import { IDBPDatabase, openDB } from 'idb'

const DB_NAME = 'agent-rare'
const STORE_NAME = 'documents'
const DB_VERSION = 1

let dbInstance: IDBPDatabase | null = null

const initDB = async () => {
  const database = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME)
      }

      db.createObjectStore(STORE_NAME, {
        keyPath: 'uniqueKey',
      })
    },
  })

  return database
}

export const getIndexedDB = async () => {
  if (dbInstance) return dbInstance

  dbInstance = await initDB()

  return dbInstance
}
