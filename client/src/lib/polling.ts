function startPolling(fetchFunction: () => Promise<void>, interval: number): () => void {
    const intervalId = setInterval(fetchFunction, interval);
    return () => clearInterval(intervalId);
}
export default startPolling;