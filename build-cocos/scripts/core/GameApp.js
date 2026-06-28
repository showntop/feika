/**
 * 游戏主入口
 * 负责游戏初始化和启动
 */
import { GameManager } from './GameManager';
/**
 * 游戏应用类
 */
export class GameApp {
    constructor() {
        this.isInitialized = false;
        this.gameManager = GameManager.getInstance();
    }
    /**
     * 获取单例实例
     */
    static getInstance() {
        if (!GameApp.instance) {
            GameApp.instance = new GameApp();
        }
        return GameApp.instance;
    }
    /**
     * 初始化游戏
     */
    async init() {
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
        }
        catch (error) {
            console.error('[GameApp] 游戏初始化失败:', error);
            throw error;
        }
    }
    /**
     * 启动游戏
     */
    start() {
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
    getGameManager() {
        return this.gameManager;
    }
    /**
     * 检查是否已初始化
     */
    isReady() {
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
export async function startGame() {
    try {
        // 初始化游戏
        await gameApp.init();
        // 启动游戏
        gameApp.start();
        console.log('[GameApp] 游戏启动成功');
    }
    catch (error) {
        console.error('[GameApp] 游戏启动失败:', error);
    }
}
// 如果是Node.js环境，导出游戏实例
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameApp, gameApp, startGame };
}
export default GameApp;
//# sourceMappingURL=GameApp.js.map