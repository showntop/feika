/**
 * UI管理器
 * 负责UI系统的初始化、更新和事件管理
 */

import { EventManager, GameEvents } from '../core/EventManager';
import { GameManager } from '../core/GameManager';
import { ResourcePanel } from './components/ResourcePanel';
import { GameBoard } from './components/GameBoard';
import { StoryDialog } from './components/StoryDialog';
import { OrderPanel } from './components/OrderPanel';
import { ErrorHandler } from '../utils/ErrorHandler';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';

/**
 * UI事件类型
 */
export enum UIEventType {
    RESOURCE_UPDATE = 'ui_resource_update',
    ITEM_CLICK = 'ui_item_click',
    ITEM_MERGE = 'ui_item_merge',
    GENERATOR_CLICK = 'ui_generator_click',
    ORDER_COMPLETE = 'ui_order_complete',
    DIALOG_NEXT = 'ui_dialog_next',
    DIALOG_SKIP = 'ui_dialog_skip',
    PANEL_TOGGLE = 'ui_panel_toggle'
}

/**
 * UI管理器类
 */
export class UIManager {
    private static instance: UIManager;

    // 核心组件
    private resourcePanel!: ResourcePanel;
    private gameBoard!: GameBoard;
    private storyDialog!: StoryDialog;
    private orderPanel!: OrderPanel;

    // 状态管理
    private isInitialized: boolean = false;
    private currentDialog: string | null = null;
    private activePanels: Set<string> = new Set();

    // 性能优化
    private updatePending: boolean = false;
    private lastUpdateTime: number = 0;
    private updateInterval: number = 100; // UI更新间隔（毫秒）

    // 事件监听器管理（防止内存泄漏）
    private eventListeners: Array<{ event: string; handler: any }> = [];

    private constructor() {
        this.initializeComponents();
    }

    /**
     * 获取单例实例
     */
    public static getInstance(): UIManager {
        if (!UIManager.instance) {
            UIManager.instance = new UIManager();
        }
        return UIManager.instance;
    }

    /**
     * 初始化UI组件
     */
    private initializeComponents(): void {
        console.log('[UIManager] 初始化UI组件...');

        // 创建核心UI组件
        this.resourcePanel = new ResourcePanel();
        this.gameBoard = new GameBoard();
        this.storyDialog = new StoryDialog();
        this.orderPanel = new OrderPanel();

        console.log('[UIManager] UI组件初始化完成');
    }

    /**
     * 初始化UI系统
     */
    public async init(): Promise<void> {
        if (this.isInitialized) {
            console.log('[UIManager] UI系统已初始化');
            return;
        }

        console.log('[UIManager] 开始初始化UI系统...');

        // 初始化各组件
        await this.resourcePanel.init();
        await this.gameBoard.init();
        await this.storyDialog.init();
        await this.orderPanel.init();

        // 设置事件监听
        this.setupEventListeners();

        this.isInitialized = true;
        console.log('[UIManager] UI系统初始化完成');
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        const eventManager = EventManager.getInstance();

        // 定义事件监听器配置（便于管理和清理）
        const listenerConfigs = [
            // 游戏事件
            { event: GameEvents.CASH_CHANGED, handler: () => this.requestUpdate() },
            { event: GameEvents.REPUTATION_CHANGED, handler: () => this.requestUpdate() },
            { event: GameEvents.CONNECTIONS_CHANGED, handler: () => this.requestUpdate() },
            { event: GameEvents.ENERGY_CHANGED, handler: () => this.requestUpdate() },
            { event: GameEvents.MERGE_SUCCESS, handler: () => this.handleMergeSuccess() },
            { event: GameEvents.GENERATE_ITEM, handler: () => this.handleItemGenerated() },
            { event: GameEvents.ORDER_COMPLETE, handler: () => this.handleOrderComplete() },
            { event: GameEvents.STORY_EVENT_TRIGGER, handler: () => this.handleStoryEvent() },
            { event: GameEvents.NEW_ORDER, handler: () => this.handleNewOrder() },

            // UI内部事件
            { event: UIEventType.ITEM_CLICK, handler: (data: any) => this.handleItemClick(data) },
            { event: UIEventType.ITEM_MERGE, handler: (data: any) => this.handleItemMerge(data) },
            { event: UIEventType.GENERATOR_CLICK, handler: (data: any) => this.handleGeneratorClick(data) },
            { event: UIEventType.DIALOG_NEXT, handler: () => this.handleDialogNext() },
            { event: UIEventType.DIALOG_SKIP, handler: () => this.handleDialogSkip() }
        ];

        // 存储监听器引用以便清理
        this.eventListeners = listenerConfigs;

        // 注册所有监听器
        listenerConfigs.forEach(({ event, handler }) => {
            eventManager.on(event, handler);
        });

        console.log(`[UIManager] 已注册 ${listenerConfigs.length} 个事件监听器`);
    }

