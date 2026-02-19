export interface QueueItem {
    id: string
    url: string
    method: string
    body: any
    headers?: any
    timestamp: number
    attempts: number
    idempotencyKey: string
}

const DB_NAME = 'skill-arena-db'
const STORE_NAME = 'offline-queue'
const DB_VERSION = 1

export class OfflineStorage {
    private dbPromise: Promise<IDBDatabase>

    constructor() {
        if (typeof window === 'undefined') {
            this.dbPromise = Promise.reject("Server side")
            return
        }

        this.dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION)

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' })
                }
            }

            request.onsuccess = (event) => {
                resolve((event.target as IDBOpenDBRequest).result)
            }

            request.onerror = (event) => {
                reject((event.target as IDBOpenDBRequest).error)
            }
        })
    }

    async addItem(item: QueueItem): Promise<void> {
        const db = await this.dbPromise
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite')
            const store = tx.objectStore(STORE_NAME)
            const req = store.put(item)
            req.onsuccess = () => resolve()
            req.onerror = () => reject(req.error)
        })
    }

    async getItems(): Promise<QueueItem[]> {
        const db = await this.dbPromise
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly')
            const store = tx.objectStore(STORE_NAME)
            const req = store.getAll()
            req.onsuccess = () => resolve((req.result as QueueItem[]).sort((a, b) => a.timestamp - b.timestamp))
            req.onerror = () => reject(req.error)
        })
    }

    async removeItem(id: string): Promise<void> {
        const db = await this.dbPromise
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite')
            const store = tx.objectStore(STORE_NAME)
            const req = store.delete(id)
            req.onsuccess = () => resolve()
            req.onerror = () => reject(req.error)
        })
    }
}

export const offlineStorage = new OfflineStorage()
