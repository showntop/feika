/**
 * 错误处理工具类
 * 统一错误处理和日志记录
 */
export class ErrorHandler {
    /**
     * 处理错误并记录日志
     */
    static handleError(error, context) {
        const errorMessage = typeof error === 'string' ? error : error.message;
        const errorStack = typeof error === 'string' ? null : error.stack;
        console.error(`[${context.component}] ${context.operation} 失败:`, errorMessage);
        if (errorStack) {
            console.error('堆栈跟踪:', errorStack);
        }
        this.errorCount++;
        // 如果错误过多，发出警告
        if (this.errorCount > this.maxErrors) {
            console.warn(`[ErrorHandler] 错误数量过多 (${this.errorCount})，可能存在系统问题`);
        }
    }
    /**
     * 安全执行函数，自动捕获错误
     */
    static safeExecute(fn, context, defaultValue) {
        try {
            return fn();
        }
        catch (error) {
            this.handleError(error, context);
            return defaultValue;
        }
    }
    /**
     * 安全执行异步函数
     */
    static async safeExecuteAsync(fn, context) {
        try {
            await fn();
        }
        catch (error) {
            this.handleError(error, context);
        }
    }
    /**
     * 验证数据并抛出错误
     */
    static validateData(data, validator, context) {
        if (!validator(data)) {
            throw new Error(`数据验证失败: ${context.operation}`);
        }
    }
    /**
     * 重置错误计数
     */
    static resetErrorCount() {
        this.errorCount = 0;
    }
    /**
     * 获取错误统计
     */
    static getErrorStats() {
        return {
            count: this.errorCount,
            maxErrors: this.maxErrors
        };
    }
}
ErrorHandler.errorCount = 0;
ErrorHandler.maxErrors = 100;
//# sourceMappingURL=ErrorHandler.js.map