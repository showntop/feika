# 重返2010：我的第一桶金

这是一个重新写起的 Cocos Creator + 微信小游戏 MVP。

当前版本优先验证第 1 晚 10 分钟核心循环：

- 7x7 合成盘
- 商品、资金、人情三条合成链
- 顾客订单真实消耗盘面物品
- 现金、体力、口碑、人脉资源
- 重生开场、住院押金、催债、夜市口、小推车、第一次打脸
- 微信激励视频补体力接口占位

## 运行

1. 用 Cocos Creator 3.8.x 打开仓库根目录。
2. 打开 `assets/scenes/Main.scene`。
3. 点击预览。

主玩法脚本在 `assets/scripts/TenMinuteGame.ts`。场景里只保留一个 `Canvas`，UI 和游戏节点由脚本生成。

## 构建微信小游戏

1. Cocos Creator 构建发布。
2. 平台选「微信小游戏」。
3. 把 AppID 从 `touristappid` 换成你的正式 AppID。
4. 构建后用微信开发者工具打开输出目录。

更多细节见 `docs/COCOS_WECHAT_RUNBOOK.md`。
