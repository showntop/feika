/**
 * 资源面板组件
 * 显示和管理游戏核心资源（现金、口碑、人脉、体力）
 */

import { BaseComponent, ComponentState } from './BaseComponent';
import { GameManager } from '../../core/GameManager';
import { EventManager, GameEvents } from '../../core/EventManager';

/**
 * 资源数据接口
 */
export interface ResourceData {
    cash: number;
    reputation: number;
    connections: number;
    energy: number;
    maxEnergy: number;
    energyRegenRate: number;
    lastEnergyUpdate: number;
}

/**
 * 资源面板组件类
 */
export class ResourcePanel extends BaseComponent {
    private gameManager: GameManager;
    private resourceData: ResourceData;

    // 动画元素
    private cashAnimation: HTMLElement | null = null;
    private reputationAnimation: HTMLElement | null = null;
    private connectionsAnimation: HTMLElement | null = null;
    private energyAnimation: HTMLElement | null = null;

    constructor() {
        super();
        this.gameManager = GameManager.getInstance();
        this.resourceData = this.createDefaultResourceData();
    }

    /**
     * 创建默认资源数据
     */
    private createDefaultResourceData(): ResourceData {
        return {
            cash: 100,
            reputation: 0,
            connections: 0,
            energy: 40,
            maxEnergy: 60,
            energyRegenRate: 20,
            lastEnergyUpdate: Date.now()
        };
    }

    /**
     * 创建DOM元素
     */
    protected createElement(): void {
        this.element = document.createElement('div');
        this.element.className = 'resource-panel';
        this.element.id = 'resourcePanel';
        this.element.innerHTML = `
            <div class="resource-container">
                <div class="resource-item" id="cashResource">
                    <div class="resource-icon cash-icon">💰</div>
                    <div class="resource-info">
                        <div class="resource-label">现金</div>
                        <div class="resource-value" id="cashValue">100</div>
                    </div>
                    <div class="resource-change" id="cashChange"></div>
                </div>

                <div class="resource-item" id="reputationResource">
                    <div class="resource-icon reputation-icon">⭐</div>
                    <div class="resource-info">
                        <div class="resource-label">口碑</div>
                        <div class="resource-value" id="reputationValue">0</div>
                    </div>
                    <div class="resource-change" id="reputationChange"></div>
                </div>

                <div class="resource-item" id="connectionsResource">
                    <div class="resource-icon connections-icon">🤝</div>
                    <div class="resource-info">
                        <div class="resource-label">人脉</div>
                        <div class="resource-value" id="connectionsValue">0</div>
                    </div>
                    <div class="resource-change" id="connectionsChange"></div>
                </div>

                <div class="resource-item" id="energyResource">
                    <div class="resource-icon energy-icon">⚡</div>
                    <div class="resource-info">
                        <div class="resource-label">体力</div>
                        <div class="resource-value" id="energyValue">40/60</div>
                    </div>
                    <div class="resource-change" id="energyChange"></div>
                </div>
            </div>
        `;

        // 添加样式
        this.addStyles();
    }

