/**
 * 物品引导数据系统
 * 提供物品用途、生成器产出和游戏引导信息
 */

import { MergeItem, Generator } from '../models/Item';

/**
 * 物品用途信息
 */
export interface ItemUsage {
    itemId: string;
    name: string;
    level: number;
    // 合成用途
    canMergeTo?: {
        targetId: string;
        targetName: string;
        mergeChance: number;
    };
    // 剧情用途
    storyUses?: {
        chapterId: string;
        chapterTitle: string;
        eventTitle: string;
        requiredCount: number;
    }[];
    // 生成器产出
    generatorSources?: {
        generatorId: string;
        generatorName: string;
        probability: number;
        cooldown: number;
    }[];
    // 稀有度等级
    rarity: 'common' | 'uncommon' | 'rare' | 'epic';
    // 价值等级
    value: number;
}

/**
 * 生成器详细信息
 */
export interface GeneratorGuide {
    generatorId: string;
    name: string;
    description: string;
    // 产出列表
    outputs: {
        itemId: string;
        itemName: string;
        probability: number; // 百分比
        isStoryItem: boolean; // 是否为剧情所需物品
    }[];
    // 冷却时间
    cooldown: number;
    // 体力消耗
    energyCost: number;
    // 解锁条件
    unlockCondition?: string;
}

/**
 * 新手引导步骤
 */
export interface TutorialStep {
    id: string;
    title: string;
    description: string;
    // 步骤类型
    type: 'info' | 'action' | 'highlight';
    // 目标位置（用于高亮UI元素）
    targetElement?: 'generator' | 'merge_area' | 'story_event' | 'inventory';
    // 目标对象ID
    targetId?: string;
    // 完成条件检查函数
    checkComplete?: () => boolean;
    // 下一步ID
    nextStep?: string;
}

/**
 * 引导数据管理器
 */
export class ItemGuideData {
    private static instance: ItemGuideData;
    private itemUsageCache: Map<string, ItemUsage> = new Map();
    private generatorGuideCache: Map<string, GeneratorGuide> = new Map();

    private constructor() {}

    static getInstance(): ItemGuideData {
        if (!ItemGuideData.instance) {
            ItemGuideData.instance = new ItemGuideData();
        }
        return ItemGuideData.instance;
    }

    /**
     * 计算物品用途信息
     */
    calculateItemUsage(
        item: MergeItem,
        allItems: MergeItem[],
        generators: Generator[],
        storyEvents: any[]
    ): ItemUsage {
        const cacheKey = `${item.getId()}_Lv${item.getLevel()}`;

        if (this.itemUsageCache.has(cacheKey)) {
            return this.itemUsageCache.get(cacheKey)!;
        }

        const usage: ItemUsage = {
            itemId: item.getId(),
            name: item.getName(),
            level: item.getLevel(),
            rarity: this.calculateRarity(item),
            value: item.getValue()
        };

        // 1. 检查合成用途
        const nextLevelItem = allItems.find(i =>
            i.getId() === item.getId() &&
            i.getLevel() === item.getLevel() + 1
        );

        if (nextLevelItem) {
            usage.canMergeTo = {
                targetId: nextLevelItem.getId(),
                targetName: nextLevelItem.getName(),
                mergeChance: nextLevelItem.getMergeChance()
            };
        }

        // 2. 检查剧情用途
        const storyUses: any[] = [];
        storyEvents.forEach(event => {
            const requirements = event.getRequirements?.() || event.requirements || [];
            requirements.forEach((req: any) => {
                if (req.type === 'item' &&
                    req.value?.itemId === item.getId() &&
                    req.value?.level === item.getLevel()) {
                    storyUses.push({
                        chapterId: event.chapterId || 'unknown',
                        chapterTitle: event.chapterTitle || '未知章节',
                        eventTitle: event.title || event.getTitle?.() || '未知事件',
                        requiredCount: req.value?.count || 1
                    });
                }
            });
        });

        if (storyUses.length > 0) {
            usage.storyUses = storyUses;
        }

        // 3. 检查生成器来源
        const generatorSources: any[] = [];
        generators.forEach(gen => {
            // 通过配置访问production信息
            const production = (gen as any).config?.production;
            if (production && production.items.includes(item.getId())) {
                const itemIndex = production.items.indexOf(item.getId());
                const weight = production.weights[itemIndex] || 0;
                const totalWeight = production.weights.reduce((a: number, b: number) => a + b, 0);
                const probability = (weight / totalWeight) * 100;

                generatorSources.push({
                    generatorId: gen.getId(),
                    generatorName: gen.getName(),
                    probability: Math.round(probability),
                    cooldown: production.cooldown
                });
            }
        });

        if (generatorSources.length > 0) {
            usage.generatorSources = generatorSources;
        }

        this.itemUsageCache.set(cacheKey, usage);
        return usage;
    }

