/**
 * 合成系统
 * 负责合成盘管理、物品合成逻辑
 */

import { EventManager, GameEvents } from '../../core/EventManager';
import { MergeItem, Generator, ItemConfig, ItemType } from '../../models/Item';

/**
 * 网格位置
 */
export interface GridPosition {
    x: number;
    y: number;
}

/**
 * 合成操作结果
 */
export interface MergeResult {
    success: boolean;
    resultItem?: MergeItem;
    message?: string;
}

/**
 * 合成系统配置
 */
export interface MergeSystemConfig {
    gridSize: number;        // 网格大小 (7x7)
    maxEnergy: number;       // 最大体力
    energyRegenRate: number; // 体力恢复速率 (点/分钟)
}

/**
 * 合成系统类
 */
export class MergeSystem {
    private static instance: MergeSystem;

    // 配置
    private config: MergeSystemConfig = {
        gridSize: 7,
        maxEnergy: 60,
        energyRegenRate: 20 // 每小时恢复20点
    };

    // 状态
    private grid: (MergeItem | null)[][] = [];
    private generators: Generator[] = [];
    private generatorConfigs: Map<string, any> = new Map();
    private items: Map<string, ItemConfig> = new Map();
    private currentEnergy: number = 40;
    private lastEnergyUpdateTime: number = Date.now();

    private constructor() {
        this.initGrid();
    }

    /**
     * 获取单例实例
     */
    public static getInstance(): MergeSystem {
        if (!MergeSystem.instance) {
            MergeSystem.instance = new MergeSystem();
        }
        return MergeSystem.instance;
    }

    /**
     * 初始化合成盘
     */
    public init(): void {
        this.initGrid();
        this.currentEnergy = 40;
        this.generators = [];
        this.generatorConfigs.clear();
        console.log('[MergeSystem] 初始化完成');
    }

    /**
     * 初始化网格
     */
    private initGrid(): void {
        this.grid = [];
        for (let x = 0; x < this.config.gridSize; x++) {
            this.grid[x] = [];
            for (let y = 0; y < this.config.gridSize; y++) {
                this.grid[x][y] = null;
            }
        }
    }

    /**
     * 设置物品配置
     */
    public setItems(items: ItemConfig[]): void {
        this.items.clear();
        items.forEach(item => {
            this.items.set(item.id, item);
        });
    }

    /**
     * 添加生成器
     */
    public addGenerator(generator: Generator): void {
        this.generators.push(generator);
    }

    /**
     * 获取所有生成器
     */
    public getGenerators(): Generator[] {
        return [...this.generators];
    }

    /**
     * 获取指定生成器
     */
    public getGenerator(generatorId: string): Generator | undefined {
        return this.generators.find(g => g.getId() === generatorId);
    }

    /**
     * 在指定位置放置物品
     */
    public placeItem(item: MergeItem, position: GridPosition): boolean {
        if (!this.isValidPosition(position)) {
            return false;
        }

        if (this.grid[position.x][position.y] !== null) {
            return false;
        }

        this.grid[position.x][position.y] = item;
        item.setGridPosition(position);

        EventManager.getInstance().emit(GameEvents.ITEM_CONSUMED, {
            item,
            position
        });

        return true;
    }

    /**
     * 移除指定位置的物品
     */
    public removeItem(position: GridPosition): MergeItem | null {
        if (!this.isValidPosition(position)) {
            return null;
        }

        const item = this.grid[position.x][position.y];
        if (item) {
            item.setGridPosition(null);
            this.grid[position.x][position.y] = null;
        }

        return item;
    }

    /**
     * 获取指定位置的物品
     */
    public getItemAt(position: GridPosition): MergeItem | null {
        if (!this.isValidPosition(position)) {
            return null;
        }

        return this.grid[position.x][position.y];
    }

