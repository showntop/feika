/**
 * 剧情对话框组件
 * 显示角色对话和剧情内容
 */

import { BaseComponent } from './BaseComponent';

interface DialogueLine {
    speaker: string;
    text: string;
    expression?: string;
}

interface StoryEvent {
    id: string;
    title: string;
    dialogues: DialogueLine[];
}

export class StoryDialog extends BaseComponent {
    private currentEvent: StoryEvent | null = null;
    private currentDialogueIndex: number = 0;
    private isTyping: boolean = false;
    private typewriterTimeout: any = null;
    private currentText: string = '';
    private targetText: string = '';
    private charIndex: number = 0;

    // UI元素
    private dialogContainer: HTMLElement | null = null;
    private speakerElement: HTMLElement | null = null;
    private textElement: HTMLElement | null = null;
    private nextButton: HTMLElement | null = null;
    private skipButton: HTMLElement | null = null;
    private progressBar: HTMLElement | null = null;

    protected createElement(): void {
        this.element = document.createElement('div');
        this.element.className = 'story-dialog';
        this.element.innerHTML = `
            <div class="dialog-overlay">
                <div class="dialog-container">
                    <div class="dialog-header">
                        <h3 class="dialog-title" id="dialogTitle">剧情</h3>
                        <button class="dialog-close" id="dialogClose">✕</button>
                    </div>
                    <div class="dialog-content">
                        <div class="dialog-scene">
                            <div class="character-avatar" id="characterAvatar">
                                <div class="avatar-placeholder">👤</div>
                            </div>
                            <div class="dialog-text-area">
                                <div class="speaker-name" id="speakerName">角色名</div>
                                <div class="dialog-text" id="dialogText">对话内容...</div>
                            </div>
                        </div>
                    </div>
                    <div class="dialog-footer">
                        <div class="progress-container">
                            <div class="progress-bar" id="progressBar">
                                <div class="progress-fill" id="progressFill"></div>
                            </div>
                            <div class="progress-text" id="progressText">1/5</div>
                        </div>
                        <div class="dialog-controls">
                            <button class="control-btn skip-btn" id="skipBtn">跳过 (S)</button>
                            <button class="control-btn next-btn" id="nextBtn">继续 ▶</button>
                        </div>
                    </div>
                </div>
            </div>
            <style>
                .story-dialog {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 1000;
                    display: none;
                }

                .dialog-overlay {
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(8px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    animation: fadeIn 0.3s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .dialog-container {
                    width: 90%;
                    max-width: 800px;
                    max-height: 80vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: slideUp 0.4s ease-out;
                }

                @keyframes slideUp {
                    from {
                        transform: translateY(50px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                .dialog-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 25px;
                    background: rgba(0, 0, 0, 0.2);
                    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
                }

                .dialog-title {
                    margin: 0;
                    font-size: 24px;
                    font-weight: bold;
                    color: #ffffff;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                }

                .dialog-close {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    background: rgba(255, 255, 255, 0.1);
                    color: #ffffff;
                    font-size: 20px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .dialog-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: rotate(90deg);
                }

                .dialog-content {
                    flex: 1;
                    padding: 30px 25px;
                    overflow-y: auto;
                    background: rgba(0, 0, 0, 0.1);
                }

                .dialog-scene {
                    display: flex;
                    gap: 25px;
                    align-items: flex-start;
                    min-height: 200px;
                }

                .character-avatar {
                    flex-shrink: 0;
                    width: 120px;
                    height: 120px;
                    border-radius: 15px;
                    background: rgba(255, 255, 255, 0.2);
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    animation: float 3s ease-in-out infinite;
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                .avatar-placeholder {
                    font-size: 50px;
                }

                .dialog-text-area {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .speaker-name {
                    font-size: 18px;
                    font-weight: bold;
                    color: #ffd700;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                    padding: 8px 15px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 10px;
                    display: inline-block;
                }

                .dialog-text {
                    flex: 1;
                    font-size: 16px;
                    line-height: 1.8;
                    color: #ffffff;
                    padding: 20px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 15px;
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    min-height: 100px;
                    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
                }

                .dialog-footer {
                    padding: 20px 25px;
                    background: rgba(0, 0, 0, 0.2);
                    border-top: 2px solid rgba(255, 255, 255, 0.1);
                }

                .progress-container {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 20px;
                }

                .progress-bar {
                    flex: 1;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #ffd700, #ffed4e);
                    border-radius: 4px;
                    transition: width 0.3s ease;
                }

                .progress-text {
                    font-size: 14px;
                    color: #ffffff;
                    font-weight: bold;
                    min-width: 50px;
                    text-align: right;
                }

                .dialog-controls {
                    display: flex;
                    gap: 15px;
                    justify-content: flex-end;
                }

                .control-btn {
                    padding: 12px 25px;
                    font-size: 16px;
                    font-weight: bold;
                    color: #ffffff;
                    background: rgba(255, 255, 255, 0.1);
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .control-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                }

                .control-btn:active {
                    transform: translateY(0);
                }

                .next-btn {
                    background: linear-gradient(135deg, #ffd700, #ffed4e);
                    color: #000;
                    border: none;
                }

                .next-btn:hover {
                    background: linear-gradient(135deg, #ffed4e, #ffd700);
                }

                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }

                .cursor-blink::after {
                    content: '|';
                    animation: blink 1s infinite;
                }
            </style>
        `;

        // 初始化UI元素引用
        this.initializeElements();
    }

