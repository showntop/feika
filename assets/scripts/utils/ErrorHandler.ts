/**
 * 错误处理工具类
 * 统一错误处理和日志记录
 */

export interface ErrorContext {
    component: string;
    operation: string;
    data?: any;
}

export class ErrorHandler {
    private static errorCount: number = 0;
    private static maxErrors: number = 100;

    /**
     * 处理错误并记录日志
     */
    public static handleError(error: Error | string, context: ErrorContext): void {
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
    public static safeExecute(
        fn: () => void,
        context: ErrorContext,
        defaultValue?: any
    ): any {
        try {
            return fn();
        } catch (error) {
            this.handleError(error as Error, context);
            return defaultValue;
        }
    }

    /**
     * 安全执行异步函数
     */
    public static async safeExecuteAsync(
        fn: () => Promise<void>,
        context: ErrorContext
    ): Promise<void> {
        try {
            await fn();
        } catch (error) {
            this.handleError(error as Error, context);
        }
    }

    /**
     * 验证数据并抛出错误
     */
    public static validateData(data: any, validator: (data: any) => boolean, context: ErrorContext): void {
        if (!validator(data)) {
            throw new Error(`数据验证失败: ${context.operation}`);
        }
    }

    /**
     * 重置错误计数
     */
    public static resetErrorCount(): void {
        this.errorCount = 0;
    }

    /**
     * 获取错误统计
     */
    public static getErrorStats(): { count: number; maxErrors: number } {
        return {
            count: this.errorCount,
            maxErrors: this.maxErrors
        };
    }
}