    /**
     * 合成两个物品
     */
    public mergeItems(fromPos: GridPosition, toPos: GridPosition): MergeResult {
        // 验证位置
        if (!this.isValidPosition(fromPos) || !this.isValidPosition(toPos)) {
            return { success: false, message: '无效的位置' };
        }

        const fromItem = this.grid[fromPos.x][fromPos.y];
        const toItem = this.grid[toPos.x][toPos.y];

        // 验证物品存在
        if (!fromItem) {
            return { success: false, message: '源位置没有物品' };
        }

        // 目标位置为空，移动物品
        if (!toItem) {
            this.grid[toPos.x][toPos.y] = fromItem;
            this.grid[fromPos.x][fromPos.y] = null;
            fromItem.setGridPosition(toPos);

            return { success: true };
        }

        // 检查是否可以合成
        if (!fromItem.canMergeWith(toItem)) {
            return { success: false, message: '这两个物品无法合成' };
        }

        // 检查合成概率
        const mergeChance = fromItem.getMergeChance();
        if (Math.random() > mergeChance) {
            // 合成失败，但移除源物品
            this.grid[fromPos.x][fromPos.y] = null;
            fromItem.setGridPosition(null);

            EventManager.getInstance().emit(GameEvents.MERGE_FAIL, {
                position: toPos,
                item: toItem
            });

            return { success: false, message: '合成失败' };
        }

        // 获取合成结果
        const resultConfig = fromItem.getMergeResultConfig();
        const resultItem = new MergeItem(resultConfig);

        // 放置合成结果
        this.grid[toPos.x][toPos.y] = resultItem;
        resultItem.setGridPosition(toPos);

        // 移除源物品
        this.grid[fromPos.x][fromPos.y] = null;

        // 触发合成成功事件
        EventManager.getInstance().emit(GameEvents.MERGE_SUCCESS, {
            result: resultItem,
            fromItem,
            toItem,
            position: toPos
        });

        return { success: true, resultItem };
    }

    /**
     * 使用生成器生产物品
     */
    public generateFrom(generatorId: string): MergeItem | null {
        const generator = this.getGenerator(generatorId);
        if (!generator) {
            console.error(`[MergeSystem] 找不到生成器: ${generatorId}`);
            return null;
        }

        // 检查体力
        if (this.currentEnergy < generator.getEnergyCost()) {
            console.log('[MergeSystem] 体力不足');
            return null;
        }

        // 检查是否可以生产
        if (!generator.canProduce()) {
            return null;
        }

        // 生产物品
        const newItem = generator.produce(this.items);
        if (!newItem) {
            return null;
        }

        // 消耗体力
        this.consumeEnergy(generator.getEnergyCost());

        // 寻找空位置
        const emptySlots = this.getEmptySlots();
        if (emptySlots.length === 0) {
            console.log('[MergeSystem] 合成盘已满');
            generator.completeProduction();
            return null;
        }

        // 随机选择空位置放置
        const slot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
        this.placeItem(newItem, slot);

        // 标记生产完成
        generator.completeProduction();

        // 触发生成物品事件
        EventManager.getInstance().emit(GameEvents.GENERATE_ITEM, {
            item: newItem,
            generator: generator.getId(),
            position: slot
        });

        return newItem;
    }

    /**
     * 获取所有空位置
     */
    public getEmptySlots(): GridPosition[] {
        const emptySlots: GridPosition[] = [];

        for (let x = 0; x < this.config.gridSize; x++) {
            for (let y = 0; y < this.config.gridSize; y++) {
                if (this.grid[x][y] === null) {
                    emptySlots.push({ x, y });
                }
            }
        }

        return emptySlots;
    }

    /**
     * 获取所有物品
     */
    public getAllItems(): MergeItem[] {
        const items: MergeItem[] = [];

        for (let x = 0; x < this.config.gridSize; x++) {
            for (let y = 0; y < this.config.gridSize; y++) {
                if (this.grid[x][y] !== null) {
                    items.push(this.grid[x][y]!);
                }
            }
        }

        return items;
    }

    /**
     * 根据类型获取物品
     */
    public getItemsByType(type: ItemType): MergeItem[] {
        return this.getAllItems().filter(item => item.getType() === type);
    }

    /**
     * 检查是否有指定物品
     */
    public hasItem(itemId: string, level: number): boolean {
        const items = this.getAllItems();
        return items.some(item =>
            item.getId() === itemId &&
            item.getLevel() === level
        );
    }

    /**
     * 消耗指定物品
     */
    public consumeItem(itemId: string, level: number, count: number = 1): boolean {
        const items = this.getAllItems();
        const matchingItems = items.filter(item =>
            item.getId() === itemId &&
            item.getLevel() === level
        );

        if (matchingItems.length < count) {
            return false;
        }

        // 消耗指定数量的物品
        for (let i = 0; i < count; i++) {
            const item = matchingItems[i];
            const position = item.getGridPosition();
            if (position) {
                this.removeItem(position);
            }
        }

        return true;
    }