    /**
     * 添加样式
     */
    private addStyles(): void {
        if (!document.getElementById('resourcePanelStyles')) {
            const style = document.createElement('style');
            style.id = 'resourcePanelStyles';
            style.textContent = `
                .resource-panel {
                    position: fixed;
                    top: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(135deg, rgba(255, 248, 220, 0.95), rgba(255, 240, 200, 0.95));
                    border-radius: 12px;
                    padding: 8px 16px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    z-index: 1000;
                    font-family: 'Arial', sans-serif;
                    min-width: 400px;
                }

                .resource-container {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                }

                .resource-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 12px;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.8);
                    transition: transform 0.2s ease;
                    position: relative;
                }

                .resource-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }

                .resource-icon {
                    font-size: 24px;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .resource-info {
                    display: flex;
                    flex-direction: column;
                }

                .resource-label {
                    font-size: 11px;
                    color: #666;
                    font-weight: 500;
                }

                .resource-value {
                    font-size: 16px;
                    font-weight: bold;
                    color: #333;
                }

                .resource-change {
                    position: absolute;
                    top: -8px;
                    right: -4px;
                    font-size: 12px;
                    font-weight: bold;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    pointer-events: none;
                }

                .resource-change.positive {
                    color: #4CAF50;
                }

                .resource-change.negative {
                    color: #F44336;
                }

                .resource-change.show {
                    opacity: 1;
                    animation: floatUp 1s ease-out forwards;
                }

                @keyframes floatUp {
                    0% {
                        transform: translateY(0);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-20px);
                        opacity: 0;
                    }
                }

                /* 响应式设计 */
                @media (max-width: 600px) {
                    .resource-panel {
                        min-width: 320px;
                        padding: 6px 12px;
                    }

                    .resource-container {
                        gap: 8px;
                    }

                    .resource-item {
                        padding: 4px 8px;
                        gap: 6px;
                    }

                    .resource-icon {
                        font-size: 20px;
                        width: 24px;
                        height: 24px;
                    }

                    .resource-label {
                        font-size: 10px;
                    }

                    .resource-value {
                        font-size: 14px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * 绑定事件监听器
     */
    protected bindEvents(): void {
        // 监听资源变化事件
        const eventManager = EventManager.getInstance();

        eventManager.on(GameEvents.CASH_CHANGED, (data) => {
            this.handleCashChange(data.current, data.previous);
        });

        eventManager.on(GameEvents.REPUTATION_CHANGED, (data) => {
            this.handleReputationChange(data.current, data.previous);
        });

        eventManager.on(GameEvents.CONNECTIONS_CHANGED, (data) => {
            this.handleConnectionsChange(data.current, data.previous);
        });

        eventManager.on(GameEvents.ENERGY_CHANGED, (data) => {
            this.handleEnergyChange(data.current, data.max);
        });
    }

    /**
     * 处理现金变化
     */
    private handleCashChange(current: number, previous: number): void {
        const change = current - previous;
        this.resourceData.cash = current;
        this.showResourceChange('cash', change);
        this.updateDisplay();
    }

    /**
     * 处理口碑变化
     */
    private handleReputationChange(current: number, previous: number): void {
        const change = current - previous;
        this.resourceData.reputation = current;
        this.showResourceChange('reputation', change);
        this.updateDisplay();
    }

    /**
     * 处理人脉变化
     */
    private handleConnectionsChange(current: number, previous: number): void {
        const change = current - previous;
        this.resourceData.connections = current;
        this.showResourceChange('connections', change);
        this.updateDisplay();
    }

    /**
     * 处理体力变化
     */
    private handleEnergyChange(current: number, max: number): void {
        this.resourceData.energy = current;
        this.resourceData.maxEnergy = max;
        this.updateDisplay();
    }

    /**
     * 显示资源变化动画
     */
    private showResourceChange(resourceType: string, change: number): void {
        const changeElement = document.getElementById(`${resourceType}Change`);
        if (changeElement && Math.abs(change) > 0) {
            const isPositive = change > 0;
            const changeText = isPositive ? `+${change}` : `${change}`;

            changeElement.textContent = changeText;
            changeElement.className = `resource-change ${isPositive ? 'positive' : 'negative'} show`;

            // 移除动画类
            setTimeout(() => {
                changeElement.classList.remove('show');
            }, 1000);
        }
    }

    /**
     * 更新显示
     */
    private updateDisplay(): void {
        const cashElement = document.getElementById('cashValue');
        const reputationElement = document.getElementById('reputationValue');
        const connectionsElement = document.getElementById('connectionsValue');
        const energyElement = document.getElementById('energyValue');

        if (cashElement) {
            const targetValue = this.resourceData.cash;
            this.animationManager.countUp(cashElement, targetValue, 500);
            cashElement.textContent = this.formatNumber(this.resourceData.cash);
        }
        if (reputationElement) {
            const targetValue = this.resourceData.reputation;
            this.animationManager.countUp(reputationElement, targetValue, 300);
            reputationElement.textContent = this.formatNumber(this.resourceData.reputation);
        }
        if (connectionsElement) {
            const targetValue = this.resourceData.connections;
            this.animationManager.countUp(connectionsElement, targetValue, 300);
            connectionsElement.textContent = this.formatNumber(this.resourceData.connections);
        }
        if (energyElement) {
            energyElement.textContent = `${this.resourceData.energy}/${this.resourceData.maxEnergy}`;
        }
    }

    /**
     * 格式化数字显示
     */
    private formatNumber(num: number): string {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toString();
    }

    /**
     * 渲染组件内容
     */
    protected render(): void {
        if (this.element) {
            // 更新资源数据
            const businessSystem = this.gameManager.getBusinessSystem();
            const mergeSystem = this.gameManager.getMergeSystem();

            this.resourceData.cash = businessSystem.getCash();
            this.resourceData.reputation = businessSystem.getReputation();
            this.resourceData.connections = businessSystem.getConnections();
            this.resourceData.energy = mergeSystem.getCurrentEnergy();
            this.resourceData.maxEnergy = mergeSystem.getMaxEnergy();

            this.updateDisplay();
        }
    }

    /**
     * 获取资源数据
     */
    public getResourceData(): ResourceData {
        return { ...this.resourceData };
    }
}