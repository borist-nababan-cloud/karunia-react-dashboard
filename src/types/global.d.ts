export { };

declare global {
    interface Window {
        google: any;
    }

    const google: any;
}

declare module 'file-saver' {
    export function saveAs(data: Blob | string, filename?: string, options?: any): void;
}