    /**
     * 获取当前体力
     */
    public getCurrentEnergy(): number {
        this.updateEnergy();
        return this.currentEnergy;
    }

    /**
     * 获取最大体力
     */
    public getMaxEnergy(): number {
        return this.config.maxEnergy;
    }

    /**
     * 增加体力
     */
    public addEnergy(amount: number): void {
        this.currentEnergy = Math.min(
            this.currentEnergy + amount,
            this.config.maxEnergy
        );

        EventManager.getInstance().emit(GameEvents.ENERGY_CHANGED, {
            current: this.currentEnergy,
            max: this.config.maxEnergy
        });
    }

    /**
     * 消耗体力
     */
    public consumeEnergy(amount: number): boolean {
        if (this.currentEnergy < amount) {
            return false;
        }

        this.currentEnergy -= amount;

        EventManager.getInstance().emit(GameEvents.ENERGY_CHANGED, {
            current: this.currentEnergy,
            max: this.config.maxEnergy,
            consumed: amount
        });

        return true;
    }

    /**
     * 更新体力（自然恢复）
     */
    private updateEnergy(): void {
        const now = Date.now();
        const elapsed = now - this.lastEnergyUpdateTime;
        const hoursElapsed = elapsed / (1000 * 60 * 60);

        if (hoursElapsed >= 1 / 60) { // 至少经过1分钟
            const energyRegen = Math.floor(hoursElapsed * this.config.energyRegenRate);
            if (energyRegen > 0) {
                this.addEnergy(energyRegen);
            }
            this.lastEnergyUpdateTime = now;
        }
    }

    /**
     * 验证位置是否有效
     */
    private isValidPosition(position: GridPosition): boolean {
        return (
            position.x >= 0 &&
            position.x < this.config.gridSize &&
            position.y >= 0 &&
            position.y < this.config.gridSize
        );
    }

    /**
     * 获取网格大小
     */
    public getGridSize(): number {
        return this.config.gridSize;
    }

    /**
     * 清空合成盘
     */
    public clearGrid(): void {
        this.initGrid();
    }

    /**
     * 获取系统状态
     */
    public getSystemState(): any {
        return {
            gridSize: this.config.gridSize,
            currentEnergy: this.getCurrentEnergy(),
            maxEnergy: this.config.maxEnergy,
            itemCount: this.getAllItems().length,
            emptySlots: this.getEmptySlots().length,
            generators: this.generators.map(g => ({
                id: g.getId(),
                name: g.getName(),
                canProduce: g.canProduce(),
                cooldownRemaining: g.getCooldownRemaining()
            }))
        };
    }

    /**
     * 加载物品配置
     */
    public loadItemConfigs(itemConfigs: any[]): void {
        console.log('[MergeSystem] 加载物品配置...');
        this.setItems(itemConfigs as ItemConfig[]);
        console.log(`[MergeSystem] 已加载 ${itemConfigs.length} 个物品`);
    }

    /**
     * 加载生成器配置
     */
    public loadGeneratorConfigs(generatorConfigs: any[]): void {
        console.log('[MergeSystem] 加载生成器配置...');
        this.generatorConfigs.clear();
        this.generators = [];

        generatorConfigs.forEach(config => {
            this.generatorConfigs.set(config.id, config);

            if (config.unlockChapter <= 1 && !config.unlockConditions) {
                this.unlockGenerator(config.id);
            }
        });
        console.log(`[MergeSystem] 已加载 ${this.generators.length} 个生成器`);
    }

    /**
     * 解锁生成器
     */
    public unlockGenerator(generatorId: string): boolean {
        if (this.getGenerator(generatorId)) {
            return true;
        }

        const config = this.generatorConfigs.get(generatorId);
        if (!config) {
            console.warn(`[MergeSystem] 找不到生成器配置: ${generatorId}`);
            return false;
        }

        const generator = new Generator({
            id: config.id,
            name: config.name,
            description: config.description,
            unlockChapter: config.unlockChapter,
            unlockConditions: config.unlockConditions,
            production: config.production
        });

        this.generators.push(generator);
        return true;
    }
}

export default MergeSystem;
