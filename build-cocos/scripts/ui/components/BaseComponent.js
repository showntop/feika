/**
 * UI基础组件类
 * 所有UI组件的基类，提供通用功能
 */
import { AnimationManager } from '../AnimationManager';
import { ResponsiveManager } from '../ResponsiveManager';
/**
 * UI基础组件类
 */
export class BaseComponent {
    constructor() {
        this.element = null;
        this.updatePending = false;
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
    async init() {
        console.log(`[${this.constructor.name}] 初始化组件...`);
        this.createElement();
        this.bindEvents();
        await this.loadResources();
        console.log(`[${this.constructor.name}] 组件初始化完成`);
    }
    /**
     * 加载资源
     */
    async loadResources() {
        // 默认空实现，子类可以重写
    }
    /**
     * 更新组件
     */
    update() {
        if (this.state.visible && this.element) {
            this.render();
        }
    }
    /**
     * 显示组件
     */
    show() {
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
    async hide() {
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
    setData(data) {
        this.state.data = data;
        this.requestUpdate();
    }
    /**
     * 请求更新
     */
    requestUpdate() {
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
    getState() {
        return { ...this.state };
    }
    /**
     * 销毁组件
     */
    destroy() {
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
    playAnimation(animationName, duration = 300) {
        return new Promise((resolve) => {
            if (this.element) {
                this.element.classList.add(animationName);
                setTimeout(() => {
                    if (this.element) {
                        this.element.classList.remove(animationName);
                    }
                    resolve();
                }, duration);
            }
            else {
                resolve();
            }
        });
    }
    /**
     * 显示错误消息
     */
    showError(message) {
        console.error(`[${this.constructor.name}] 错误:`, message);
        // TODO: 实现错误提示UI
    }
    /**
     * 显示成功消息
     */
    showSuccess(message) {
        console.log(`[${this.constructor.name}] 成功:`, message);
        // TODO: 实现成功提示UI
    }
}
//# sourceMappingURL=BaseComponent.js.map