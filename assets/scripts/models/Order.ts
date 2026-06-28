/**
 * 订单模型
 * 定义游戏中的顾客订单系统
 */

/**
 * 顾客类型
 */
export enum CustomerType {
    NORMAL = 'normal',           // 普通顾客
    REGULAR = 'regular',         // 老客户
    VIP = 'vip',                 // VIP客户
    SPECIAL = 'special'           // 特殊顾客
}

/**
 * 物品需求
 */
export interface ItemRequirement {
    itemId: string;      // 物品ID
    level: number;       // 等级要求
    count: number;       // 数量
}

/**
 * 订单奖励
 */
export interface OrderReward {
    cash: number;             // 现金奖励
    reputation: number;      // 口碑奖励
    connections: number;     // 人脉奖励
    specialRewards?: {       // 特殊奖励
        type: string;
        id: string;
        count: number;
    }[];
}

/**
 * 订单配置
 */
export interface OrderConfig {
    id: string;                      // 订单ID
    customerType: CustomerType;      // 顾客类型
    customerName: string;           // 顾客名称
    requirements: ItemRequirement[]; // 物品需求
    baseReward: OrderReward;        // 基础奖励
    timeLimit: number;              // 时间限制（秒）
    difficulty: number;             // 难度系数（1-5）
    unlockConditions?: {            // 解锁条件
        type: 'reputation' | 'shop_level' | 'chapter';
        value: number | string;
    }[];
}

/**
 * 订单类
 */
export class Order {
    private config: OrderConfig;
    private createTime: number;
    private expireTime: number;
    private isCompleted: boolean = false;
    private expired: boolean = false;

    constructor(config: OrderConfig) {
        this.config = config;
        this.createTime = Date.now();
        this.expireTime = this.createTime + (config.timeLimit * 1000);
    }

    /**
     * 获取订单ID
     */
    public getId(): string {
        return this.config.id;
    }

    /**
     * 获取顾客类型
     */
    public getCustomerType(): CustomerType {
        return this.config.customerType;
    }

    /**
     * 获取顾客名称
     */
    public getCustomerName(): string {
        return this.config.customerName;
    }

    /**
     * 获取物品需求
     */
    public getRequirements(): ItemRequirement[] {
        return [...this.config.requirements];
    }

    /**
     * 获取基础奖励
     */
    public getBaseReward(): OrderReward {
        return { ...this.config.baseReward };
    }

    /**
     * 计算实际奖励（考虑店铺等级等加成）
     */
    public calculateReward(shopLevel: number, reputationMultiplier: number = 1.0): OrderReward {
        const baseReward = this.getBaseReward();

        // 店铺等级加成：每级+20%
        const shopBonus = 1 + (shopLevel - 1) * 0.2;

        // 口碑加成
        const totalMultiplier = shopBonus * reputationMultiplier;

        return {
            cash: Math.floor(baseReward.cash * totalMultiplier),
            reputation: baseReward.reputation,
            connections: baseReward.connections,
            specialRewards: baseReward.specialRewards
        };
    }

    /**
     * 检查订单是否过期
     */
    public isExpired(): boolean {
        if (this.isCompleted || this.expired) {
            return true;
        }

        const now = Date.now();
        this.expired = now > this.expireTime;
        return this.expired;
    }

    /**
     * 获取剩余时间（秒）
     */
    public getRemainingTime(): number {
        if (this.isCompleted || this.expired) {
            return 0;
        }

        const now = Date.now();
        const remaining = Math.max(0, this.expireTime - now);
        return Math.ceil(remaining / 1000);
    }

    /**
     * 检查是否可以完成（玩家有所需物品）
     */
    public canComplete(checkItemCallback: (itemId: string, level: number, count: number) => boolean): boolean {
        if (this.isCompleted || this.expired) {
            return false;
        }

        return this.config.requirements.every(req =>
            checkItemCallback(req.itemId, req.level, req.count)
        );
    }

