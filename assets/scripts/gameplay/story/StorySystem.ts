/**
 * 剧情系统
 * 负责章节管理、剧情事件、对话系统
 */

import { EventManager, GameEvents } from '../../core/EventManager';

/**
 * 剧情类型
 */
export enum StoryType {
    MAIN = 'main',           // 主线剧情
    SIDE = 'side',           // 支线剧情
    EVENT = 'event',         // 事件剧情
    TUTORIAL = 'tutorial'    // 教程剧情
}

/**
 * 对话行
 */
export interface DialogueLine {
    speaker: string;         // 说话人
    text: string;           // 对话内容
    emotion?: string;       // 表情（可选）
    action?: string;        // 动作（可选）
    duration?: number;      // 显示时长（毫秒）
}

/**
 * 剧情事件需求
 */
export interface EventRequirement {
    type: 'cash' | 'reputation' | 'connections' | 'item' | 'chapter_complete' | 'event_complete';
    value: any;
    operator?: '>=' | '<=' | '==' | '>' | '<';
}

/**
 * 剧情事件奖励
 */
export interface EventReward {
    cash?: number;
    reputation?: number;
    connections?: number;
    items?: { itemId: string; count: number; }[];
    unlockChapter?: string;
    unlockGenerator?: string;
    specialEvent?: string;
}

/**
 * 剧情事件配置
 */
export interface StoryEventConfig {
    id: string;
    chapterId: string;
    type: StoryType;
    title: string;
    description: string;
    dialogue: DialogueLine[];
    requirements?: EventRequirement[];
    rewards?: EventReward;
    triggerOnce: boolean;
    priority: number;
    nextEvents?: string[];  // 可触发的事件ID
}

/**
 * 章节配置
 */
export interface ChapterConfig {
    id: string;
    title: string;
    description: string;
    year: number;
    chapterNumber: number;
    mainGoal: string;
    goalTarget: {
        type: 'cash' | 'shop_upgrade' | 'complete_events';
        value: any;
    };
    scenes: string[];       // 场景列表
    unlockConditions?: EventRequirement[];
    events: StoryEventConfig[];
    isFinalChapter: boolean;
}

/**
 * 剧情事件类
 */
export class StoryEvent {
    private config: StoryEventConfig;
    private isTriggered: boolean = false;
    private isCompleted: boolean = false;

    constructor(config: StoryEventConfig) {
        this.config = config;
    }

    /**
     * 获取事件ID
     */
    public getId(): string {
        return this.config.id;
    }

    /**
     * 获取事件标题
     */
    public getTitle(): string {
        return this.config.title;
    }

    /**
     * 检查是否可以触发
     */
    public canTrigger(checkConditionCallback: (req: EventRequirement) => boolean): boolean {
        // 已触发且只触发一次的事件
        if (this.config.triggerOnce && this.isTriggered) {
            return false;
        }

        // 检查触发条件
        if (this.config.requirements) {
            return this.config.requirements.every(req =>
                checkConditionCallback(req)
            );
        }

        return true;
    }

    /**
     * 触发事件
     */
    public trigger(): void {
        if (this.isTriggered && this.config.triggerOnce) {
            return;
        }

        this.isTriggered = true;

        // 触发事件
        EventManager.getInstance().emit(GameEvents.STORY_EVENT_TRIGGER, {
            event: this,
            dialogue: this.config.dialogue
        });
    }

    /**
     * 完成事件
     */
    public complete(giveRewardCallback: (reward: EventReward) => void): void {
        if (!this.isTriggered) {
            console.warn('[StoryEvent] 事件未触发，无法完成');
            return;
        }

        this.isCompleted = true;

        // 发放奖励
        if (this.config.rewards) {
            giveRewardCallback(this.config.rewards);
        }

        // 触发完成事件
        EventManager.getInstance().emit(GameEvents.STORY_EVENT_COMPLETE, {
            event: this,
            rewards: this.config.rewards
        });
    }

    /**
     * 获取对话内容
     */
    public getDialogue(): DialogueLine[] {
        return [...this.config.dialogue];
    }

