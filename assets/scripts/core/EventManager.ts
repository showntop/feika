/**
 * 事件管理器
 * 负责游戏内所有事件的注册、触发和管理
 */

// 事件监听器类型
type EventListener = (...args: any[]) => void;

// 事件数据结构
interface EventData {
    eventName: string;
    callback: EventListener;
    once: boolean;
}

/**
 * EventManager 类
 * 单例模式，全局事件管理
 */
export class EventManager {
    private static instance: EventManager;

    // 事件存储
    private events: Map<string, EventListener[]> = new Map();
    private onceEvents: Map<string, Set<EventListener>> = new Map();

    private constructor() {}

    /**
     * 获取单例实例
     */
    public static getInstance(): EventManager {
        if (!EventManager.instance) {
            EventManager.instance = new EventManager();
        }
        return EventManager.instance;
    }

    /**
     * 初始化事件管理器
     */
    public init(): void {
        this.events.clear();
        this.onceEvents.clear();
        console.log('[EventManager] 初始化完成');
    }

    /**
     * 注册事件监听器
     * @param eventName 事件名称
     * @param callback 回调函数
     * @param once 是否只触发一次
     */
    public on(eventName: string, callback: EventListener, once: boolean = false): void {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }

        this.events.get(eventName)!.push(callback);

        if (once) {
            if (!this.onceEvents.has(eventName)) {
                this.onceEvents.set(eventName, new Set());
            }
            this.onceEvents.get(eventName)!.add(callback);
        }
    }

    /**
     * 移除事件监听器
     * @param eventName 事件名称
     * @param callback 回调函数
     */
    public off(eventName: string, callback: EventListener): void {
        const listeners = this.events.get(eventName);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }

            // 同时移除一次性事件标记
            const onceListeners = this.onceEvents.get(eventName);
            if (onceListeners) {
                onceListeners.delete(callback);
            }
        }
    }

    /**
     * 触发事件
     * @param eventName 事件名称
     * @param args 事件参数
     */
    public emit(eventName: string, ...args: any[]): void {
        const listeners = this.events.get(eventName);
        if (listeners) {
            // 复制数组避免在回调中修改导致的问题
            const listenersCopy = [...listeners];

            for (const callback of listenersCopy) {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`[EventManager] 事件 ${eventName} 回调执行错误:`, error);
                }
            }

            // 移除一次性事件监听器
            const onceListeners = this.onceEvents.get(eventName);
            if (onceListeners && onceListeners.size > 0) {
                for (const callback of onceListeners) {
                    this.off(eventName, callback);
                }
                onceListeners.clear();
            }
        }
    }

    /**
     * 注册一次性事件监听器
     * @param eventName 事件名称
     * @param callback 回调函数
     */
    public once(eventName: string, callback: EventListener): void {
        this.on(eventName, callback, true);
    }

    /**
     * 移除所有事件监听器
     * @param eventName 事件名称（可选，不传则移除所有事件）
     */
    public removeAll(eventName?: string): void {
        if (eventName) {
            this.events.delete(eventName);
            this.onceEvents.delete(eventName);
        } else {
            this.events.clear();
            this.onceEvents.clear();
        }
    }

    /**
     * 获取事件监听器数量
     * @param eventName 事件名称
     */
    public getListenerCount(eventName: string): number {
        const listeners = this.events.get(eventName);
        return listeners ? listeners.length : 0;
    }

    /**
     * 检查事件是否有监听器
     * @param eventName 事件名称
     */
    public hasListeners(eventName: string): boolean {
        return this.getListenerCount(eventName) > 0;
    }
}

// 导出事件名称常量
export const GameEvents = {
    // 游戏核心事件
    GAME_START: 'game_start',
    GAME_PAUSE: 'game_pause',
    GAME_RESUME: 'game_resume',
    GAME_OVER: 'game_over',

    // 合成系统事件
    MERGE_SUCCESS: 'merge_success',
    MERGE_FAIL: 'merge_fail',
    GENERATE_ITEM: 'generate_item',
    ITEM_CONSUMED: 'item_consumed',

    // 经营系统事件
    NEW_ORDER: 'new_order',
    ORDER_COMPLETE: 'order_complete',
    ORDER_EXPIRED: 'order_expired',
    SHOP_UPGRADE: 'shop_upgrade',

    // 剧情系统事件
    CHAPTER_START: 'chapter_start',
    CHAPTER_COMPLETE: 'chapter_complete',
    STORY_EVENT_TRIGGER: 'story_event_trigger',
    STORY_EVENT_COMPLETE: 'story_event_complete',

    // 资源事件
    CASH_CHANGED: 'cash_changed',
    REPUTATION_CHANGED: 'reputation_changed',
    CONNECTIONS_CHANGED: 'connections_changed',
    ENERGY_CHANGED: 'energy_changed',

    // 玩家事件
    LEVEL_UP: 'level_up',
    ACHIEVEMENT_UNLOCK: 'achievement_unlock',

    // 商业化事件
    AD_LOAD_SUCCESS: 'ad_load_success',
    AD_LOAD_FAIL: 'ad_load_fail',
    AD_SHOW_SUCCESS: 'ad_show_success',
    AD_COMPLETE: 'ad_complete',
    AD_SKIP: 'ad_skip',

    // UI事件
    UI_OPEN: 'ui_open',
    UI_CLOSE: 'ui_close',
    BUTTON_CLICK: 'button_click'
};

export default EventManager;