    /**
     * 请求UI更新
     */
    private requestUpdate(): void {
        if (!this.updatePending) {
            this.updatePending = true;
            setTimeout(() => this.update(), this.updateInterval);
        }
    }

    /**
     * 更新UI系统
     */
    private update(): void {
        const now = performance.now();
        const deltaTime = now - this.lastUpdateTime;

        if (deltaTime >= this.updateInterval) {
            // 更新各组件
            this.resourcePanel.update();
            this.gameBoard.update();
            this.orderPanel.update();

            this.lastUpdateTime = now;
            this.updatePending = false;
        }
    }

    /**
     * 处理合成成功事件
     */
    private handleMergeSuccess(): void {
        console.log('[UIManager] 处理合成成功事件');
        this.gameBoard.playMergeAnimation();
        this.requestUpdate();
    }

    /**
     * 处理物品生成事件
     */
    private handleItemGenerated(): void {
        console.log('[UIManager] 处理物品生成事件');
        this.gameBoard.playGenerateAnimation();
        this.requestUpdate();
    }

    /**
     * 处理订单完成事件
     */
    private handleOrderComplete(): void {
        console.log('[UIManager] 处理订单完成事件');
        this.orderPanel.playCompleteAnimation();
        this.requestUpdate();
    }

    /**
     * 处理剧情事件触发
     */
    private handleStoryEvent(): void {
        console.log('[UIManager] 处理剧情事件触发');
        const gameManager = GameManager.getInstance();
        const storySystem = gameManager.getStorySystem();
        const activeEvent = storySystem.getActiveEvent();

        if (activeEvent) {
            this.showStoryDialog(activeEvent.getId());
        }
    }

    /**
     * 处理新订单事件
     */
    private handleNewOrder(): void {
        console.log('[UIManager] 处理新订单事件');
        this.orderPanel.showNotification();
    }

    /**
     * 处理物品点击事件
     */
    private handleItemClick(data: any): void {
        ErrorHandler.safeExecute(() => {
            console.log('[UIManager] 处理物品点击事件:', data);

            // 数据验证
            if (!data || !data.position) {
                throw new Error('无效的物品位置数据');
            }

            PerformanceMonitor.startMeasure('item_click');
            this.gameBoard.selectItem(data.position);
            PerformanceMonitor.endMeasure('item_click');
        }, {
            component: 'UIManager',
            operation: 'handleItemClick',
            data
        });
    }

    /**
     * 处理物品合成事件
     */
    private handleItemMerge(data: any): void {
        ErrorHandler.safeExecute(() => {
            console.log('[UIManager] 处理物品合成事件:', data);

            // 数据验证
            if (!data || !data.fromPos || !data.toPos) {
                throw new Error('无效的合成位置数据');
            }

            PerformanceMonitor.startMeasure('item_merge');
            const gameManager = GameManager.getInstance();
            const mergeSystem = gameManager.getMergeSystem();

            const result = mergeSystem.mergeItems(data.fromPos, data.toPos);
            if (result.success) {
                console.log('[UIManager] 合成成功');
            } else {
                console.log('[UIManager] 合成失败:', result.message);
                this.gameBoard.showError(result.message || '合成失败');
            }
            PerformanceMonitor.endMeasure('item_merge');
        }, {
            component: 'UIManager',
            operation: 'handleItemMerge',
            data
        });
    }

    /**
     * 处理生成器点击事件
     */
    private handleGeneratorClick(data: any): void {
        ErrorHandler.safeExecute(() => {
            console.log('[UIManager] 处理生成器点击事件:', data);

            // 数据验证
            if (!data || !data.generatorId) {
                throw new Error('无效的生成器ID');
            }

            PerformanceMonitor.startMeasure('generator_click');
            const gameManager = GameManager.getInstance();
            const mergeSystem = gameManager.getMergeSystem();

            const newItem = mergeSystem.generateFrom(data.generatorId);
            if (newItem) {
                console.log('[UIManager] 物品生成成功');
            } else {
                console.log('[UIManager] 物品生成失败');
                this.gameBoard.showError('生成失败，请检查体力');
            }
            PerformanceMonitor.endMeasure('generator_click');
        }, {
            component: 'UIManager',
            operation: 'handleGeneratorClick',
            data
        });
    }

