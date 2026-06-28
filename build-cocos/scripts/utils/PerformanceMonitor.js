/**
 * 性能监控工具类
 * 用于追踪和记录关键操作的性能指标
 */
export class PerformanceMonitor {
    /**
     * 开始测量操作性能
     */
    static startMeasure(operation) {
        this.operationStartTimes.set(operation, performance.now());
    }
    /**
     * 结束测量操作性能
     */
    static endMeasure(operation) {
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
    static recordMetric(operation, duration) {
        const metric = {
            operation,
            duration,
            timestamp: Date.now()
        };
        if (!this.metrics.has(operation)) {
            this.metrics.set(operation, []);
        }
        const operationMetrics = this.metrics.get(operation);
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
    static getAverageTime(operation) {
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
    static getLastTime(operation) {
        const operationMetrics = this.metrics.get(operation);
        if (!operationMetrics || operationMetrics.length === 0) {
            return 0;
        }
        return operationMetrics[operationMetrics.length - 1].duration;
    }
    /**
     * 获取操作的最大执行时间
     */
    static getMaxTime(operation) {
        const operationMetrics = this.metrics.get(operation);
        if (!operationMetrics || operationMetrics.length === 0) {
            return 0;
        }
        return Math.max(...operationMetrics.map(metric => metric.duration));
    }
    /**
     * 获取操作的最小执行时间
     */
    static getMinTime(operation) {
        const operationMetrics = this.metrics.get(operation);
        if (!operationMetrics || operationMetrics.length === 0) {
            return 0;
        }
        return Math.min(...operationMetrics.map(metric => metric.duration));
    }
    /**
     * 获取操作执行次数
     */
    static getExecutionCount(operation) {
        const operationMetrics = this.metrics.get(operation);
        return operationMetrics ? operationMetrics.length : 0;
    }
    /**
     * 获取所有操作的汇总统计
     */
    static getOverallStats() {
        const stats = {};
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
    static clearMetrics(operation) {
        this.metrics.delete(operation);
        this.operationStartTimes.delete(operation);
    }
    /**
     * 清除所有性能指标
     */
    static clearAllMetrics() {
        this.metrics.clear();
        this.operationStartTimes.clear();
    }
    /**
     * 记录性能快照（用于调试）
     */
    static logSnapshot(operation) {
        if (operation) {
            const stats = {
                avg: this.getAverageTime(operation),
                max: this.getMaxTime(operation),
                min: this.getMinTime(operation),
                count: this.getExecutionCount(operation)
            };
            console.log(`[PerformanceMonitor] ${operation} 统计:`, stats);
        }
        else {
            console.log('[PerformanceMonitor] 全局性能统计:', this.getOverallStats());
        }
    }
}
PerformanceMonitor.metrics = new Map();
PerformanceMonitor.operationStartTimes = new Map();
PerformanceMonitor.maxMetricsPerOperation = 100;
//# sourceMappingURL=PerformanceMonitor.js.map