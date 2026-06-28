/**
 * 物品模型
 * 定义游戏中所有合成物品的基础类
 */

import { GameEvents } from '@core/EventManager';

/**
 * 物品类型枚举
 */
export enum ItemType {
    PRODUCT = 'product',      // 商品链
    MONEY = 'money',          // 资金链
    RELATIONSHIP = 'relationship',  // 人情链
    EQUIPMENT = 'equipment'   // 设备链
}

/**
 * 物品配置接口
 */
export interface ItemConfig {
    id: string;              // 物品ID
    name: string;            // 物品名称
    type: ItemType;          // 物品类型
    level: number;           // 物品等级 (1-5)
    maxLevel: number;        // 最大等级
    description?: string;    // 描述
    icon?: string;           // 图标资源路径
    value?: number;          // 价值（用于订单等）
    mergeChance?: number;    // 合成成功概率 (0-1)
    sellPrice?: number;      // 出售价格
}

/**
 * 物品质量等级
 */
export enum ItemQuality {
    COMMON = 1,      // 普通
    RARE = 2,        // 稀有
    EPIC = 3,        // 史诗
    LEGENDARY = 4    // 传说
}

/**
 * 合成物品类
 */
export class MergeItem {
    private config: ItemConfig;
    private gridPosition: { x: number; y: number } | null = null;

    constructor(config: ItemConfig) {
        this.config = config;
    }

    /**
     * 获取物品ID
     */
    public getId(): string {
        return this.config.id;
    }

    /**
     * 获取物品名称
     */
    public getName(): string {
        return this.config.name;
    }

    /**
     * 获取物品类型
     */
    public getType(): ItemType {
        return this.config.type;
    }

    /**
     * 获取物品等级
     */
    public getLevel(): number {
        return this.config.level;
    }

    /**
     * 获取最大等级
     */
    public getMaxLevel(): number {
        return this.config.maxLevel;
    }

    /**
     * 获取物品价值
     */
    public getValue(): number {
        return this.config.value || 0;
    }

    /**
     * 获取合成成功概率
     */
    public getMergeChance(): number {
        return this.config.mergeChance !== undefined ? this.config.mergeChance : 1.0;
    }

    /**
     * 获取出售价格
     */
    public getSellPrice(): number {
        return this.config.sellPrice || this.getValue();
    }

    /**
     * 检查是否可以与另一个物品合成
     * @param other 另一个物品
     */
    public canMergeWith(other: MergeItem): boolean {
        if (!other) return false;

        // 必须是相同类型
        if (this.getType() !== other.getType()) return false;

        // 必须是相同ID
        if (this.getId() !== other.getId()) return false;

        // 必须是相同等级
        if (this.getLevel() !== other.getLevel()) return false;

        // 不能超过最大等级
        if (this.getLevel() >= this.getMaxLevel()) return false;

        return true;
    }

    /**
     * 获取合成结果物品配置
     */
    public getMergeResultConfig(): ItemConfig {
        if (this.getLevel() >= this.getMaxLevel()) {
            throw new Error(`物品 ${this.getName()} 已达到最大等级`);
        }

        return {
            ...this.config,
            level: this.getLevel() + 1,
            id: this.generateItemId(this.getLevel() + 1)
        };
    }

    /**
     * 生成高等级物品ID
     * @param level 目标等级
     */
    private generateItemId(level: number): string {
        const baseId = this.getId().replace(/_\d+$/, '');
        return `${baseId}_${level}`;
    }

    /**
     * 设置网格位置
     */
    public setGridPosition(position: { x: number; y: number } | null): void {
        this.gridPosition = position;
    }

    /**
     * 获取网格位置
     */
    public getGridPosition(): { x: number; y: number } | null {
        return this.gridPosition;
    }

    /**
     * 获取物品配置
     */
    public getConfig(): ItemConfig {
        return this.config;
    }

    /**
     * 检查物品是否在合成盘上
     */
    public isOnGrid(): boolean {
        return this.gridPosition !== null;
    }

    /**
     * 创建物品的深拷贝
     */
    public clone(): MergeItem {
        return new MergeItem({ ...this.config });
    }
}

/**
 * 生成器配置
 */
export interface GeneratorConfig {
    id: string;              // 生成器ID
    name: string;            // 生成器名称
    description?: string;    // 描述
    icon?: string;           // 图标资源路径
    unlockChapter: number;   // 解锁章节
    unlockConditions?: {     // 解锁条件
        type: 'level' | 'shop' | 'story';
        value: number | string;
    }[];

    production: {
        items: string[];     // 可生成的物品ID列表
        weights: number[];   // 生成权重
        cooldown: number;    // 冷却时间（秒）
        energyCost: number;  // 体力消耗
    };
}

/**
 * 生成器类
 */
export class Generator {
    private config: GeneratorConfig;
    private lastProductionTime: number = 0;
    private isProducing: boolean = false;

    constructor(config: GeneratorConfig) {
        this.config = config;
    }

    /**
     * 获取生成器配置
     */
    public getConfig(): GeneratorConfig {
        return this.config;
    }

    /**
     * 获取生成器ID
     */
    public getId(): string {
        return this.config.id;
    }

    /**
     * 获取生成器名称
     */
    public getName(): string {
        return this.config.name;
    }

    /**
     * 检查是否可以生产
     */
    public canProduce(): boolean {
        const now = Date.now();
        const cooldown = this.config.production.cooldown * 1000;

        // 检查冷却时间
        if (now - this.lastProductionTime < cooldown) {
            return false;
        }

        // 检查是否正在生产中
        if (this.isProducing) {
            return false;
        }

        return true;
    }

    /**
     * 获取冷却剩余时间（秒）
     */
    public getCooldownRemaining(): number {
        const now = Date.now();
        const cooldown = this.config.production.cooldown * 1000;
        const elapsed = now - this.lastProductionTime;
        const remaining = Math.max(0, cooldown - elapsed);

        return Math.ceil(remaining / 1000);
    }

    /**
     * 生产物品（不消耗体力）
     * @param allItems 所有可生成的物品配置
     */
    public produce(allItems: Map<string, ItemConfig>): MergeItem | null {
        if (!this.canProduce()) {
            return null;
        }

        // 根据权重随机选择物品
        const itemId = this.selectRandomItem();

        if (!itemId) {
            console.error(`[Generator] 生成器 ${this.getName()} 没有可生成的物品`);
            return null;
        }

        const itemConfig = allItems.get(itemId);
        if (!itemConfig) {
            console.error(`[Generator] 找不到物品配置: ${itemId}`);
            return null;
        }

        this.isProducing = true;

        // 更新最后生产时间
        this.lastProductionTime = Date.now();

        return new MergeItem(itemConfig);
    }

    /**
     * 完成生产（重置生产状态）
     */
    public completeProduction(): void {
        this.isProducing = false;
    }

    /**
     * 根据权重随机选择物品
     */
    private selectRandomItem(): string | null {
        const items = this.config.production.items;
        const weights = this.config.production.weights;

        if (items.length === 0 || weights.length === 0) {
            return null;
        }

        if (items.length !== weights.length) {
            console.error('[Generator] 物品和权重数组长度不匹配');
            return null;
        }

        // 计算总权重
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

        // 随机选择
        let random = Math.random() * totalWeight;

        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }

        // 如果有浮点误差，返回最后一个
        return items[items.length - 1];
    }

    /**
     * 获取体力消耗
     */
    public getEnergyCost(): number {
        return this.config.production.energyCost;
    }

    /**
     * 获取解锁章节
     */
    public getUnlockChapter(): number {
        return this.config.unlockChapter;
    }
}

export default MergeItem;