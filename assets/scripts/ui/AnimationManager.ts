/**
 * 动画管理器
 * 统一管理UI动画效果和过渡
 */

export interface AnimationConfig {
    duration?: number;
    easing?: string;
    delay?: number;
    iterations?: number;
    direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
    fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

export interface TransitionConfig {
    property?: string;
    duration?: number;
    timingFunction?: string;
    delay?: number;
}

export class AnimationManager {
    private static instance: AnimationManager;
    private activeAnimations: Map<string, Animation> = new Map();

    private constructor() {}

    public static getInstance(): AnimationManager {
        if (!AnimationManager.instance) {
            AnimationManager.instance = new AnimationManager();
        }
        return AnimationManager.instance;
    }

    /**
     * 淡入动画
     */
    public fadeIn(element: HTMLElement, config: AnimationConfig = {}): Promise<void> {
        const defaultConfig: AnimationConfig = {
            duration: 300,
            easing: 'ease-out',
            fillMode: 'forwards',
            ...config
        };

        return this.animate(element, [
            { opacity: 0, transform: 'translateY(-10px)' },
            { opacity: 1, transform: 'translateY(0)' }
        ], defaultConfig);
    }

    /**
     * 淡出动画
     */
    public fadeOut(element: HTMLElement, config: AnimationConfig = {}): Promise<void> {
        const defaultConfig: AnimationConfig = {
            duration: 300,
            easing: 'ease-in',
            fillMode: 'forwards',
            ...config
        };

        return this.animate(element, [
            { opacity: 1 },
            { opacity: 0 }
        ], defaultConfig);
    }

    /**
     * 缩放动画
     */
    public scale(element: HTMLElement, fromScale: number, toScale: number, config: AnimationConfig = {}): Promise<void> {
        const defaultConfig: AnimationConfig = {
            duration: 300,
            easing: 'ease-out',
            fillMode: 'forwards',
            ...config
        };

        return this.animate(element, [
            { transform: `scale(${fromScale})` },
            { transform: `scale(${toScale})` }
        ], defaultConfig);
    }

    /**
     * 滑动动画
     */
    public slide(element: HTMLElement, direction: 'up' | 'down' | 'left' | 'right', distance: number, config: AnimationConfig = {}): Promise<void> {
        const transforms = {
            up: ['translateY(0)', 'translateY(-' + distance + 'px)'],
            down: ['translateY(0)', 'translateY(' + distance + 'px)'],
            left: ['translateX(0)', 'translateX(-' + distance + 'px)'],
            right: ['translateX(0)', 'translateX(' + distance + 'px)']
        };

        const defaultConfig: AnimationConfig = {
            duration: 300,
            easing: 'ease-out',
            fillMode: 'forwards',
            ...config
        };

        return this.animate(element, [
            { transform: transforms[direction][0] },
            { transform: transforms[direction][1] }
        ], defaultConfig);
    }

    /**
     * 旋转动画
     */
    public rotate(element: HTMLElement, fromDeg: number, toDeg: number, config: AnimationConfig = {}): Promise<void> {
        const defaultConfig: AnimationConfig = {
            duration: 300,
            easing: 'ease-out',
            fillMode: 'forwards',
            ...config
        };

        return this.animate(element, [
            { transform: `rotate(${fromDeg}deg)` },
            { transform: `rotate(${toDeg}deg)` }
        ], defaultConfig);
    }

    /**
     * 脉冲动画
     */
    public pulse(element: HTMLElement, config: AnimationConfig = {}): Promise<void> {
        const defaultConfig: AnimationConfig = {
            duration: 500,
            easing: 'ease-in-out',
            iterations: 1,
            fillMode: 'forwards',
            ...config
        };

        return this.animate(element, [
            { transform: 'scale(1)' },
            { transform: 'scale(1.1)' },
            { transform: 'scale(1)' }
        ], defaultConfig);
    }

    /**
     * 弹跳动画
     */
    public bounce(element: HTMLElement, config: AnimationConfig = {}): Promise<void> {
        const defaultConfig: AnimationConfig = {
            duration: 600,
            easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            iterations: 1,
            fillMode: 'forwards',
            ...config
        };

        return this.animate(element, [
            { transform: 'scale(1, 1)' },
            { transform: 'scale(1.25, 0.75)' },
            { transform: 'scale(0.75, 1.25)' },
            { transform: 'scale(1.15, 0.85)' },
            { transform: 'scale(0.95, 1.05)' },
            { transform: 'scale(1.05, 0.95)' },
            { transform: 'scale(1, 1)' }
        ], defaultConfig);
    }

