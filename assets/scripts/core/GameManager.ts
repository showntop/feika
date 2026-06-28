/**
 * 游戏管理器
 * 协调所有游戏系统，管理游戏状态和流程
 */

// 声明浏览器API类型
declare global {
    var requestAnimationFrame: (callback: (time: number) => void) => number;
    var cancelAnimationFrame: (id: number) => void;
}

import { EventManager, GameEvents } from './EventManager';
import { MergeSystem } from '../gameplay/merge/MergeSystem';
import { BusinessSystem } from '../gameplay/business/BusinessSystem';
import { StorySystem, EventRequirement, EventReward } from '../gameplay/story/StorySystem';
import { StorageManager } from './StorageManager';

/**
 * 游戏状态
 */
export enum GameState {
    LOADING = 'loading',
    MENU = 'menu',
    PLAYING = 'playing',
    PAUSED = 'paused',
    CHAPTER_COMPLETE = 'chapter_complete',
    GAME_OVER = 'game_over'
}

/**
 * 玩家数据
 */
export interface PlayerData {
    // 基础资源
    cash: number;
    reputation: number;
    connections: number;
    energy: number;

    // 游戏进度
    currentChapterId: string;
    completedChapters: string[];
    shopLevel: number;

    // 时间戳
    lastLoginTime: number;
    totalPlayTime: number;

    // 统计数据
    totalMerges: number;
    totalOrders: number;
    totalCashEarned: number;

    // 广告数据
    dailyAdCount: number;
    lastAdResetTime: number;
}

/**
 * 游戏管理器类
 */
export class GameManager {
    private static instance: GameManager;

    // 核心系统
    private eventManager: EventManager;
    private mergeSystem: MergeSystem;
    private businessSystem: BusinessSystem;
    private storySystem: StorySystem;
    private storageManager: StorageManager;

    // 游戏状态
    private gameState: GameState = GameState.LOADING;
    private playerData: PlayerData;
    private isPaused: boolean = false;

    // 时间管理
    private lastUpdateTime: number = Date.now();
    private deltaTime: number = 0;

    private constructor() {
        this.eventManager = EventManager.getInstance();
        this.mergeSystem = MergeSystem.getInstance();
        this.businessSystem = BusinessSystem.getInstance();
        this.storySystem = StorySystem.getInstance();
        this.storageManager = StorageManager.getInstance();

        this.playerData = this.createDefaultPlayerData();
    }

    /**
     * 获取单例实例
     */
    public static getInstance(): GameManager {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }

    /**
     * 初始化游戏
     */
    public async init(): Promise<void> {
        console.log('[GameManager] 开始初始化...');

        // 设置游戏状态
        this.setGameState(GameState.LOADING);

        // 初始化事件系统
        this.eventManager.init();

        // 初始化存储管理器
        this.storageManager.init();

        // 初始化各游戏系统
        this.mergeSystem.init();
        this.businessSystem.init();
        this.storySystem.init();

        // 加载配置数据
        await this.loadConfigurations();

        // 加载玩家数据
        await this.loadPlayerData();

        // 设置事件监听
        this.setupEventListeners();

        // 同步数据到各系统
        this.syncDataToSystems();

        console.log('[GameManager] 初始化完成');

        // 设置游戏状态
        this.setGameState(GameState.MENU);
    }

    /**
     * 开始游戏
     */
    public startGame(): void {
        console.log('[GameManager] 开始游戏');

        // 设置游戏状态
        this.setGameState(GameState.PLAYING);

        // 加载第一章
        this.storySystem.loadChapter('chapter_1', (req) => this.checkRequirement(req));

        // 开始游戏循环
        this.startGameLoop();

        // 触发游戏开始事件
        EventManager.getInstance().emit(GameEvents.GAME_START, {
            chapterId: this.playerData.currentChapterId
        });
    }

