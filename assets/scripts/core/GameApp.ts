/**
 * 游戏主入口
 * 负责游戏初始化和启动
 */

import { GameManager } from './GameManager';

/**
 * 游戏应用类
 */
export class GameApp {
    private static instance: GameApp;
    private gameManager: GameManager;
    private isInitialized: boolean = false;

    private constructor() {
        this.gameManager = GameManager.getInstance();
    }

    /**
     * 获取单例实例
     */
    public static getInstance(): GameApp {
        if (!GameApp.instance) {
            GameApp.instance = new GameApp();
        }
        return GameApp.instance;
    }

    /**
     * 初始化游戏
     */
    public async init(): Promise<void> {
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
    public start(): void {
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
}

/**
 * 全局游戏实例
 */
export const gameApp = GameApp.getInstance();

/**
 * 游戏启动函数
 */
export async function startGame(): Promise<void> {
    try {
        // 初始化游戏
        await gameApp.init();

        // 启动游戏
        gameApp.start();

        console.log('[GameApp] 游戏启动成功');
    } catch (error) {
        console.error('[GameApp] 游戏启动失败:', error);
    }
}

// 如果是Node.js环境，导出游戏实例
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameApp, gameApp, startGame };
}

export default GameApp;