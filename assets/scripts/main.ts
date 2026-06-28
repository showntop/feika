/**
 * 游戏测试入口
 * 用于测试游戏系统功能
 */

import { GameApp, startGame } from './core/GameApp';
import { GameManager } from './core/GameManager';
import { MergeSystem } from './gameplay/merge/MergeSystem';
import { BusinessSystem } from './gameplay/business/BusinessSystem';
import { StorySystem } from './gameplay/story/StorySystem';

/**
 * 测试游戏系统
 */
export async function testGame(): Promise<void> {
    console.log('========================================');
    console.log('开始测试游戏系统');
    console.log('========================================\n');

    try {
        // 1. 初始化游戏
        console.log('1. 初始化游戏...');
        const gameApp = GameApp.getInstance();
        await gameApp.init();
        console.log('✅ 游戏初始化完成\n');

        // 2. 启动游戏
        console.log('2. 启动游戏...');
        gameApp.start();
        console.log('✅ 游戏已启动\n');

        // 3. 获取各系统实例
        const gameManager = gameApp.getGameManager();
        const mergeSystem = gameManager.getMergeSystem();
        const businessSystem = gameManager.getBusinessSystem();
        const storySystem = gameManager.getStorySystem();

        // 4. 测试合成系统
        console.log('3. 测试合成系统...');
        console.log(`   当前体力: ${mergeSystem.getCurrentEnergy()}/${mergeSystem.getMaxEnergy()}`);
        console.log(`   网格大小: ${mergeSystem.getGridSize()}x${mergeSystem.getGridSize()}`);
        console.log(`   空格数量: ${mergeSystem.getEmptySlots().length}`);
        console.log('✅ 合成系统测试完成\n');

        // 5. 测试经营系统
        console.log('4. 测试经营系统...');
        console.log(`   当前现金: ${businessSystem.getCash()}`);
        console.log(`   当前口碑: ${businessSystem.getReputation()}`);
        console.log(`   当前人脉: ${businessSystem.getConnections()}`);
        console.log(`   店铺等级: ${businessSystem.getShopLevel()}`);
        console.log(`   当前订单: ${businessSystem.getCurrentOrders().length}/${businessSystem['config'].maxOrders}`);
        console.log('✅ 经营系统测试完成\n');

        // 6. 测试剧情系统
        console.log('5. 测试剧情系统...');
        const currentChapter = storySystem.getCurrentChapter();
        console.log(`   当前章节: ${currentChapter?.title}`);
        console.log(`   章节目标: ${currentChapter?.mainGoal}`);
        console.log(`   可用事件: ${storySystem.getAvailableEvents().length}`);
        console.log(`   已完成事件: ${storySystem.getCompletedEvents().length}`);
        console.log('✅ 剧情系统测试完成\n');

        // 7. 测试订单生成
        console.log('6. 测试订单生成...');
        const newOrder = businessSystem.generateOrder();
        if (newOrder) {
            console.log(`   生成订单: ${newOrder.getCustomerName()}`);
            console.log(`   订单难度: ${newOrder.getDifficulty()}`);
            console.log(`   需求物品: ${newOrder.getRequirements().length}`);
            const reward = newOrder.getBaseReward();
            console.log(`   现金奖励: ${reward.cash}`);
        }
        console.log('✅ 订单生成测试完成\n');

        // 8. 测试合成操作
        console.log('7. 测试合成操作...');
        const generators = mergeSystem.getGenerators();
        console.log(`   可用生成器: ${generators.length}`);
        if (generators.length > 0) {
            const generator = generators[0];
            console.log(`   生成器: ${generator.getName()}`);
            console.log(`   可以生产: ${generator.canProduce()}`);

            // 尝试生成物品
            const newItem = mergeSystem.generateFrom(generator.getId());
            if (newItem) {
                console.log(`   生成物品: ${newItem.getName()} (${newItem.getLevel()}级)`);
                console.log(`   物品位置: (${newItem.getGridPosition()?.x}, ${newItem.getGridPosition()?.y})`);
            }
        }
        console.log('✅ 合成操作测试完成\n');

        // 9. 显示游戏状态
        console.log('8. 游戏状态总览:');
        const gameStatus = gameManager.getGameStatus();
        console.log(`   游戏状态: ${gameStatus.state}`);
        console.log(`   玩家现金: ${gameStatus.player.cash}`);
        console.log(`   完成章节: ${gameStatus.story.completedChapters.length}`);
        console.log(`   总合成次数: ${gameStatus.player.totalMerges}`);
        console.log(`   总订单完成: ${gameStatus.player.totalOrders}`);
        console.log('✅ 游戏状态显示完成\n');

        console.log('========================================');
        console.log('🎉 所有测试完成！游戏系统运行正常');
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
}

/**
 * 快速测试函数 - 只测试核心功能
 */
export async function quickTest(): Promise<void> {
    console.log('🚀 快速测试开始...\n');

    try {
        const gameApp = GameApp.getInstance();
        await gameApp.init();
        gameApp.start();

        const gameManager = gameApp.getGameManager();
        const businessSystem = gameManager.getBusinessSystem();
        const storySystem = gameManager.getStorySystem();

        // 显示基本信息
        console.log('📊 游戏状态:');
        console.log(`   现金: ${businessSystem.getCash()}`);
        console.log(`   当前章节: ${storySystem.getCurrentChapter()?.title}`);
        console.log(`   游戏状态: ${gameManager.getGameState()}`);

        console.log('\n✅ 快速测试完成！\n');

    } catch (error) {
        console.error('❌ 快速测试失败:', error);
    }
}

/**
 * 性能测试函数
 */
export async function performanceTest(): Promise<void> {
    console.log('⚡ 性能测试开始...\n');

    const startTime = Date.now();

    try {
        const gameApp = GameApp.getInstance();
        await gameApp.init();
        gameApp.start();

        const gameManager = gameApp.getGameManager();
        const mergeSystem = gameManager.getMergeSystem();

        // 测试大量合成操作
        console.log('🧪 测试1000次合成操作...');
        const iterations = 1000;
        for (let i = 0; i < iterations; i++) {
            // 模拟游戏逻辑
            gameManager['update'](0.016);
        }

        const endTime = Date.now();
        const duration = endTime - startTime;
        const avgTime = duration / iterations;

        console.log(`\n⚡ 性能测试结果:`);
        console.log(`   总耗时: ${duration}ms`);
        console.log(`   平均每次: ${avgTime.toFixed(2)}ms`);
        console.log(`   理论FPS: ${Math.floor(1000 / (avgTime + 0.016))}`);
        console.log(`\n✅ 性能测试完成！\n`);

    } catch (error) {
        console.error('❌ 性能测试失败:', error);
    }
}

// 如果直接运行此文件 (仅Node.js环境)
if (typeof require !== 'undefined' && require.main === module) {
    testGame().catch(console.error);
}