    /**
     * 获取奖励
     */
    public getRewards(): EventReward | undefined {
        return this.config.rewards;
    }

    /**
     * 获取可触发的后续事件
     */
    public getNextEvents(): string[] {
        return this.config.nextEvents || [];
    }

    /**
     * 获取事件状态
     */
    public getStatus(): {
        isTriggered: boolean;
        isCompleted: boolean;
        canTrigger: boolean;
    } {
        return {
            isTriggered: this.isTriggered,
            isCompleted: this.isCompleted,
            canTrigger: !this.isTriggered || !this.config.triggerOnce
        };
    }
}

/**
 * 剧情系统类
 */
export class StorySystem {
    private static instance: StorySystem;

    // 状态
    private currentChapter: ChapterConfig | null = null;
    private completedChapters: Set<string> = new Set();
    private completedEvents: Set<string> = new Set();
    private availableEvents: Map<string, StoryEvent> = new Map();
    private activeEvent: StoryEvent | null = null;

    // 配置
    private chapters: Map<string, ChapterConfig> = new Map();

    private constructor() {}

    /**
     * 获取单例实例
     */
    public static getInstance(): StorySystem {
        if (!StorySystem.instance) {
            StorySystem.instance = new StorySystem();
        }
        return StorySystem.instance;
    }

    /**
     * 初始化剧情系统
     */
    public init(): void {
        this.currentChapter = null;
        this.completedChapters.clear();
        this.completedEvents.clear();
        this.availableEvents.clear();
        this.activeEvent = null;

        console.log('[StorySystem] 初始化完成');
    }

    /**
     * 设置章节配置
     */
    public setChapters(chapters: ChapterConfig[]): void {
        this.chapters.clear();
        chapters.forEach(chapter => {
            this.chapters.set(chapter.id, chapter);
        });
    }

    /**
     * 加载章节
     */
    public loadChapter(chapterId: string, checkConditionCallback?: (req: EventRequirement) => boolean): boolean {
        const chapter = this.chapters.get(chapterId);
        if (!chapter) {
            console.error(`[StorySystem] 找不到章节: ${chapterId}`);
            return false;
        }

        // 检查解锁条件
        if (chapter.unlockConditions && checkConditionCallback) {
            const canUnlock = chapter.unlockConditions.every(req =>
                checkConditionCallback(req)
            );
            if (!canUnlock) {
                console.log(`[StorySystem] 章节 ${chapterId} 未解锁`);
                return false;
            }
        }

        this.currentChapter = chapter;

        // 初始化章节事件
        this.initializeChapterEvents(chapter);

        // 触发章节开始事件
        EventManager.getInstance().emit(GameEvents.CHAPTER_START, {
            chapter,
            previousChapter: Array.from(this.completedChapters).pop()
        });

        console.log(`[StorySystem] 加载章节: ${chapter.title}`);
        return true;
    }

    /**
     * 初始化章节事件
     */
    private initializeChapterEvents(chapter: ChapterConfig): void {
        this.availableEvents.clear();

        chapter.events.forEach(eventConfig => {
            const event = new StoryEvent(eventConfig);
            this.availableEvents.set(eventConfig.id, event);
        });
    }

    /**
     * 获取当前章节
     */
    public getCurrentChapter(): ChapterConfig | null {
        return this.currentChapter;
    }

    /**
     * 检查并触发剧情事件
     */
    public checkAndTriggerEvents(checkConditionCallback: (req: EventRequirement) => boolean): StoryEvent | null {
        if (!this.currentChapter || this.activeEvent) {
            return null;
        }

        // 按优先级排序可触发的事件
        const triggerableEvents = Array.from(this.availableEvents.values())
            .filter(event => event.canTrigger(checkConditionCallback))
            .sort((a, b) => {
                // 优先触发高优先级、未触发的事件
                const aStatus = a.getStatus();
                const bStatus = b.getStatus();

                if (aStatus.isTriggered && !bStatus.isTriggered) return 1;
                if (!aStatus.isTriggered && bStatus.isTriggered) return -1;

                const aPriority = a['config']?.priority || 0;
                const bPriority = b['config']?.priority || 0;
                return bPriority - aPriority;
            });

        if (triggerableEvents.length === 0) {
            return null;
        }

        // 触发第一个可触发的事件
        const event = triggerableEvents[0];
        this.activeEvent = event;
        event.trigger();

        return event;
    }

