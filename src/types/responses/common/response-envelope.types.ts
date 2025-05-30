export interface IMeta {
    version: string; // pattern: "^v[0-9]+$"
    timestamp: string; // format: "date-time"
}

export interface IBaseApiResponse<TData = unknown> {
    status: number;
    message: string;
    error: null;
    logged_in: boolean;
    meta: IMeta;
    data: TData; // Specific success responses will define their 'data' structure
}