export interface Meta {
    version: string; // pattern: "^v[0-9]+$"
    timestamp: string; // format: "date-time"
}

export interface BaseApiResponse<TData = unknown> {
    status: number;
    message: string;
    error: null;
    logged_in: boolean;
    meta: Meta;
    data: TData; // Specific success responses will define their 'data' structure
}