    /**
     * 抖动动画
     */
    public shake(element: HTMLElement, config: AnimationConfig = {}): Promise<void> {
        const defaultConfig: AnimationConfig = {
            duration: 500,
            easing: 'ease-in-out',
            iterations: 1,
            fillMode: 'forwards',
            ...config
        };

        return this.animate(element, [
            { transform: 'translateX(0)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' },
            { transform: 'translateX(0)' }
        ], defaultConfig);
    }

    /**
     * 闪烁动画
     */
    public flash(element: HTMLElement, config: AnimationConfig = {}): Promise<void> {
        const defaultConfig: AnimationConfig = {
            duration: 500,
            easing: 'ease-in-out',
            iterations: 3,
            fillMode: 'forwards',
            ...config
        };

        return this.animate(element, [
            { opacity: 1 },
            { opacity: 0.2 },
            { opacity: 1 }
        ], defaultConfig);
    }

    /**
     * 边框发光动画
     */
    public glow(element: HTMLElement, color: string = '#ffd700', config: AnimationConfig = {}): Promise<void> {
        const defaultConfig: AnimationConfig = {
            duration: 1000,
            easing: 'ease-in-out',
            iterations: 3,
            fillMode: 'forwards',
            ...config
        };

        return this.animate(element, [
            { boxShadow: '0 0 5px ' + color },
            { boxShadow: '0 0 20px ' + color + ', 0 0 30px ' + color },
            { boxShadow: '0 0 5px ' + color }
        ], defaultConfig);
    }

    /**
     * 数字递增动画
     */
    public countUp(element: HTMLElement, targetValue: number, duration: number = 1000): Promise<void> {
        return new Promise((resolve) => {
            const startValue = 0;
            const startTime = performance.now();

            const updateCount = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // 缓动函数
                const easedProgress = 1 - Math.pow(1 - progress, 3);

                const currentValue = Math.floor(startValue + (targetValue - startValue) * easedProgress);
                element.textContent = currentValue.toLocaleString();

                if (progress < 1) {
                    requestAnimationFrame(updateCount);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(updateCount);
        });
    }

    /**
     * 进度条动画
     */
    public progressFill(element: HTMLElement, targetPercent: number, duration: number = 500): Promise<void> {
        return new Promise((resolve) => {
            const startPercent = 0;
            const startTime = performance.now();

            const updateProgress = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // 缓动函数
                const easedProgress = 1 - Math.pow(1 - progress, 2);

                const currentPercent = startPercent + (targetPercent - startPercent) * easedProgress;
                element.style.width = currentPercent + '%';

                if (progress < 1) {
                    requestAnimationFrame(updateProgress);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(updateProgress);
        });
    }

    /**
     * 添加过渡效果
     */
    public addTransition(element: HTMLElement, config: TransitionConfig = {}): void {
        const defaultConfig: TransitionConfig = {
            property: 'all',
            duration: 300,
            timingFunction: 'ease',
            delay: 0,
            ...config
        };

        element.style.transition = `${defaultConfig.property} ${defaultConfig.duration}ms ${defaultConfig.timingFunction} ${defaultConfig.delay}ms`;
    }

    /**
     * 移除过渡效果
     */
    public removeTransition(element: HTMLElement): void {
        element.style.transition = '';
    }

    /**
     * 执行自定义动画
     */
    private animate(element: HTMLElement, keyframes: KeyFrame[], config: AnimationConfig): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const animation = element.animate(keyframes, {
                    duration: config.duration || 300,
                    easing: config.easing || 'ease',
                    delay: config.delay || 0,
                    iterations: config.iterations || 1,
                    direction: config.direction || 'normal',
                    fill: config.fillMode || 'none'
                });

                const animationId = `${element.id}_${Date.now()}`;
                this.activeAnimations.set(animationId, animation);

                animation.onfinish = () => {
                    this.activeAnimations.delete(animationId);
                    resolve();
                };

                animation.oncancel = () => {
                    this.activeAnimations.delete(animationId);
                    reject(new Error('Animation cancelled'));
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 取消所有活动动画
     */
    public cancelAllAnimations(): void {
        this.activeAnimations.forEach(animation => animation.cancel());
        this.activeAnimations.clear();
    }

    /**
     * 创建序列动画
     */
    public async sequence(animations: Array<() => Promise<void>>): Promise<void> {
        for (const animation of animations) {
            await animation();
        }
    }

    /**
     * 创建并行动画
     */
    public async parallel(animations: Array<() => Promise<void>>): Promise<void> {
        await Promise.all(animations.map(animation => animation()));
    }

    /**
     * 创建错开动画
     */
    public async stagger(animations: Array<() => Promise<void>>, delay: number = 100): Promise<void> {
        const promises = animations.map((animation, index) =>
            new Promise(resolve =>
                setTimeout(async () => {
                    await animation();
                    resolve(undefined);
                }, index * delay)
            )
        );

        await Promise.all(promises);
    }
}