    /**
     * 暂停游戏
     */
    public pauseGame(): void {
        if (this.gameState !== GameState.PLAYING) {
            return;
        }

        this.isPaused = true;
        this.setGameState(GameState.PAUSED);

        EventManager.getInstance().emit(GameEvents.GAME_PAUSE, {});
    }

    /**
     * 恢复游戏
     */
    public resumeGame(): void {
        if (this.gameState !== GameState.PAUSED) {
            return;
        }

        this.isPaused = false;
        this.setGameState(GameState.PLAYING);
        this.lastUpdateTime = Date.now();

        EventManager.getInstance().emit(GameEvents.GAME_RESUME, {});
    }

    /**
     * 游戏主循环（优化版）
     */
    private gameLoopRAF: any = null;
    private targetFPS: number = 60;
    private frameInterval: number = 1000 / this.targetFPS;
    private lastFrameTime: number = 0;

    private gameLoop(): void {
        if (this.isPaused || this.gameState !== GameState.PLAYING) {
            return;
        }

        const now = performance.now();
        const elapsed = now - this.lastFrameTime;

        // 帧率控制，避免过度频繁更新
        if (elapsed >= this.frameInterval) {
            // 限制最大帧间隔，防止切出页面后突然的大跳跃
            const deltaTime = Math.min(elapsed, 100) / 1000; // 最大100ms，转换为秒
            this.lastFrameTime = now - (elapsed % this.frameInterval);

            // 更新各系统
            this.update(deltaTime);
        }

        // 使用requestAnimationFrame实现更高效的循环
        if (typeof requestAnimationFrame !== 'undefined') {
            this.gameLoopRAF = requestAnimationFrame(() => this.gameLoop());
        }
    }

    /**
     * 开始游戏循环
     */
    private startGameLoop(): void {
        this.lastFrameTime = performance.now();
        if (typeof requestAnimationFrame !== 'undefined') {
            this.gameLoopRAF = requestAnimationFrame(() => this.gameLoop());
        }
    }

    /**
     * 停止游戏循环
     */
    private stopGameLoop(): void {
        if (this.gameLoopRAF && typeof cancelAnimationFrame !== 'undefined') {
            cancelAnimationFrame(this.gameLoopRAF);
            this.gameLoopRAF = null;
        }
    }

    /**
     * 更新游戏逻辑（优化版）
     */
    private lastOrderRefresh: number = 0;
    private orderRefreshInterval: number = 1000; // 订单刷新间隔（毫秒）

    private update(dt: number): void {
        const now = performance.now();

        // 优化：订单刷新不必每帧都检查
        if (now - this.lastOrderRefresh >= this.orderRefreshInterval) {
            this.businessSystem.refreshOrders();
            this.lastOrderRefresh = now;
        }

        // 检查剧情事件
        this.storySystem.checkAndTriggerEvents((req) => this.checkRequirement(req));

        // 检查章节目标完成
        if (this.storySystem.checkChapterGoal((type, value) => this.checkGameGoal(type, value))) {
            this.handleChapterComplete();
        }

        // 更新游戏时间
        this.playerData.totalPlayTime += Math.floor(dt * 1000);
    }

    /**
     * 设置游戏状态
     */
    private setGameState(state: GameState): void {
        const oldState = this.gameState;
        this.gameState = state;

        console.log(`[GameManager] 游戏状态: ${oldState} -> ${state}`);
    }

