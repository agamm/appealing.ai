export class Semaphore {
  private queue: Array<() => void> = []
  private running = 0
  
  constructor(
    private maxConcurrent: number,
    private minInterval?: number
  ) {}
  
  private lastRun = 0
  
  async acquire(): Promise<void> {
    if (this.running >= this.maxConcurrent) {
      await new Promise<void>(resolve => this.queue.push(resolve))
    }
    
    if (this.minInterval !== undefined) {
      const now = Date.now()
      const timeSinceLastRun = now - this.lastRun
      if (timeSinceLastRun < this.minInterval) {
        const delay = this.minInterval - timeSinceLastRun
        await new Promise(resolve => setTimeout(resolve, delay))
      }
      this.lastRun = Date.now()
    }
    
    this.running++
  }
  
  release(): void {
    this.running--
    if (this.queue.length > 0) {
      const next = this.queue.shift()
      if (next) next()
    }
  }
  
  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire()
    try {
      return await fn()
    } finally {
      this.release()
    }
  }
}