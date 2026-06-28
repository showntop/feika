/**
 * Cocos Creator 游戏主入口组件
 * 负责游戏初始化和启动，集成Cocos Creator生命周期
 */

import { Component, _decorator } from 'cc';
import { GameManager } from './GameManager';

const { ccclass, property, menu } = _decorator;

/**
 * Cocos Creator 游戏应用组件
 */
@ccclass('GameApp')
@menu('Game/Core/GameApp')
export class CocosGameApp extends Component {
    private static instance: CocosGameApp;
    private gameManager: GameManager;
    private isInitialized: boolean = false;

    /**
     * 获取单例实例
     */
    public static getInstance(): CocosGameApp {
        return CocosGameApp.instance;
    }

    /**
     * Cocos Creator生命周期：节点加载时调用
     */
    public onLoad(): void {
        console.log('[GameApp] onLoad - Cocos Creator组件加载');
        CocosGameApp.instance = this;
        this.gameManager = GameManager.getInstance();
    }

    /**
     * Cocos Creator生命周期：节点首次激活时调用
     */
    public async start(): Promise<void> {
        console.log('[GameApp] start - 开始游戏初始化');

        try {
            // 初始化游戏
            await this.init();

            // 启动游戏
            this.startGame();

            console.log('[GameApp] 游戏启动成功');
        } catch (error) {
            console.error('[GameApp] 游戏启动失败:', error);
        }
    }

    /**
     * Cocos Creator生命周期：每帧更新
     */
    public update(deltaTime: number): void {
        // 如果需要每帧更新逻辑，在这里添加
        // 目前游戏逻辑采用事件驱动，不需要每帧更新
    }

    /**
     * Cocos Creator生命周期：组件销毁时调用
     */
    public onDestroy(): void {
        console.log('[GameApp] onDestroy - 清理游戏资源');
        // 清理资源
        this.cleanup();
    }

    /**
     * 初始化游戏
     */
    private async init(): Promise<void> {
        if (this.isInitialized) {
            console.warn('[GameApp] 游戏已初始化');
            return;
        }

        try {
            console.log('[GameApp] 开始初始化游戏...');

            // 初始化游戏管理器
            await this.gameManager.init();

            this.isInitialized = true;
            console.log('[GameApp] 游戏初始化完成');

        } catch (error) {
            console.error('[GameApp] 游戏初始化失败:', error);
            throw error;
        }
    }

    /**
     * 启动游戏
     */
    private startGame(): void {
        if (!this.isInitialized) {
            console.error('[GameApp] 游戏未初始化，请先调用 init()');
            return;
        }

        console.log('[GameApp] 启动游戏');
        this.gameManager.startGame();
    }

    /**
     * 获取游戏管理器
     */
    public getGameManager(): GameManager {
        return this.gameManager;
    }

    /**
     * 检查是否已初始化
     */
    public isReady(): boolean {
        return this.isInitialized;
    }

    /**
     * 清理游戏资源
     */
    private cleanup(): void {
        console.log('[GameApp] 清理游戏资源');
        // 清理事件监听
        // 清理游戏管理器
        // 释放资源
    }
}

/**
 * 全局游戏实例访问器（兼容原有代码）
 */
export const gameApp = {
    getInstance: (): CocosGameApp => {
        return CocosGameApp.getInstance();
    },
    init: async (): Promise<void> => {
        const instance = CocosGameApp.getInstance();
        if (instance && !instance.isReady()) {
            await instance['init']();
        }
    },
    start: (): void => {
        const instance = CocosGameApp.getInstance();
        if (instance && instance.isReady()) {
            instance['startGame']();
        }
    }
};