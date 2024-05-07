interface Window {
    ethereum: {
        request: ({ method, params }: { method: string; params: any[] }) => Promise<any>;
    };
}