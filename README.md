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
 * 根据项目模板创建新项目
 * @param {string}  --oldsuffix 旧的项目主键
 * @param {string}  --oldogameid 旧的项目id
 * @param {string}  --newsuffix 新的项目主键
 * @param {string}  --newgameid 新的项目id
 * 工作流程：
 * 1. 拉取slots，重命名为game_新的项目id
 * 2. 拷贝旧项目子游戏包到新项目   
 * 3. 删除多余目录(包括bundleSlotFrame&bundleZmBase)
 * 4. 添加公共子模块（bundleSlotFrame&bundleZmBase）到主仓库
 * 5. 批量修改子包所有文件与文件夹键值（此处可能出在骨骼json被修改，所有出图让特效导出二进制）
 * 6. 修改GameConfig.ts文件的主键与游戏id
 * 7. 修改panel${newSuffix}.prefab文件
 * 8. 修改资源UUID，保证关联不丢失
 * 9. 安装pako依赖
 * 10. 初始化git子仓库并推送到远程仓库
 */
gulp new --ChargeBuffaloAscent --100042 --TestGame --1000001


/**
 * 自动更新启动项目 
 * @param {string}  --gameid 项目id
 * 功能说明：
 * 1. 同步拉取slots主仓库最新代码（git pull）
 * 2. 覆盖以下文件和目录到目标项目：
 *    - build-templates（排除index_bg.jpg）
 *    - preview-templates
 *    - assets/libs
 *    - assets/res
 *    - assets/scripts（排除gameConfig.ts）
 *    - assets/mainGame.fire 及其.meta文件
 * 注意：会无脑覆盖子项目本地文件，请先备份重要文件！
 * @example gulp updateStartLib --1000001
 */
gulp updateStartLib --1000001


/**
 * 更新最新公共库子模块
 * @param {string}  --gameid 项目id
 * 功能说明：
 * 1. 同步拉取bundleSlotFrame仓库最新代码
 * 2. 同步拉取bundleZmBase仓库最新代码
 * @example gulp updateSlotLib --1000001
 */
gulp updateSlotLib --1000001


/**
 * 压缩项目资源（支持三种模式）
 * 
 * 模式1 - 项目ID模式：
 * @param {string}  --gameid 项目id
 * @example gulp tinypng --game_1000001
 * 
 * 模式2 - 目录压缩模式：
 * @param {string}  --path=目录路径 指定要压缩的目录
 * @example gulp tinypng --path=E:/projects/game_1000001/assets
 * @example gulp tinypng --path=../game_1000001/assets
 * 
 * 模式3 - 单文件压缩模式：
 * @param {string}  --path=文件路径 指定要压缩的单个图片文件
 * @example gulp tinypng --path=E:/projects/image.jpg
 * @example gulp tinypng --path=../game_100042/assets/bundleGame/sprites/bg/image.jpg
 * 
 * 功能说明：
 * 1. 扫描目标目录或文件
 * 2. 查找所有 .jpg 和 .png 图片文件（目录模式）
 * 3. 通过TinyPNG API压缩图片（10KB~5MB范围）
 * 4. 使用随机IP绕过上传数量限制
 * 5. 自动排除bg_blur目录模糊图
 * 6. 压缩后直接覆盖原文件
 * 
 * 注意：需要网络连接，压缩速度受网络影响，建议先备份重要文件！
 */
gulp tinypng --game_1000001 --dir=assets //指定项目并压缩assets目录
gulp tinypng --game_1000001 --dir=build/web-mobile //指定项目并压缩build/web-mobile目录
gulp tinypng --game_1000001 --dir=assets/images/ui //指定项目并压缩子目录
gulp tinypng --path=E:/projects/game_1000001/assets // 支持绝对路径（目录）
gulp tinypng --path=../game_1000001/assets // 支持相对路径（目录）
gulp tinypng --path=E:/projects/image.jpg // 支持绝对路径单文件压缩
gulp tinypng --path=../game_100042/assets/bundleGame/sprites/bg/image.jpg // 支持相对路径单文件压缩

mac 可直接执行：
./tinypng.sh 100042
./tinypng.sh 100042 assets
./tinypng.sh --path=../game_100042/assets

/**
 * 资源加密
 * @param {string}  --MoneyComing 项目名
 * @example 
 */
gulp encryptImage --MoneyComing

/**
 * 导表命令(doc/配置表/languageCfg_多语言表.xlsx)去svn上去更新最新的表格放到这个位置
 * 用法：
 *   gulp cli --game_100042
 *   gulp cli --game=100042
 *   gulp cli --gameid=100042
 *   ./cli.sh 100042
 *   ./cli.sh game_100042
 */
gulp cli --game_100042

mac 可直接执行：
./cli.sh 100042
```




