/**
 * 主游戏场景控制器
 * 负责游戏UI和核心系统集成的快速原型实现
 */

import { _decorator, Component, Label, Node, Button, Prefab, instantiate, Vec3, UITransform } from 'cc';
import { GameManager } from '../core/GameManager';
import { EventManager } from '../core/EventManager';
import { MergeSystem } from './merge/MergeSystem';
import { BusinessSystem } from './business/BusinessSystem';

const { ccclass, property } = _decorator;

/**
 * 游戏状态枚举
 */
enum GameState {
    IDLE = 'idle',
    PLAYING = 'playing',
    PAUSED = 'paused'
}

/**
 * 主游戏场景控制器
 */
@ccclass('MainGameSceneController')
export class MainGameSceneController extends Component {
    // UI组件引用
    @property(Label)
    private titleLabel: Label = null;

    @property(Label)
    private coinsLabel: Label = null;

    @property(Label)
    private scoreLabel: Label = null;

    @property(Label)
    private orderDescriptionLabel: Label = null;

    @property(Node)
    private mergeGridContainer: Node = null;

    @property(Button)
    private completeOrderButton: Button = null;

    // 游戏系统引用
    private gameManager: GameManager = GameManager.getInstance();
    private eventManager: EventManager = EventManager.getInstance();
    private mergeSystem: MergeSystem;
    private businessSystem: BusinessSystem;

    // 游戏状态
    private gameState: GameState = GameState.IDLE;
    private coins: number = 100;
    private score: number = 0;
    private currentOrder: any = null;

    /**
     * Cocos Creator生命周期：节点加载时调用
     */
    public onLoad(): void {
        console.log('[MainGameScene] 主游戏场景加载');
        this.initializeGameSystems();
    }

    /**
     * Cocos Creator生命周期：节点首次激活时调用
     */
    public start(): void {
        console.log('[MainGameScene] 开始游戏');
        this.setupUI();
        this.startGame();
    }

    /**
     * 初始化游戏系统
     */
    private initializeGameSystems(): void {
        // 获取单例系统实例
        this.mergeSystem = MergeSystem.getInstance();
        this.businessSystem = BusinessSystem.getInstance();

        console.log('[MainGameScene] 游戏系统初始化完成');
    }

    /**
     * 设置UI
     */
    private setupUI(): void {
        // 设置初始UI文本
        if (this.titleLabel) {
            this.titleLabel.string = '🍎 重返2010：水果小店';
        }

        this.updateCoinsDisplay();
        this.updateScoreDisplay();

        // 创建合成网格
        this.createMergeGrid();

        // 绑定按钮事件
        if (this.completeOrderButton) {
            this.completeOrderButton.node.on(Button.EventType.CLICK, this.onCompleteOrderClicked, this);
        }

        console.log('[MainGameScene] UI设置完成');
    }

