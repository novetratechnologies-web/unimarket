// middleware/requestQueue.js - FIXED WITH TIMEOUT
class RequestQueue {
  constructor(maxConcurrent = 50, queueTimeout = 10000) {
    this.maxConcurrent = maxConcurrent;
    this.queue = [];
    this.current = 0;
    this.waitingTime = 0;
    this.queueTimeout = queueTimeout; // 10 seconds max wait
  }

  async enqueue(req, res, next) {
    const startTime = Date.now();
    
    // If we're at max capacity, queue the request
    if (this.current >= this.maxConcurrent) {
      this.waitingTime++;
      
      // Return 503 if queue is too long
      if (this.queue.length > 100) {
        return res.status(503).json({
          error: 'Server busy',
          message: 'Too many requests queued, please try again',
          queueLength: this.queue.length,
          retryAfter: 5
        });
      }

      // Wait in queue with TIMEOUT
      try {
        await Promise.race([
          new Promise(resolve => {
            this.queue.push({ resolve, req, res, next });
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Queue timeout')), this.queueTimeout)
          )
        ]);
      } catch (error) {
        // Queue timeout - reject the request
        console.warn(`⏰ Request timed out in queue: ${req.method} ${req.url}`);
        return res.status(503).json({
          success: false,
          error: 'Queue timeout',
          message: 'Request timed out waiting in queue',
          retryAfter: 5
        });
      }
    }

    this.current++;
    
    // Track queue wait time
    const waitTime = Date.now() - startTime;
    if (waitTime > 1000) {
      console.warn(`⚠️ Request waited ${waitTime}ms in queue: ${req.method} ${req.url}`);
    }

    // Process request
    const complete = () => {
      this.current--;
      this.waitingTime = Math.max(0, this.waitingTime - 1);
      
      // Process next in queue
      if (this.queue.length > 0) {
        const nextRequest = this.queue.shift();
        // Use setImmediate to avoid stack overflow
        setImmediate(() => nextRequest.resolve());
      }
    };

    // Attach complete to response
    const originalEnd = res.end;
    res.end = function(...args) {
      complete();
      return originalEnd.apply(this, args);
    };

    next();
  }

  getStatus() {
    return {
      current: this.current,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent,
      waitingTime: this.waitingTime,
      queueTimeout: this.queueTimeout,
      utilization: Math.round((this.current / this.maxConcurrent) * 100) + '%'
    };
  }

  // Add method to clear stuck requests
  clearStuckRequests() {
    const now = Date.now();
    // Implementation would track request timestamps
    // For now, just log
    console.log(`🧹 Queue status: ${this.queue.length} waiting, ${this.current} active`);
  }
}

const requestQueue = new RequestQueue(50, 10000); // 10 second queue timeout

export const queueMiddleware = (req, res, next) => {
  return requestQueue.enqueue(req, res, next);
};

export const getQueueStatus = () => requestQueue.getStatus();

// Add periodic queue monitoring
setInterval(() => {
  const status = requestQueue.getStatus();
  if (status.queued > 0) {
    console.log(`📊 Queue status: ${status.queued} waiting, ${status.current} active`);
  }
}, 5000);

export default requestQueue;