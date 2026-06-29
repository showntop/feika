/**
 * 简化版游戏控制器 - 快速原型
 * 避免复杂的UI绑定，直接演示核心游戏逻辑
 */

import { _decorator, Component, Label, Node } from 'cc';
import { GameManager } from '../core/GameManager';
import { EventManager } from '../core/EventManager';

const { ccclass, property } = _decorator;

/**
 * 简化版游戏控制器
 */
@ccclass('SimpleGameController')
export class SimpleGameController extends Component {
    @property(Label)
    private titleLabel: Label = null;

    private gameManager: GameManager = GameManager.getInstance();
    private eventManager: EventManager = EventManager.getInstance();
    private clickCount: number = 0;

    /**
     * Cocos Creator生命周期：节点加载时调用
     */
    public onLoad(): void {
        console.log('[SimpleGame] 简化版游戏控制器加载');
    }

    /**
     * Cocos Creator生命周期：节点首次激活时调用
     */
    public start(): void {
        console.log('[SimpleGame] 开始游戏');
        this.setupBasicUI();
        this.initializeGameLogic();
    }

    /**
     * 设置基础UI
     */
    private setupBasicUI(): void {
        if (this.titleLabel) {
            this.titleLabel.string = '🍎 重返2010：水果小店 (快速原型版)';
        }
        console.log('[SimpleGame] 基础UI设置完成');
    }

    /**
     * 初始化游戏逻辑
     */
    private initializeGameLogic(): void {
        console.log('[SimpleGame] 游戏逻辑初始化');
        console.log('[SimpleGame] GameManager实例:', this.gameManager ? '✓' : '✗');
        console.log('[SimpleGame] EventManager实例:', this.eventManager ? '✓' : '✗');

        // 测试事件系统
        this.eventManager.on('game:click', this.handleGameClick, this);
        console.log('[SimpleGame] 事件监听设置完成');
    }

    /**
     * 处理游戏点击
     */
    private handleGameClick(data: any): void {
        this.clickCount++;
        console.log(`[SimpleGame] 游戏点击 #${this.clickCount}:`, data);

        // 简单的游戏逻辑演示
        if (this.clickCount % 5 === 0) {
            console.log('[SimpleGame] 🎉 完成一个小目标！');
        }
    }

    /**
     * 测试方法：手动调用此方法来模拟游戏点击
     */
    public testGameClick(): void {
        this.eventManager.emit('game:click', { source: 'manual_test' });
    }

    /**
     * Cocos Creator生命周期：每帧更新
     */
    public update(deltaTime: number): void {
        // 可以添加实时更新逻辑
        if (this.clickCount > 0 && this.clickCount % 10 === 0) {
            console.log(`[SimpleGame] 游戏运行中，已点击 ${this.clickCount} 次`);
        }
    }

    /**
     * Cocos Creator生命周期：节点销毁时调用
     */
    public onDestroy(): void {
        console.log('[SimpleGame] 简化版游戏控制器销毁');
        this.eventManager.off('game:click', this.handleGameClick, this);
    }
}