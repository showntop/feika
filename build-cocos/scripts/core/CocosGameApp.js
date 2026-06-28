/**
 * Cocos Creator 游戏主入口组件
 * 负责游戏初始化和启动，集成Cocos Creator生命周期
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CocosGameApp_1;
import { Component, _decorator } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property, menu } = _decorator;
/**
 * Cocos Creator 游戏应用组件
 */
let CocosGameApp = CocosGameApp_1 = class CocosGameApp extends Component {
    constructor() {
        super(...arguments);
        this.isInitialized = false;
    }
    /**
     * 获取单例实例
     */
    static getInstance() {
        return CocosGameApp_1.instance;
    }
    /**
     * Cocos Creator生命周期：节点加载时调用
     */
    onLoad() {
        console.log('[GameApp] onLoad - Cocos Creator组件加载');
        CocosGameApp_1.instance = this;
        this.gameManager = GameManager.getInstance();
    }
    /**
     * Cocos Creator生命周期：节点首次激活时调用
     */
    async start() {
        console.log('[GameApp] start - 开始游戏初始化');
        try {
            // 初始化游戏
            await this.init();
            // 启动游戏
            this.startGame();
            console.log('[GameApp] 游戏启动成功');
        }
        catch (error) {
            console.error('[GameApp] 游戏启动失败:', error);
        }
    }
    /**
     * Cocos Creator生命周期：每帧更新
     */
    update(deltaTime) {
        // 如果需要每帧更新逻辑，在这里添加
        // 目前游戏逻辑采用事件驱动，不需要每帧更新
    }
    /**
     * Cocos Creator生命周期：组件销毁时调用
     */
    onDestroy() {
        console.log('[GameApp] onDestroy - 清理游戏资源');
        // 清理资源
        this.cleanup();
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
    startGame() {
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
    /**
     * 清理游戏资源
     */
    cleanup() {
        console.log('[GameApp] 清理游戏资源');
        // 清理事件监听
        // 清理游戏管理器
        // 释放资源
    }
};
CocosGameApp = CocosGameApp_1 = __decorate([
    ccclass('GameApp'),
    menu('Game/Core/GameApp')
], CocosGameApp);
export { CocosGameApp };
/**
 * 全局游戏实例访问器（兼容原有代码）
 */
export const gameApp = {
    getInstance: () => {
        return CocosGameApp.getInstance();
    },
    init: async () => {
        const instance = CocosGameApp.getInstance();
        if (instance && !instance.isReady()) {
            await instance['init']();
        }
    },
    start: () => {
        const instance = CocosGameApp.getInstance();
        if (instance && instance.isReady()) {
            instance['startGame']();
        }
    }
};
//# sourceMappingURL=CocosGameApp.js.map