    /**
     * 创建生成器引导信息
     */
    createGeneratorGuide(
        generator: Generator,
        allItems: MergeItem[],
        storyEvents: any[]
    ): GeneratorGuide {
        const cacheKey = generator.getId();

        if (this.generatorGuideCache.has(cacheKey)) {
            return this.generatorGuideCache.get(cacheKey)!;
        }

        // 通过配置访问production信息
        const production = (generator as any).config?.production;
        if (!production) {
            throw new Error(`Generator ${generator.getId()} has no production config`);
        }

        const totalWeight = production.weights.reduce((a: number, b: number) => a + b, 0);

        // 收集剧情所需物品
        const storyItemIds = new Set<string>();
        storyEvents.forEach(event => {
            const requirements = event.getRequirements?.() || event.requirements || [];
            requirements.forEach((req: any) => {
                if (req.type === 'item') {
                    storyItemIds.add(req.value?.itemId);
                }
            });
        });

        const outputs = production.items.map((itemId: string, index: number) => {
            const item = allItems.find(i => i.getId() === itemId && i.getLevel() === 1);
            const weight = production.weights[index] || 0;
            const probability = Math.round((weight / totalWeight) * 100);

            return {
                itemId,
                itemName: item?.getName() || itemId,
                probability,
                isStoryItem: storyItemIds.has(itemId)
            };
        });

        const guide: GeneratorGuide = {
            generatorId: generator.getId(),
            name: generator.getName(),
            description: (generator as any).config?.description || '生成器',
            outputs,
            cooldown: production.cooldown,
            energyCost: production.energyCost,
            unlockCondition: (generator as any).config?.unlockConditions?.[0]?.value || '第一章解锁'
        };

        this.generatorGuideCache.set(cacheKey, guide);
        return guide;
    }

    /**
     * 计算物品稀有度
     */
    private calculateRarity(item: MergeItem): 'common' | 'uncommon' | 'rare' | 'epic' {
        const level = item.getLevel();
        const value = item.getValue();

        if (level >= 5 || value >= 3000) return 'epic';
        if (level >= 4 || value >= 1000) return 'rare';
        if (level >= 3 || value >= 200) return 'uncommon';
        return 'common';
    }

    /**
     * 获取新手引导步骤
     */
    getTutorialSteps(): TutorialStep[] {
        return [
            {
                id: 'welcome',
                title: '欢迎来到2010',
                description: '你回到了2010年，需要在三天内赚出第一桶金来支付父亲的住院押金。',
                type: 'info',
                nextStep: 'generator_intro'
            },
            {
                id: 'generator_intro',
                title: '认识生成器',
                description: '生成器可以定期为你产出物品。点击"记账本"来获得资金链物品。',
                type: 'highlight',
                targetElement: 'generator',
                targetId: 'generator_account_book',
                nextStep: 'make_money'
            },
            {
                id: 'make_money',
                title: '获得资金',
                description: '尝试使用记账本生成器。目标是获得1个"攒钱罐(Lv2)"来推进剧情。',
                type: 'action',
                targetElement: 'generator',
                targetId: 'generator_account_book',
                checkComplete: () => {
                    // 这里需要从游戏状态检查是否拥有money_2 Lv2
                    // 实际实现时需要传入gameManager引用
                    return false;
                },
                nextStep: 'merge_intro'
            },
            {
                id: 'merge_intro',
                title: '合成升级',
                description: '将两个相同的物品拖拽到一起可以合成更高等级的物品。',
                type: 'highlight',
                targetElement: 'merge_area',
                nextStep: 'story_intro'
            },
            {
                id: 'story_intro',
                title: '推进剧情',
                description: '当你拥有足够的物品时，可以完成剧情事件来获得奖励并推进故事。',
                type: 'highlight',
                targetElement: 'story_event',
                nextStep: 'complete'
            },
            {
                id: 'complete',
                title: '开始游戏',
                description: '现在你已经了解了游戏的基本玩法。努力在三天内赚出第一桶金吧！',
                type: 'info'
            }
        ];
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.itemUsageCache.clear();
        this.generatorGuideCache.clear();
    }
}