    /**
     * 加载配置文件
     */
    private async loadConfigurations(): Promise<void> {
        try {
            console.log('[GameManager] 加载配置文件...');

            // 加载物品配置
            const itemsConfig = await this.loadJson('../config/items.json');
            if (itemsConfig && itemsConfig.items) {
                this.mergeSystem.loadItemConfigs(itemsConfig.items);
                console.log(`[GameManager] 已加载 ${itemsConfig.items.length} 个物品配置`);
            }

            // 加载生成器配置
            if (itemsConfig && itemsConfig.generators) {
                this.mergeSystem.loadGeneratorConfigs(itemsConfig.generators);
                console.log(`[GameManager] 已加载 ${itemsConfig.generators.length} 个生成器配置`);
            }

            // 加载章节配置
            const chaptersConfig = await this.loadJson('../config/chapters.json');
            if (chaptersConfig && chaptersConfig.chapters) {
                this.storySystem.loadChapterConfigs(chaptersConfig.chapters);
                console.log(`[GameManager] 已加载 ${chaptersConfig.chapters.length} 个章节配置`);
            }

            // 加载订单配置
            const ordersConfig = await this.loadJson('../config/orders_chapter1.json');
            if (ordersConfig) {
                this.businessSystem.loadOrderConfigs(ordersConfig);
                console.log(`[GameManager] 已加载订单配置`);
            }

            console.log('[GameManager] 配置文件加载完成');
        } catch (error) {
            console.error('[GameManager] 配置文件加载失败:', error);
            throw error;
        }
    }

    /**
     * 加载JSON文件
     */
    private async loadJson(filePath: string): Promise<any> {
        try {
            const fs = require('fs');
            const path = require('path');
            // 使用process.cwd()获取项目根目录，然后加载assets/config
            const configPath = path.resolve(process.cwd(), 'assets/config', filePath.replace('../config/', ''));
            const fileContent = fs.readFileSync(configPath, 'utf-8');
            return JSON.parse(fileContent);
        } catch (error) {
            console.error(`[GameManager] 加载JSON文件失败: ${filePath}`, error);
            return null;
        }
    }

    /**
     * 加载玩家数据
     */
    private async loadPlayerData(): Promise<void> {
        try {
            // 尝试从自动保存槽位加载
            const savedData = await this.storageManager.loadFromSlot('slot_0');

            if (savedData && savedData.playerData) {
                // 验证数据完整性
                this.playerData = savedData.playerData;
                console.log('[GameManager] 从存档加载玩家数据成功');
            } else {
                // 使用默认数据
                this.playerData = this.createDefaultPlayerData();
                console.log('[GameManager] 使用默认玩家数据');
            }

            console.log('[GameManager] 玩家数据加载完成');
        } catch (error) {
            console.error('[GameManager] 玩家数据加载失败:', error);
            this.playerData = this.createDefaultPlayerData();
        }
    }

    /**
     * 创建默认玩家数据
     */
    private createDefaultPlayerData(): PlayerData {
        return {
            cash: 100,
            reputation: 0,
            connections: 0,
            energy: 40,
            currentChapterId: 'chapter_1',
            completedChapters: [],
            shopLevel: 1,
            lastLoginTime: Date.now(),
            totalPlayTime: 0,
            totalMerges: 0,
            totalOrders: 0,
            totalCashEarned: 0,
            dailyAdCount: 0,
            lastAdResetTime: Date.now()
        };
    }

    /**
     * 同步数据到各系统
     */
    private syncDataToSystems(): void {
        // 同步到经营系统
        this.businessSystem.setCash(this.playerData.cash);
        this.businessSystem.setReputation(this.playerData.reputation);
        this.businessSystem.setConnections(this.playerData.connections);
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        // 监听现金变化
        this.eventManager.on(GameEvents.CASH_CHANGED, (data) => {
            this.playerData.cash = data.current;
            this.savePlayerData();
        });

        // 监听口碑变化
        this.eventManager.on(GameEvents.REPUTATION_CHANGED, (data) => {
            this.playerData.reputation = data.current;
            this.savePlayerData();
        });

        // 监听人脉变化
        this.eventManager.on(GameEvents.CONNECTIONS_CHANGED, (data) => {
            this.playerData.connections = data.current;
            this.savePlayerData();
        });

        // 监听章节完成
        this.eventManager.on(GameEvents.CHAPTER_COMPLETE, (data) => {
            if (data.chapter) {
                this.playerData.completedChapters.push(data.chapter.id);
                this.savePlayerData();
            }
        });

        // 监听合成成功
        this.eventManager.on(GameEvents.MERGE_SUCCESS, () => {
            this.playerData.totalMerges++;
        });

        // 监听订单完成
        this.eventManager.on(GameEvents.ORDER_COMPLETE, (data) => {
            this.playerData.totalOrders++;
            this.playerData.totalCashEarned += data.reward.cash;
        });
    }

