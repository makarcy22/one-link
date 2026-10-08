export declare const api: {
    get: (path: string) => Promise<any>;
    post: (path: string, body: unknown) => Promise<any>;
    put: (path: string, body: unknown) => Promise<any>;
    del: (path: string) => Promise<any>;
};
