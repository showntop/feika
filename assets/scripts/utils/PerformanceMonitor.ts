/**
 * 性能监控工具类
 * 用于追踪和记录关键操作的性能指标
 */

export interface PerformanceMetrics {
    operation: string;
    duration: number;
    timestamp: number;
}

export class PerformanceMonitor {
    private static metrics: Map<string, PerformanceMetrics[]> = new Map();
    private static operationStartTimes: Map<string, number> = new Map();
    private static maxMetricsPerOperation: number = 100;

    /**
     * 开始测量操作性能
     */
    public static startMeasure(operation: string): void {
        this.operationStartTimes.set(operation, performance.now());
    }

    /**
     * 结束测量操作性能
     */
    public static endMeasure(operation: string): number | null {
        const startTime = this.operationStartTimes.get(operation);
        if (startTime === undefined) {
            console.warn(`[PerformanceMonitor] 操作 ${operation} 没有对应的开始时间`);
            return null;
        }

        const duration = performance.now() - startTime;
        this.operationStartTimes.delete(operation);

        this.recordMetric(operation, duration);
        return duration;
    }

    /**
     * 记录性能指标
     */
    private static recordMetric(operation: string, duration: number): void {
        const metric: PerformanceMetrics = {
            operation,
            duration,
            timestamp: Date.now()
        };

        if (!this.metrics.has(operation)) {
            this.metrics.set(operation, []);
        }

        const operationMetrics = this.metrics.get(operation)!;
        operationMetrics.push(metric);

        // 限制每个操作的最大指标数量
        if (operationMetrics.length > this.maxMetricsPerOperation) {
            operationMetrics.shift();
        }

        // 如果操作时间过长，发出警告
        if (duration > 100) {
            console.warn(`[PerformanceMonitor] 操作 ${operation} 耗时过长: ${duration.toFixed(2)}ms`);
        }
    }

    /**
     * 获取操作的平均执行时间
     */
    public static getAverageTime(operation: string): number {
        const operationMetrics = this.metrics.get(operation);
        if (!operationMetrics || operationMetrics.length === 0) {
            return 0;
        }

        const total = operationMetrics.reduce((sum, metric) => sum + metric.duration, 0);
        return total / operationMetrics.length;
    }

    /**
     * 获取操作的最后一次执行时间
     */
    public static getLastTime(operation: string): number {
        const operationMetrics = this.metrics.get(operation);
        if (!operationMetrics || operationMetrics.length === 0) {
            return 0;
        }

        return operationMetrics[operationMetrics.length - 1].duration;
    }

    /**
     * 获取操作的最大执行时间
     */
    public static getMaxTime(operation: string): number {
        const operationMetrics = this.metrics.get(operation);
        if (!operationMetrics || operationMetrics.length === 0) {
            return 0;
        }

        return Math.max(...operationMetrics.map(metric => metric.duration));
    }

    /**
     * 获取操作的最小执行时间
     */
    public static getMinTime(operation: string): number {
        const operationMetrics = this.metrics.get(operation);
        if (!operationMetrics || operationMetrics.length === 0) {
            return 0;
        }

        return Math.min(...operationMetrics.map(metric => metric.duration));
    }

    /**
     * 获取操作执行次数
     */
    public static getExecutionCount(operation: string): number {
        const operationMetrics = this.metrics.get(operation);
        return operationMetrics ? operationMetrics.length : 0;
    }

    /**
     * 获取所有操作的汇总统计
     */
    public static getOverallStats(): { [operation: string]: { avg: number; max: number; min: number; count: number } } {
        const stats: any = {};

        this.metrics.forEach((metrics, operation) => {
            stats[operation] = {
                avg: this.getAverageTime(operation),
                max: this.getMaxTime(operation),
                min: this.getMinTime(operation),
                count: this.getExecutionCount(operation)
            };
        });

        return stats;
    }

    /**
     * 清除指定操作的性能指标
     */
    public static clearMetrics(operation: string): void {
        this.metrics.delete(operation);
        this.operationStartTimes.delete(operation);
    }

    /**
     * 清除所有性能指标
     */
    public static clearAllMetrics(): void {
        this.metrics.clear();
        this.operationStartTimes.clear();
    }

    /**
     * 记录性能快照（用于调试）
     */
    public static logSnapshot(operation?: string): void {
        if (operation) {
            const stats = {
                avg: this.getAverageTime(operation),
                max: this.getMaxTime(operation),
                min: this.getMinTime(operation),
                count: this.getExecutionCount(operation)
            };
            console.log(`[PerformanceMonitor] ${operation} 统计:`, stats);
        } else {
            console.log('[PerformanceMonitor] 全局性能统计:', this.getOverallStats());
        }
    }
}