    /**
     * 检查需求条件
     */
    private checkRequirement(requirement: EventRequirement): boolean {
        const { type, value, operator = '>=' } = requirement;

        let playerValue: any;

        switch (type) {
            case 'cash':
                playerValue = this.businessSystem.getCash();
                break;
            case 'reputation':
                playerValue = this.businessSystem.getReputation();
                break;
            case 'connections':
                playerValue = this.businessSystem.getConnections();
                break;
            case 'item':
                return this.checkItemRequirement(value);
            case 'chapter_complete':
                return this.playerData.completedChapters.includes(value as string);
            case 'event_complete':
                return this.storySystem.isEventCompleted(value as string);
            default:
                return true;
        }

        return this.compareValues(playerValue, value, operator);
    }


    /**
     * 比较数值
     */
    private compareValues(actual: any, expected: any, operator: string): boolean {
        switch (operator) {
            case '>=':
                return actual >= expected;
            case '<=':
                return actual <= expected;
            case '>':
                return actual > expected;
            case '<':
                return actual < expected;
            case '==':
                return actual === expected;
            default:
                return false;
        }
    }

    /**
     * 检查游戏目标
     */
    private checkGameGoal(type: string, value: any): boolean {
        switch (type) {
            case 'cash':
                return this.businessSystem.getCash() >= value;
            case 'shop_upgrade':
                return this.businessSystem.getShopLevel() >= value;
            case 'complete_events':
                return this.storySystem.getCompletedEvents().length >= value;
            default:
                return false;
        }
    }

    /**
     * 检查剧情物品需求
     */
    private checkItemRequirement(value: any): boolean {
        const itemId = value?.itemId;
        const level = value?.level || 1;
        const count = value?.count || 1;

        if (!itemId) {
            return false;
        }

        const matchingItems = this.mergeSystem.getAllItems().filter(item =>
            item.getId() === itemId &&
            item.getLevel() === level
        );

        return matchingItems.length >= count;
    }

    /**
     * 消耗剧情物品需求
     */
    private consumeItemRequirement(value: any): boolean {
        const itemId = value?.itemId;
        const level = value?.level || 1;
        const count = value?.count || 1;

        if (!itemId) {
            return false;
        }

        return this.mergeSystem.consumeItem(itemId, level, count);
    }

    /**
     * 完成当前剧情事件，消耗物品需求并发放奖励
     */
    public completeCurrentStoryEvent(): boolean {
        const activeEvent = this.storySystem.getActiveEvent();
        if (!activeEvent) {
            return false;
        }

        const itemRequirements = activeEvent
            .getRequirements()
            .filter(req => req.type === 'item');

        if (!itemRequirements.every(req => this.checkItemRequirement(req.value))) {
            return false;
        }

        // 调用completeCurrentEvent时传入consumeItemCallback
        return this.storySystem.completeCurrentEvent(
            (reward) => this.applyStoryReward(reward),
            (itemId: string, level: number, count: number) => this.mergeSystem.consumeItem(itemId, level, count)
        );
    }

    /**
     * 发放剧情奖励
     */
    private applyStoryReward(reward: EventReward): void {
        if (reward.cash) {
            this.businessSystem.addCash(reward.cash);
        }
        if (reward.reputation) {
            this.businessSystem.addReputation(reward.reputation);
        }
        if (reward.connections) {
            this.businessSystem.addConnections(reward.connections);
        }
        if (reward.unlockGenerator) {
            this.mergeSystem.unlockGenerator(reward.unlockGenerator);
        }
        // unlockChapter / items 先作为后续系统接入点保留。
    }