    /**
     * 完成订单
     */
    public complete(consumeItemCallback: (itemId: string, level: number, count: number) => boolean): OrderReward | null {
        if (!this.canComplete(consumeItemCallback)) {
            return null;
        }

        // 消耗物品
        for (const req of this.config.requirements) {
            if (!consumeItemCallback(req.itemId, req.level, req.count)) {
                console.error(`[Order] 消耗物品失败: ${req.itemId}`);
                return null;
            }
        }

        this.isCompleted = true;
        return this.getBaseReward();
    }

    /**
     * 获取订单难度
     */
    public getDifficulty(): number {
        return this.config.difficulty;
    }

    /**
     * 检查解锁条件
     */
    public checkUnlock(checkConditionCallback: (type: string, value: any) => boolean): boolean {
        if (!this.config.unlockConditions) {
            return true;
        }

        return this.config.unlockConditions.every((cond: any) =>
            checkConditionCallback(cond.type, cond.value)
        );
    }

    /**
     * 获取订单状态
     */
    public getStatus(): {
        isCompleted: boolean;
        isExpired: boolean;
        remainingTime: number;
        canComplete: boolean;
    } {
        return {
            isCompleted: this.isCompleted,
            isExpired: this.expired,
            remainingTime: this.getRemainingTime(),
            canComplete: !this.isCompleted && !this.expired
        };
    }
}

/**
 * 店铺升级配置
 */
export interface ShopUpgradeConfig {
    level: number;              // 目标等级
    name: string;              // 等级名称
    costs: {
        cash: number;          // 现金消耗
        items?: {
            itemId: string;
            count: number;
        }[];
        reputation?: number;   // 口碑要求
        connections?: number;  // 人脉要求
    };
    rewards: {
        orderBonus: number;    // 订单奖励加成
        generatorUnlock?: string[];  // 解锁生成器
        customerUnlock?: CustomerType[];  // 解锁顾客类型
    };
}

/**
 * 店铺升级类
 */
export class ShopUpgrade {
    private config: ShopUpgradeConfig;
    private isUpgraded: boolean = false;

    constructor(config: ShopUpgradeConfig) {
        this.config = config;
    }

    /**
     * 获取升级配置
     */
    public getConfig(): ShopUpgradeConfig {
        return this.config;
    }

    /**
     * 获取目标等级
     */
    public getTargetLevel(): number {
        return this.config.level;
    }

    /**
     * 获取等级名称
     */
    public getName(): string {
        return this.config.name;
    }

    /**
     * 检查是否可以升级
     */
    public canUpgrade(checkResourceCallback: (type: string, value: any) => boolean): boolean {
        if (this.isUpgraded) {
            return false;
        }

        // 检查现金
        if (!checkResourceCallback('cash', this.config.costs.cash)) {
            return false;
        }

        // 检查物品消耗
        if (this.config.costs.items) {
            for (const item of this.config.costs.items) {
                if (!checkResourceCallback('item', item)) {
                    return false;
                }
            }
        }

        // 检查口碑要求
        if (this.config.costs.reputation) {
            if (!checkResourceCallback('reputation', this.config.costs.reputation)) {
                return false;
            }
        }

        // 检查人脉要求
        if (this.config.costs.connections) {
            if (!checkResourceCallback('connections', this.config.costs.connections)) {
                return false;
            }
        }

        return true;
    }

    /**
     * 执行升级
     */
    public upgrade(consumeResourceCallback: (type: string, value: any) => boolean): boolean {
        if (!this.canUpgrade(consumeResourceCallback)) {
            return false;
        }

        // 消耗现金
        if (!consumeResourceCallback('cash', this.config.costs.cash)) {
            return false;
        }

        // 消耗物品
        if (this.config.costs.items) {
            for (const item of this.config.costs.items) {
                if (!consumeResourceCallback('item', item)) {
                    return false;
                }
            }
        }

        this.isUpgraded = true;
        return true;
    }

    /**
     * 获取升级奖励
     */
    public getRewards() {
        return this.config.rewards;
    }

    /**
     * 获取升级状态
     */
    public isUpgradeCompleted(): boolean {
        return this.isUpgraded;
    }
}

export default Order;