    protected bindEvents(): void {
        if (!this.element) return;

        // 绑定关闭按钮
        const closeBtn = this.element.querySelector('#dialogClose') as HTMLElement;
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // 绑定继续按钮
        const nextBtn = this.element.querySelector('#nextBtn') as HTMLElement;
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.handleNext());
        }

        // 绑定跳过按钮
        const skipBtn = this.element.querySelector('#skipBtn') as HTMLElement;
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.handleSkip());
        }

        // 键盘快捷键
        document.addEventListener('keydown', (e: any) => this.handleKeyPress(e));
    }

    private initializeElements(): void {
        if (!this.element) return;

        this.dialogContainer = this.element.querySelector('.dialog-container') as HTMLElement;
        this.speakerElement = this.element.querySelector('#speakerName') as HTMLElement;
        this.textElement = this.element.querySelector('#dialogText') as HTMLElement;
        this.nextButton = this.element.querySelector('#nextBtn') as HTMLElement;
        this.skipButton = this.element.querySelector('#skipBtn') as HTMLElement;
        this.progressBar = this.element.querySelector('#progressFill') as HTMLElement;
    }

    protected render(): void {
        if (!this.currentEvent || !this.element) return;

        // 更新标题
        const titleElement = this.element.querySelector('#dialogTitle') as HTMLElement;
        if (titleElement) {
            titleElement.textContent = this.currentEvent.title;
        }

        // 显示当前对话
        this.showCurrentDialogue();
    }

    public showDialog(eventData: any): void {
        console.log('[StoryDialog] 显示剧情事件:', eventData);
        this.currentEvent = eventData;
        this.currentDialogueIndex = 0;
        this.render();
        super.show();
    }

    public async hide(): Promise<void> {
        // 停止打字效果
        this.stopTypewriter();
        await super.hide();
    }

    private showCurrentDialogue(): void {
        if (!this.currentEvent || this.currentDialogueIndex >= this.currentEvent.dialogues.length) {
            return;
        }

        const dialogue = this.currentEvent.dialogues[this.currentDialogueIndex];

        // 更新说话者
        if (this.speakerElement) {
            this.speakerElement.textContent = dialogue.speaker;
        }

        // 更新角色头像（根据说话者）
        this.updateAvatar(dialogue.speaker);

        // 开始打字效果
        this.startTypewriter(dialogue.text);

        // 更新进度条
        this.updateProgress();
    }

    private updateAvatar(speaker: string): void {
        if (!this.element) return;

        const avatarElement = this.element.querySelector('#characterAvatar') as HTMLElement;
        if (!avatarElement) return;

        // 根据说话者设置不同的头像
        const avatars: { [key: string]: string } = {
            '你': '👤',
            '系统': '⚙️',
            '顾客': '👨',
            'VIP顾客': '🤵',
            '名人': '⭐'
        };

        const avatar = avatars[speaker] || '👤';
        avatarElement.innerHTML = `<div class="avatar-placeholder">${avatar}</div>`;
    }

    private startTypewriter(text: string): void {
        this.targetText = text;
        this.charIndex = 0;
        this.currentText = '';
        this.isTyping = true;

        if (this.textElement) {
            this.textElement.classList.add('cursor-blink');
            this.textElement.textContent = '';
        }

        this.typeNextChar();
    }

    private typeNextChar(): void {
        if (!this.isTyping || this.charIndex >= this.targetText.length) {
            this.isTyping = false;
            if (this.textElement) {
                this.textElement.classList.remove('cursor-blink');
            }
            return;
        }

        this.currentText += this.targetText[this.charIndex];
        if (this.textElement) {
            this.textElement.textContent = this.currentText;
        }

        this.charIndex++;
        this.typewriterTimeout = setTimeout(() => this.typeNextChar(), 30);
    }

    private stopTypewriter(): void {
        if (this.typewriterTimeout) {
            clearTimeout(this.typewriterTimeout);
            this.typewriterTimeout = null;
        }
        this.isTyping = false;

        // 立即显示完整文本
        if (this.textElement) {
            this.textElement.textContent = this.targetText;
            this.textElement.classList.remove('cursor-blink');
        }
        this.currentText = this.targetText;
        this.charIndex = this.targetText.length;
    }

    private updateProgress(): void {
        if (!this.currentEvent || !this.progressBar) return;

        const total = this.currentEvent.dialogues.length;
        const current = this.currentDialogueIndex + 1;
        const percentage = (current / total) * 100;

        this.progressBar.style.width = `${percentage}%`;

        const progressText = this.element?.querySelector('#progressText') as HTMLElement;
        if (progressText) {
            progressText.textContent = `${current}/${total}`;
        }
    }

    public nextDialogue(): boolean {
        if (!this.currentEvent) return false;

        this.currentDialogueIndex++;

        if (this.currentDialogueIndex >= this.currentEvent.dialogues.length) {
            // 对话结束
            return false;
        }

        this.showCurrentDialogue();
        return true;
    }

    private handleNext(): void {
        if (this.isTyping) {
            // 如果正在打字，立即显示完整文本
            this.stopTypewriter();
        } else {
            // 否则进入下一段对话
            const hasNext = this.nextDialogue();
            if (!hasNext) {
                this.hide();
            }
        }
    }

    private handleSkip(): void {
        // 直接触发跳过事件
        const eventManager = (window as any).eventManager;
        if (eventManager) {
            eventManager.emit('ui_dialog_skip', {});
        }
        this.hide();
    }

    private handleKeyPress(e: any): void {
        if (!this.element || this.element.style.display === 'none') return;

        switch (e.key) {
            case 'Enter':
            case ' ':
                this.handleNext();
                break;
            case 's':
            case 'S':
                this.handleSkip();
                break;
            case 'Escape':
                this.hide();
                break;
        }
    }
}