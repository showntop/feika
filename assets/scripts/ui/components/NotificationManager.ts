/**
 * 通知管理器
 * 提供用户反馈提示功能，包括成功、错误、警告、信息提示
 */

export enum NotificationType {
    SUCCESS = 'success',
    ERROR = 'error',
    WARNING = 'warning',
    INFO = 'info'
}

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    duration: number;
    timestamp: number;
    actions?: NotificationAction[];
}

export interface NotificationAction {
    label: string;
    action: () => void;
    primary?: boolean;
}

export class NotificationManager {
    private static instance: NotificationManager;
    private notifications: Map<string, Notification> = new Map();
    private maxNotifications: number = 5;
    private defaultDuration: number = 3000; // 3秒
    private notificationCounter: number = 0;

    private constructor() {}

    public static getInstance(): NotificationManager {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }

    /**
     * 显示成功通知
     */
    public success(message: string, duration?: number): string {
        return this.show({
            type: NotificationType.SUCCESS,
            message,
            duration: duration || this.defaultDuration
        });
    }

    /**
     * 显示错误通知
     */
    public error(message: string, duration?: number): string {
        return this.show({
            type: NotificationType.ERROR,
            message,
            duration: duration || 5000 // 错误显示时间更长
        });
    }

    /**
     * 显示警告通知
     */
    public warning(message: string, duration?: number): string {
        return this.show({
            type: NotificationType.WARNING,
            message,
            duration: duration || 4000
        });
    }

    /**
     * 显示信息通知
     */
    public info(message: string, duration?: number): string {
        return this.show({
            type: NotificationType.INFO,
            message,
            duration: duration || this.defaultDuration
        });
    }

    /**
     * 显示带操作按钮的通知
     */
    public actionable(
        message: string,
        type: NotificationType,
        actions: NotificationAction[],
        duration?: number
    ): string {
        return this.show({
            type,
            message,
            actions,
            duration: duration || 6000 // 可操作通知显示时间更长
        });
    }

    /**
     * 显示通知
     */
    private show(config: {
        type: NotificationType;
        message: string;
        actions?: NotificationAction[];
        duration: number;
    }): string {
        // 如果通知过多，移除最旧的
        if (this.notifications.size >= this.maxNotifications) {
            const oldestNotification = Array.from(this.notifications.values())[0];
            this.remove(oldestNotification.id);
        }

        const id = `notification_${++this.notificationCounter}_${Date.now()}`;
        const notification: Notification = {
            id,
            type: config.type,
            message: config.message,
            duration: config.duration,
            timestamp: Date.now(),
            actions: config.actions
        };

        this.notifications.set(id, notification);

        console.log(`[NotificationManager] ${config.type.toUpperCase()}: ${config.message}`);

        // 自动移除通知
        if (config.duration > 0) {
            setTimeout(() => {
                this.remove(id);
            }, config.duration);
        }

        // 触发UI更新事件
        this.notifyUIUpdate();

        return id;
    }

    /**
     * 移除通知
     */
    public remove(id: string): void {
        if (this.notifications.has(id)) {
            this.notifications.delete(id);
            this.notifyUIUpdate();
        }
    }

    /**
     * 清除所有通知
     */
    public clear(): void {
        this.notifications.clear();
        this.notifyUIUpdate();
    }

    /**
     * 获取所有活动通知
     */
    public getActiveNotifications(): Notification[] {
        return Array.from(this.notifications.values())
            .sort((a, b) => a.timestamp - b.timestamp);
    }

    /**
     * 通知UI更新
     */
    private notifyUIUpdate(): void {
        // 这里可以触发事件通知UI更新
        // 由于这是测试环境，我们先只记录日志
        console.log(`[NotificationManager] 活动通知数量: ${this.notifications.size}`);
    }

    /**
     * 设置最大通知数量
     */
    public setMaxNotifications(max: number): void {
        this.maxNotifications = Math.max(1, min(10, max));
    }

    /**
     * 设置默认显示时长
     */
    public setDefaultDuration(duration: number): void {
        this.defaultDuration = Math.max(1000, Math.min(10000, duration));
    }

    /**
     * 获取统计信息
     */
    public getStats(): {
        activeCount: number;
        maxNotifications: number;
        defaultDuration: number;
        totalCreated: number;
    } {
        return {
            activeCount: this.notifications.size,
            maxNotifications: this.maxNotifications,
            defaultDuration: this.defaultDuration,
            totalCreated: this.notificationCounter
        };
    }
}

// 辅助函数
function min(a: number, b: number): number {
    return a < b ? a : b;
}

export default NotificationManager;