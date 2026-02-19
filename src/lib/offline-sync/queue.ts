import { offlineStorage, QueueItem } from "./storage"

export class OfflineQueue {
    async enqueue(url: string, body: any, method: string = 'POST') {
        const item: QueueItem = {
            id: crypto.randomUUID(),
            url,
            method,
            body,
            timestamp: Date.now(),
            attempts: 0,
            idempotencyKey: crypto.randomUUID()
        }
        await offlineStorage.addItem(item)
        console.log("Enqueued offline item:", item)
        // Try to sync immediately if online
        if (navigator.onLine) {
            this.processQueue()
        }
    }

    async processQueue() {
        if (!navigator.onLine) return

        const items = await offlineStorage.getItems()
        if (items.length === 0) return

        console.log(`Processing ${items.length} offline items...`)

        for (const item of items) {
            try {
                const res = await fetch(item.url, {
                    method: item.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'x-idempotency-key': item.idempotencyKey,
                        ...(item.headers || {})
                    },
                    body: JSON.stringify(item.body)
                })

                if (res.ok || res.status === 409) { // 409 = Conflict (already processed)
                    await offlineStorage.removeItem(item.id)
                    console.log(`Synced item ${item.id}`)
                } else {
                    // Fatal error? 
                    console.error(`Failed to sync item ${item.id}: ${res.status}`)
                    // If 5xx, keep it. If 4xx (client error), maybe discard?
                    // For now, simple retry logic: increment attempts
                    item.attempts++
                    if (item.attempts > 5) {
                        // Dead letter queue logic here (log to server about safety/failure)
                        await offlineStorage.removeItem(item.id) // Discard for now
                    } else {
                        await offlineStorage.addItem(item) // Update attempts
                    }
                }
            } catch (e) {
                console.error("Network error during sync", e)
                // Keep in queue
            }
        }
    }

    async size(): Promise<number> {
        const items = await offlineStorage.getItems()
        return items.length
    }
}

export const offlineQueue = new OfflineQueue()

// Auto-process when coming online
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        offlineQueue.processQueue()
    })
}
