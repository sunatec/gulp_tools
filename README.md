# gulp_tools
gulp_tools自动化管理


## 安装 gulp 命令行工具
- node版本：[nodejs v22.10.0](https://nodejs.org/dist/)
1. 全局安装gulp 与依赖
```
npm install gulp -g
npm i
```


## 使用
``` js
/**
 * 资源加密
 * @param {string}  --MoneyComing 项目名
 */
gulp encryptImage --MoneyComing

/**
 * 根据项目模板创建新项目
 * @param {string}  --oldsuffix 旧的项目主键
 * @param {string}  --oldogameid 旧的项目id
 * @param {string}  --newsuffix 新的项目主键
 * @param {string}  --newgameid 新的项目id
 * @param {string}  --y 可选，是否初始化git子仓库，默认为空
 * 工作流程：
 * 1. 拉取TESTGAME，重命名为game_新的项目id
 * 2. 子模块更新
 * 3. 拷贝旧项目子游戏包到新项目
 * 4. 批量修改子包所有文件与文件夹键值（此处可能出在骨骼json被修改，所有出图让特效导出二进制）
 * 5. 修改GameConfig.ts文件的主键与游戏id
 * 6. 删除多余目录
 * 7. 安装pako依赖
 * 8. 初始化git子仓库，必须在git有仓库（可选，未测）
 */
gulp new --RomaX --100055 --CandyBaby --100048


/**
 * 自动更新启动项目
 * @param {string}  --gameid 项目id
 * TESTGAME/game_xxxxxx/gulp_tools同一级目录 会无脑覆盖，请先备份，主要忽略index_bg.jpg与gameConfig.ts
 * @example gulp updateStartLib --100048
 */
gulp updateStartLib --100048


/**
 * 资源加密
 * @param {string}  --MoneyComing 项目名
 * @example 
 */
gulp encryptImage --MoneyComing
```