    /**
     * 处理章节完成
     */
    private handleChapterComplete(): void {
        console.log('[GameManager] 章节目标完成');

        // 设置游戏状态
        this.setGameState(GameState.CHAPTER_COMPLETE);

        // 保存进度
        this.savePlayerData();

        // TODO: 显示章节完成界面，提供下一章入口
    }

    /**
     * 保存玩家数据
     */
    private async savePlayerData(): Promise<void> {
        try {
            // 使用自动保存功能
            const success = await this.storageManager.autoSave(this.playerData, this.gameState);

            if (success) {
                console.log('[GameManager] 玩家数据已自动保存');
            } else {
                console.error('[GameManager] 自动保存失败');
            }
        } catch (error) {
            console.error('[GameManager] 保存玩家数据失败:', error);
        }
    }

    /**
     * 手动保存游戏
     */
    public async saveGame(slotId?: string, slotName?: string): Promise<boolean> {
        try {
            const targetSlot = slotId || 'slot_0';
            const targetName = slotName || `手动保存 ${new Date().toLocaleString()}`;

            const success = await this.storageManager.saveToSlot(
                targetSlot,
                targetName,
                this.playerData,
                this.gameState
            );

            if (success) {
                console.log(`[GameManager] 游戏已保存到槽位 ${targetSlot}`);
                return true;
            } else {
                console.error(`[GameManager] 保存到槽位 ${targetSlot} 失败`);
                return false;
            }
        } catch (error) {
            console.error('[GameManager] 手动保存失败:', error);
            return false;
        }
    }

    /**
     * 手动加载游戏
     */
    public async loadGame(slotId: string): Promise<boolean> {
        try {
            console.log(`[GameManager] 从槽位 ${slotId} 加载游戏`);

            const savedData = await this.storageManager.loadFromSlot(slotId);

            if (savedData && savedData.playerData) {
                // 验证并加载玩家数据
                this.playerData = savedData.playerData;

                // 同步数据到各系统
                this.syncDataToSystems();

                // 恢复游戏状态
                if (savedData.gameState) {
                    this.setGameState(savedData.gameState as GameState);
                }

                console.log(`[GameManager] 从槽位 ${slotId} 加载游戏成功`);
                return true;
            } else {
                console.error(`[GameManager] 槽位 ${slotId} 数据无效`);
                return false;
            }
        } catch (error) {
            console.error(`[GameManager] 从槽位 ${slotId} 加载游戏失败:`, error);
            return false;
        }
    }

    /**
     * 获取所有存档槽位
     */
    public getAllSaveSlots(): any[] {
        return this.storageManager.getAllSlots();
    }

    /**
     * 删除存档
     */
    public async deleteSave(slotId: string): Promise<boolean> {
        return await this.storageManager.deleteSlot(slotId);
    }

    /**
     * 导出存档
     */
    public exportSave(slotId: string): string | null {
        return this.storageManager.exportSave(slotId);
    }

    /**
     * 导入存档
     */
    public importSave(slotId: string, importData: string): boolean {
        return this.storageManager.importSave(slotId, importData);
    }

    /**
     * 获取游戏状态
     */
    public getGameState(): GameState {
        return this.gameState;
    }

    /**
     * 获取玩家数据
     */
    public getPlayerData(): PlayerData {
        return { ...this.playerData };
    }

    /**
     * 获取各系统实例
     */
    public getMergeSystem(): MergeSystem {
        return this.mergeSystem;
    }

    public getBusinessSystem(): BusinessSystem {
        return this.businessSystem;
    }

    public getStorySystem(): StorySystem {
        return this.storySystem;
    }

    public getStorageManager(): StorageManager {
        return this.storageManager;
    }

    /**
     * 获取游戏状态汇总
     */
    public getGameStatus(): any {
        return {
            state: this.gameState,
            player: this.playerData,
            merge: this.mergeSystem.getSystemState(),
            business: this.businessSystem.getSystemState(),
            story: this.storySystem.getSystemState()
        };
    }
}

export default GameManager;