    /**
     * 创建合成网格（2x2快速原型）
     */
    private createMergeGrid(): void {
        if (!this.mergeGridContainer) {
            console.warn('[MainGameScene] 合成网格容器未设置');
            return;
        }

        // 清空现有子节点
        this.mergeGridContainer.removeAllChildren();

        // 创建2x2网格
        const gridSize = 2;
        const cellSize = 100;
        const spacing = 10;

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const cell = this.createMergeCell(row, col, cellSize);
                const x = col * (cellSize + spacing) - (gridSize * cellSize) / 2;
                const y = row * (cellSize + spacing) - (gridSize * cellSize) / 2;
                cell.setPosition(x, y, 0);
                this.mergeGridContainer.addChild(cell);
            }
        }

        console.log('[MainGameScene] 创建了2x2合成网格');
    }

    /**
     * 创建合成单元格
     */
    private createMergeCell(row: number, col: number, size: number): Node {
        const cell = new Node(`Cell_${row}_${col}`);

        // 添加UITransform组件
        const transform = cell.addComponent(UITransform);
        transform.setContentSize(size, size);

        // 创建背景节点
        const background = new Node('Background');
        const bgTransform = background.addComponent(UITransform);
        bgTransform.setContentSize(size, size);
        background.addComponent('cc.Sprite', {
            _color: { r: 255, g: 255, b: 255, a: 200 }
        });
        cell.addChild(background);

        // 创建物品标签
        const itemLabel = new Node('ItemLabel');
        const labelTransform = itemLabel.addComponent(UITransform);
        labelTransform.setContentSize(size, size);
        const label = itemLabel.addComponent(Label);
        label.string = this.getInitialItemForCell(row, col);
        label.fontSize = 40;
        label.lineHeight = 40;
        itemLabel.setPosition(0, 0, 0);
        cell.addChild(itemLabel);

        // 添加点击事件
        cell.addComponent('cc.Button', {
            _clickEvents: [{
                __type__: 'cc.ClickEvent',
                target: this.node,
                component: 'MainGameSceneController',
                handler: 'onCellClicked',
                customEventData: `${row}_${col}`
            }]
        });

        return cell;
    }

    /**
     * 获取初始物品（快速原型简化版本）
     */
    private getInitialItemForCell(row: number, col: number): string {
        const items = ['🍎', '🍑', '🍇'];
        // 简单的初始化逻辑
        if (row === 0 && col === 0) return '🍎';
        if (row === 0 && col === 1) return '🍑';
        if (row === 1 && col === 0) return '🍇';
        return '🍎';
    }

    /**
     * 单元格点击事件处理
     */
    private onCellClicked(event: any, customEventData: string): void {
        console.log(`[MainGameScene] 单元格被点击: ${customEventData}`);

        // 简单的点击反馈动画
        const clickedNode = event.target;
        this.animateClick(clickedNode);

        // 快速原型的简单合成逻辑
        this.handleMergeLogic(customEventData);
    }

    /**
     * 点击反馈动画
     */
    private animateClick(node: Node): void {
        const scale = node.getScale();
        const originalScale = scale.clone();

        // 简单的缩放动画
        node.setScale(scale.x * 1.2, scale.y * 1.2, scale.z);

        this.scheduleOnce(() => {
            node.setScale(originalScale);
        }, 0.1);
    }

    /**
     * 处理合成逻辑（快速原型简化版本）
     */
    private handleMergeLogic(cellData: string): void {
        console.log('[MainGameScene] 处理合成逻辑');

        // 简单的合成规则
        // 相同物品点击2次升级
        const items = ['🍎', '🍑', '🍇'];
        const upgradedItems = ['🍎→🍒', '🍑→🥝', '🍇→🍉'];

        // 这里只是演示，实际的合成逻辑会调用MergeSystem
        console.log('[MainGameScene] 合成逻辑：快速原型演示');
    }

    /**
     * 开始游戏
     */
    private startGame(): void {
        this.gameState = GameState.PLAYING;
        this.generateNewOrder();
        console.log('[MainGameScene] 游戏开始');
    }

    /**
     * 生成新订单
     */
    private generateNewOrder(): void {
        // 简单的订单生成逻辑（快速原型）
        const orders = [
            { id: 1, description: '需要：🍎x2', reward: 50 },
            { id: 2, description: '需要：🍑x3', reward: 75 },
            { id: 3, description: '需要：🍇x2 🍎x1', reward: 100 }
        ];

        const randomIndex = Math.floor(Math.random() * orders.length);
        this.currentOrder = orders[randomIndex];

        if (this.orderDescriptionLabel) {
            this.orderDescriptionLabel.string = `订单：${this.currentOrder.description}\n奖励：${this.currentOrder.reward}金币`;
        }

        console.log(`[MainGameScene] 生成新订单: ${this.currentOrder.description}`);
    }

    /**
     * 完成订单按钮点击事件
     */
    private onCompleteOrderClicked(): void {
        if (!this.currentOrder) {
            console.warn('[MainGameScene] 没有当前订单');
            return;
        }

        console.log(`[MainGameScene] 完成订单: ${this.currentOrder.description}`);

        // 增加金币
        this.coins += this.currentOrder.reward;
        this.updateCoinsDisplay();

        // 增加分数
        this.score += 10;
        this.updateScoreDisplay();

        // 生成新订单
        this.generateNewOrder();
    }

    /**
     * 更新金币显示
     */
    private updateCoinsDisplay(): void {
        if (this.coinsLabel) {
            this.coinsLabel.string = `💰 ${this.coins}`;
        }
    }

    /**
     * 更新分数显示
     */
    private updateScoreDisplay(): void {
        if (this.scoreLabel) {
            this.scoreLabel.string = `⭐ ${this.score}`;
        }
    }

    /**
     * Cocos Creator生命周期：每帧更新
     */
    public update(deltaTime: number): void {
        // 可以在这里添加实时更新逻辑
    }

    /**
     * Cocos Creator生命周期：节点销毁时调用
     */
    public onDestroy(): void {
        console.log('[MainGameScene] 主游戏场景销毁');
    }
}