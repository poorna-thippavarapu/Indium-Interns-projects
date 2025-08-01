import { useRef, useCallback } from 'react';

// Custom hook to manage API request queuing and cancellation
export const useRequestQueue = () => {
  const pendingRequests = useRef(new Set());
  const requestQueue = useRef([]);
  const isProcessing = useRef(false);

  const cancelAllRequests = useCallback(() => {
    // Cancel all pending requests
    pendingRequests.current.forEach(controller => {
      controller.abort();
    });
    pendingRequests.current.clear();
    requestQueue.current = [];
    isProcessing.current = false;
  }, []);

  const queueRequest = useCallback(async (requestFn, priority = 0) => {
    return new Promise((resolve, reject) => {
      const request = {
        fn: requestFn,
        resolve,
        reject,
        priority,
        id: Date.now() + Math.random()
      };

      // Add to queue with priority (higher numbers = higher priority)
      requestQueue.current.push(request);
      requestQueue.current.sort((a, b) => b.priority - a.priority);

      processQueue();
    });
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessing.current || requestQueue.current.length === 0) {
      return;
    }

    isProcessing.current = true;

    while (requestQueue.current.length > 0) {
      const request = requestQueue.current.shift();
      const controller = new AbortController();
      pendingRequests.current.add(controller);

      try {
        const result = await request.fn(controller.signal);
        request.resolve(result);
      } catch (error) {
        if (error.name !== 'AbortError') {
          request.reject(error);
        }
      } finally {
        pendingRequests.current.delete(controller);
      }
    }

    isProcessing.current = false;
  }, []);

  return {
    queueRequest,
    cancelAllRequests,
    hasPendingRequests: () => pendingRequests.current.size > 0
  };
};