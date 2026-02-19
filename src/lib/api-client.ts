import { offlineQueue } from "./offline-sync/queue";

export const apiClient = {
    async get(url: string) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
        return res.json();
    },

    async post(url: string, body: any) {
        if (!navigator.onLine) {
            console.log("Offline: Queueing POST request to", url);
            await offlineQueue.enqueue(url, body);
            // Simulate success for optimistic UI? 
            // Or throw specific error that UI can catch and show "Queued" state?
            // For now, let's return a "mock" success response structure if possible, 
            // or let the caller decide.
            // Returning a specific object indicating queued status.
            return { __queued: true, success: true };
        }

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error(`POST ${url} failed: ${res.status}`);
            return res.json();
        } catch (e) {
            // Network failure even if navigator says online?
            // If fetch throws (network error), enqueue it.
            console.log("Network error: Queueing POST request to", url);
            await offlineQueue.enqueue(url, body);
            return { __queued: true, success: true };
        }
    }
};