    /**
     * 处理对话框继续事件
     */
    private handleDialogNext(): void {
        console.log('[UIManager] 处理对话框继续');
        const gameManager = GameManager.getInstance();
        const storySystem = gameManager.getStorySystem();

        const hasNext = this.storyDialog.nextDialogue();
        if (!hasNext) {
            // 对话结束，完成当前事件
            gameManager.completeCurrentStoryEvent();
            this.hideStoryDialog();
        }
    }

    /**
     * 处理对话框跳过事件
     */
    private handleDialogSkip(): void {
        console.log('[UIManager] 处理对话框跳过');
        const gameManager = GameManager.getInstance();
        const storySystem = gameManager.getStorySystem();

        // 直接完成当前事件
        gameManager.completeCurrentStoryEvent();
        this.hideStoryDialog();
    }

    /**
     * 显示剧情对话框
     */
    public showStoryDialog(eventId: string): void {
        console.log('[UIManager] 显示剧情对话框:', eventId);
        const gameManager = GameManager.getInstance();
        const storySystem = gameManager.getStorySystem();
        const activeEvent = storySystem.getActiveEvent();

        if (activeEvent) {
            this.storyDialog.showDialog(activeEvent);
            this.currentDialog = eventId;
        }
    }

    /**
     * 隐藏剧情对话框
     */
    public hideStoryDialog(): void {
        console.log('[UIManager] 隐藏剧情对话框');
        this.storyDialog.hide();
        this.currentDialog = null;
    }

    /**
     * 切换面板显示
     */
    public togglePanel(panelId: string): void {
        console.log('[UIManager] 切换面板:', panelId);

        if (this.activePanels.has(panelId)) {
            this.hidePanel(panelId);
        } else {
            this.showPanel(panelId);
        }
    }

    /**
     * 显示面板
     */
    public showPanel(panelId: string): void {
        console.log('[UIManager] 显示面板:', panelId);
        this.activePanels.add(panelId);

        switch (panelId) {
            case 'orders':
                this.orderPanel.show();
                break;
            // 可以添加其他面板
        }
    }

    /**
     * 隐藏面板
     */
    public hidePanel(panelId: string): void {
        console.log('[UIManager] 隐藏面板:', panelId);
        this.activePanels.delete(panelId);

        switch (panelId) {
            case 'orders':
                this.orderPanel.hide();
                break;
            // 可以添加其他面板
        }
    }

    /**
     * 获取UI系统状态
     */
    public getSystemState(): any {
        return {
            isInitialized: this.isInitialized,
            currentDialog: this.currentDialog,
            activePanels: Array.from(this.activePanels),
            components: {
                resourcePanel: this.resourcePanel?.getState(),
                gameBoard: this.gameBoard?.getState(),
                storyDialog: this.storyDialog?.getState(),
                orderPanel: this.orderPanel?.getState()
            }
        };
    }

    /**
     * 销毁UI系统
     */
    public destroy(): void {
        console.log('[UIManager] 销毁UI系统');

        // 清理所有事件监听器（防止内存泄漏）
        this.cleanupEventListeners();

        // 销毁各组件
        ErrorHandler.safeExecute(() => {
            this.resourcePanel?.destroy();
        }, { component: 'UIManager', operation: 'destroy_resource_panel' });

        ErrorHandler.safeExecute(() => {
            this.gameBoard?.destroy();
        }, { component: 'UIManager', operation: 'destroy_game_board' });

        ErrorHandler.safeExecute(() => {
            this.storyDialog?.destroy();
        }, { component: 'UIManager', operation: 'destroy_story_dialog' });

        ErrorHandler.safeExecute(() => {
            this.orderPanel?.destroy();
        }, { component: 'UIManager', operation: 'destroy_order_panel' });

        // 清理状态
        this.activePanels.clear();
        this.currentDialog = null;
        this.isInitialized = false;

        console.log('[UIManager] UI系统销毁完成');
    }

    /**
     * 清理事件监听器
     */
    private cleanupEventListeners(): void {
        const eventManager = EventManager.getInstance();

        // 注销所有事件监听器
        this.eventListeners.forEach(({ event, handler }) => {
            ErrorHandler.safeExecute(() => {
                eventManager.off(event, handler);
            }, {
                component: 'UIManager',
                operation: `cleanup_listener_${event}`
            });
        });

        // 清空监听器数组
        this.eventListeners = [];
        console.log('[UIManager] 已清理所有事件监听器');
    }
}

export default UIManager;