/**
 * 事件管理器
 * 负责游戏内所有事件的注册、触发和管理
 */
/**
 * EventManager 类
 * 单例模式，全局事件管理
 */
export class EventManager {
    constructor() {
        // 事件存储
        this.events = new Map();
        this.onceEvents = new Map();
        this.listenerTracker = new Map(); // 监听器注册追踪
    }
    /**
     * 获取单例实例
     */
    static getInstance() {
        if (!EventManager.instance) {
            EventManager.instance = new EventManager();
        }
        return EventManager.instance;
    }
    /**
     * 初始化事件管理器
     */
    init() {
        this.events.clear();
        this.onceEvents.clear();
        this.listenerTracker.clear();
        console.log('[EventManager] 初始化完成');
    }
    /**
     * 检查是否超过监听器限制
     */
    checkListenerLimit(eventName) {
        const currentCount = this.listenerTracker.get(eventName) || 0;
        if (currentCount >= EventManager.MAX_LISTENERS) {
            console.warn(`[EventManager] 事件 ${eventName} 监听器数量超过限制 (${EventManager.MAX_LISTENERS})，可能存在内存泄漏`);
        }
        const totalListeners = Array.from(this.listenerTracker.values()).reduce((sum, count) => sum + count, 0);
        if (totalListeners >= EventManager.MAX_TOTAL_EVENTS) {
            console.warn(`[EventManager] 总监听器数量超过限制 (${EventManager.MAX_TOTAL_EVENTS})，可能存在内存泄漏`);
        }
    }
    /**
     * 更新监听器追踪
     */
    updateListenerTracking(eventName, delta) {
        const currentCount = this.listenerTracker.get(eventName) || 0;
        this.listenerTracker.set(eventName, Math.max(0, currentCount + delta));
    }
    /**
     * 注册事件监听器
     * @param eventName 事件名称
     * @param callback 回调函数
     * @param once 是否只触发一次
     */
    on(eventName, callback, once = false) {
        this.checkListenerLimit(eventName);
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        this.events.get(eventName).push(callback);
        this.updateListenerTracking(eventName, 1);
        if (once) {
            if (!this.onceEvents.has(eventName)) {
                this.onceEvents.set(eventName, new Set());
            }
            this.onceEvents.get(eventName).add(callback);
        }
    }
    /**
     * 移除事件监听器
     * @param eventName 事件名称
     * @param callback 回调函数
     */
    off(eventName, callback) {
        const listeners = this.events.get(eventName);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
                this.updateListenerTracking(eventName, -1);
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
    emit(eventName, ...args) {
        const listeners = this.events.get(eventName);
        if (listeners) {
            // 复制数组避免在回调中修改导致的问题
            const listenersCopy = [...listeners];
            for (const callback of listenersCopy) {
                try {
                    callback(...args);
                }
                catch (error) {
                    console.error(`[EventManager] 事件 ${eventName} 回调执行错误:`, error);
                    // 移除出错的事件监听器，防止连续错误
                    this.off(eventName, callback);
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
    once(eventName, callback) {
        this.on(eventName, callback, true);
    }
    /**
     * 移除所有事件监听器
     * @param eventName 事件名称（可选，不传则移除所有事件）
     */
    removeAll(eventName) {
        if (eventName) {
            const count = this.listenerTracker.get(eventName) || 0;
            this.listenerTracker.set(eventName, 0);
            this.events.delete(eventName);
            this.onceEvents.delete(eventName);
        }
        else {
            this.events.clear();
            this.onceEvents.clear();
            this.listenerTracker.clear();
        }
    }
    /**
     * 获取事件监听器数量
     * @param eventName 事件名称
     */
    getListenerCount(eventName) {
        const listeners = this.events.get(eventName);
        return listeners ? listeners.length : 0;
    }
    /**
     * 检查事件是否有监听器
     * @param eventName 事件名称
     */
    hasListeners(eventName) {
        return this.getListenerCount(eventName) > 0;
    }
    /**
     * 获取系统状态
     */
    getSystemStatus() {
        const totalListeners = Array.from(this.listenerTracker.values()).reduce((sum, count) => sum + count, 0);
        const eventDetails = Array.from(this.events.entries()).map(([name, listeners]) => ({
            name,
            count: listeners.length,
            onceCount: this.onceEvents.get(name)?.size || 0
        }));
        return {
            totalEvents: this.events.size,
            totalListeners,
            maxListenersPerEvent: EventManager.MAX_LISTENERS,
            maxTotalEvents: EventManager.MAX_TOTAL_EVENTS,
            eventDetails
        };
    }
    /**
     * 清理无效监听器
     */
    cleanupInvalidListeners() {
        let cleaned = 0;
        for (const [eventName, listeners] of this.events.entries()) {
            const initialCount = listeners.length;
            // 移除已失效的监听器
            for (let i = listeners.length - 1; i >= 0; i--) {
                try {
                    // 测试监听器是否有效
                    const test = listeners[i].toString();
                    if (!test || test === 'function () { [native code] }') {
                        listeners.splice(i, 1);
                        cleaned++;
                    }
                }
                catch (error) {
                    listeners.splice(i, 1);
                    cleaned++;
                }
            }
            // 更新追踪计数
            const removed = initialCount - listeners.length;
            if (removed > 0) {
                this.updateListenerTracking(eventName, -removed);
            }
        }
        if (cleaned > 0) {
            console.log(`[EventManager] 清理了 ${cleaned} 个无效监听器`);
        }
    }
}
// 内存保护机制
EventManager.MAX_LISTENERS = 100; // 单个事件最大监听器数量
EventManager.MAX_TOTAL_EVENTS = 1000; // 总事件数量限制
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
//# sourceMappingURL=EventManager.js.map