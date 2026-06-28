/**
 * UI基础组件类
 * 所有UI组件的基类，提供通用功能
 */

import { AnimationManager } from '../AnimationManager';
import { ResponsiveManager } from '../ResponsiveManager';

// 声明浏览器环境类型
declare global {
    interface Animation {
        onfinish: (() => void) | null;
        oncancel: (() => void) | null;
        cancel(): void;
    }

    interface KeyFrame {
        [property: string]: string | number;
    }

    interface HTMLElement {
        style: any;
        className: string;
        id: string;
        innerHTML: string;
        textContent: string;
        parentNode?: any;
        classList: any;
        addEventListener?: any;
        removeEventListener?: any;
        appendChild(child: HTMLElement): void;
        removeChild(child: HTMLElement): void;
        querySelector(selector: string): HTMLElement | null;
        querySelectorAll(selectors: string): any;
        dataset: any;
        draggable: boolean;
        animate(keyframes: KeyFrame[], options: any): Animation;
    }

    interface DragEvent {
        dataTransfer: {
            effectAllowed: string;
            dropEffect: string;
            setData(format: string, data: string): void;
            getData(format: string): string;
        };
        preventDefault(): void;
    }

    interface KeyboardEvent {
        key: string;
    }

    interface Document {
        createElement(tagName: string): HTMLElement;
        head: HTMLElement;
        body: HTMLElement;
        getElementById(elementId: string): HTMLElement | null;
        addEventListener(event: string, handler: any): void;
        removeEventListener(event: string, handler: any): void;
        documentElement: HTMLElement;
        getComputedStyle(element: HTMLElement): { getPropertyValue: (property: string) => string };
    }

    interface Window {
        eventManager: any;
        innerWidth: number;
        innerHeight: number;
        addEventListener(event: string, handler: any): void;
        removeEventListener(event: string, handler: any): void;
        matchMedia(query: string): { matches: boolean };
    }

    var document: Document;
    var window: Window;
}

/**
 * 组件状态
 */
export interface ComponentState {
    visible: boolean;
    enabled: boolean;
    data: any;
}

/**
 * UI基础组件类
 */
export abstract class BaseComponent {
    protected state: ComponentState;
    protected element: HTMLElement | null = null;
    protected updatePending: boolean = false;
    protected animationManager: AnimationManager;
    protected responsiveManager: ResponsiveManager;

    constructor() {
        this.state = {
            visible: false,
            enabled: true,
            data: null
        };
        this.animationManager = AnimationManager.getInstance();
        this.responsiveManager = ResponsiveManager.getInstance();
    }

    /**
     * 初始化组件
     */
    public async init(): Promise<void> {
        console.log(`[${this.constructor.name}] 初始化组件...`);
        this.createElement();
        this.bindEvents();
        await this.loadResources();
        console.log(`[${this.constructor.name}] 组件初始化完成`);
    }

    /**
     * 创建DOM元素
     */
    protected abstract createElement(): void;

    /**
     * 绑定事件监听器
     */
    protected abstract bindEvents(): void;

    /**
     * 加载资源
     */
    protected async loadResources(): Promise<void> {
        // 默认空实现，子类可以重写
    }

    /**
     * 更新组件
     */
    public update(): void {
        if (this.state.visible && this.element) {
            this.render();
        }
    }

    /**
     * 渲染组件内容
     */
    protected abstract render(): void;

    /**
     * 显示组件
     */
    public show(): void {
        if (this.element) {
            this.element.style.display = 'block';
            this.state.visible = true;
            this.render();
            // 淡入动画
            this.animationManager.fadeIn(this.element);
        }
    }

    /**
     * 隐藏组件
     */
    public async hide(): Promise<void> {
        if (this.element) {
            // 淡出动画
            await this.animationManager.fadeOut(this.element);
            this.element.style.display = 'none';
            this.state.visible = false;
        }
    }

    /**
     * 设置组件数据
     */
    public setData(data: any): void {
        this.state.data = data;
        this.requestUpdate();
    }

    /**
     * 请求更新
     */
    protected requestUpdate(): void {
        if (!this.updatePending) {
            this.updatePending = true;
            requestAnimationFrame(() => {
                this.update();
                this.updatePending = false;
            });
        }
    }

    /**
     * 获取组件状态
     */
    public getState(): ComponentState {
        return { ...this.state };
    }

    /**
     * 销毁组件
     */
    public destroy(): void {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.state.data = null;
        console.log(`[${this.constructor.name}] 组件已销毁`);
    }

    /**
     * 播放动画
     */
    protected playAnimation(animationName: string, duration: number = 300): Promise<void> {
        return new Promise((resolve) => {
            if (this.element) {
                this.element.classList.add(animationName);
                setTimeout(() => {
                    if (this.element) {
                        this.element.classList.remove(animationName);
                    }
                    resolve();
                }, duration);
            } else {
                resolve();
            }
        });
    }

    /**
     * 显示错误消息
     */
    protected showError(message: string): void {
        console.error(`[${this.constructor.name}] 错误:`, message);
        // TODO: 实现错误提示UI
    }

    /**
     * 显示成功消息
     */
    protected showSuccess(message: string): void {
        console.log(`[${this.constructor.name}] 成功:`, message);
        // TODO: 实现成功提示UI
    }
}