    /**
     * 完成当前事件
     */
    public completeCurrentEvent(giveRewardCallback: (reward: EventReward) => void): boolean {
        if (!this.activeEvent) {
            return false;
        }

        const eventId = this.activeEvent.getId();
        this.activeEvent.complete(giveRewardCallback);
        this.completedEvents.add(eventId);
        this.activeEvent = null;

        // 检查章节是否完成
        this.checkChapterCompletion();

        return true;
    }

    /**
     * 检查章节完成条件
     */
    private checkChapterCompletion(): void {
        if (!this.currentChapter) {
            return;
        }

        const chapter = this.currentChapter;

        // 检查是否所有事件都已完成
        const allEventsCompleted = chapter.events.every(event =>
            this.completedEvents.has(event.id)
        );

        if (allEventsCompleted) {
            this.completeChapter();
        }
    }

    /**
     * 完成章节
     */
    private completeChapter(): void {
        if (!this.currentChapter) {
            return;
        }

        const chapterId = this.currentChapter.id;
        this.completedChapters.add(chapterId);

        // 触发章节完成事件
        EventManager.getInstance().emit(GameEvents.CHAPTER_COMPLETE, {
            chapter: this.currentChapter,
            nextChapterId: this.getNextChapterId()
        });

        console.log(`[StorySystem] 完成章节: ${this.currentChapter.title}`);
    }

    /**
     * 获取下一章节ID
     */
    private getNextChapterId(): string | null {
        if (!this.currentChapter) {
            return null;
        }

        const nextChapterNumber = this.currentChapter.chapterNumber + 1;
        const nextChapter = Array.from(this.chapters.values()).find(
            ch => ch.chapterNumber === nextChapterNumber
        );

        return nextChapter ? nextChapter.id : null;
    }

    /**
     * 获取可用事件列表
     */
    public getAvailableEvents(): StoryEvent[] {
        return Array.from(this.availableEvents.values());
    }

    /**
     * 获取已完成事件列表
     */
    public getCompletedEvents(): string[] {
        return Array.from(this.completedEvents);
    }

    /**
     * 检查事件是否已完成
     */
    public isEventCompleted(eventId: string): boolean {
        return this.completedEvents.has(eventId);
    }

    /**
     * 获取当前活动事件
     */
    public getActiveEvent(): StoryEvent | null {
        return this.activeEvent;
    }

    /**
     * 跳过当前事件（测试用）
     */
    public skipCurrentEvent(): void {
        if (this.activeEvent) {
            this.activeEvent = null;
            console.log('[StorySystem] 跳过当前事件');
        }
    }

    /**
     * 检查章节目标是否完成
     */
    public checkChapterGoal(checkConditionCallback: (type: string, value: any) => boolean): boolean {
        if (!this.currentChapter) {
            return false;
        }

        const goal = this.currentChapter.goalTarget;
        return checkConditionCallback(goal.type, goal.value);
    }

    /**
     * 获取系统状态
     */
    public getSystemState(): any {
        return {
            currentChapterId: this.currentChapter?.id || null,
            completedChapters: Array.from(this.completedChapters),
            availableEvents: this.availableEvents.size,
            completedEvents: this.completedEvents.size,
            activeEvent: this.activeEvent?.getId() || null,
            chapterProgress: this.currentChapter ?
                this.completedEvents.size / this.currentChapter.events.length : 0
        };
    }

    /**
     * 加载章节配置
     */
    public loadChapterConfigs(chapterConfigs: any[]): void {
        console.log('[StorySystem] 加载章节配置...');
        this.chapters.clear();
        chapterConfigs.forEach(chapter => {
            this.chapters.set(chapter.id, chapter);
        });
        console.log(`[StorySystem] 已加载 ${chapterConfigs.length} 个章节配置`);
    }
}

export default StorySystem;