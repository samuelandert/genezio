class PollingManager {
    private polls: Map<string, NodeJS.Timeout> = new Map();
    private defaultInterval = 5000; // Default interval set to 5000 milliseconds (5 seconds)

    startPolling(key: string, fetchFunction: () => Promise<void>, interval: number = this.defaultInterval): void {
        this.stopPolling(key); // Ensure no duplicates
        const intervalId = setInterval(fetchFunction, interval);
        this.polls.set(key, intervalId);
    }

    stopPolling(key: string): void {
        if (this.polls.has(key)) {
            clearInterval(this.polls.get(key));
            this.polls.delete(key);
        }
    }

    stopAllPolling(): void {
        this.polls.forEach((value, key) => {
            clearInterval(value);
        });
        this.polls.clear();
    }
}

export const pollingManager = new PollingManager();