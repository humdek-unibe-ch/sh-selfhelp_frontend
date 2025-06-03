# Token Refresh Duplicate Prevention Solution

## Problem
The original implementation had two separate refresh mechanisms:
1. **401 Error Handler**: For admin pages requiring strict authentication
2. **logged_in: false Handler**: For frontend pages that can work without authentication

This caused **duplicate refresh token requests** when multiple API calls failed simultaneously.

## Solution

### **1. Shared Refresh State**
```typescript
// Shared refresh state to prevent multiple simultaneous refreshes
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];
```

### **2. Centralized Refresh Function**
```typescript
const performTokenRefresh = async (): Promise<string> => {
    // If already refreshing, return the existing promise
    if (isRefreshing && refreshPromise) {
        debug('Token refresh already in progress, waiting...', 'BaseApi');
        return refreshPromise;
    }

    // Set refreshing state and create new promise
    isRefreshing = true;
    refreshPromise = new Promise(async (resolve, reject) => {
        // ... refresh logic
    });

    return refreshPromise;
};
```

### **3. Queue Management**
```typescript
const handleRefreshWithQueue = async (originalRequest: InternalAxiosRequestConfig): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Add to queue if already refreshing
        if (isRefreshing) {
            debug('Adding request to refresh queue', 'BaseApi');
            failedQueue.push({ resolve, reject });
            return;
        }

        // Start refresh process
        performTokenRefresh()
            .then((token) => {
                processQueue(null, token);
                resolve(token);
            })
            .catch((refreshError) => {
                processQueue(refreshError, null);
                reject(refreshError);
            });
    });
};
```

## Key Features

### **✅ Single Refresh Guarantee**
- Only one refresh request executes at a time
- Subsequent requests wait for the ongoing refresh
- All requests use the same refreshed token

### **✅ Both Mechanisms Preserved**
- **Admin pages**: Still get 401 error handling with strict auth
- **Frontend pages**: Still work with `logged_in: false` but attempt refresh

### **✅ Smart Request Handling**
- Admin requests (`/admin/`, `/dashboard/`) require strict authentication
- Frontend requests can continue with `logged_in: false` if refresh fails
- Proper error handling for different scenarios

### **✅ Refine Integration**
- Uses Refine's `authProvider.logout()` for proper navigation
- Integrates with Refine's authentication flow
- Maintains compatibility with existing auth system

## How It Works

### **Scenario 1: Multiple Concurrent 401 Errors**
1. First request triggers refresh → `isRefreshing = true`
2. Subsequent requests get queued → `failedQueue.push()`
3. When refresh completes → all queued requests get new token
4. All requests retry with fresh token

### **Scenario 2: logged_in: false + 401 Error**
1. Frontend request gets `logged_in: false` → triggers refresh
2. Admin request gets 401 → waits for ongoing refresh
3. Both use same refreshed token
4. Frontend continues normally, admin gets authenticated

### **Scenario 3: Refresh Failure**
1. Refresh fails → all queued requests get error
2. Admin requests → redirect to login via Refine
3. Frontend requests → continue with original response

## Debug Integration

The solution includes comprehensive debug logging:
- Refresh start/completion tracking
- Queue management logging
- Request type identification
- Error handling with context

## Environment Considerations

- **Development**: Full debug logging enabled
- **Production**: Minimal logging, same functionality
- **Testing**: Can enable debug logging for troubleshooting

## Benefits

1. **No Duplicate Requests**: Prevents multiple refresh calls
2. **Better Performance**: Reduces server load and response times
3. **Improved UX**: Faster authentication recovery
4. **Debugging**: Clear visibility into refresh process
5. **Flexibility**: Supports both strict and lenient auth modes 