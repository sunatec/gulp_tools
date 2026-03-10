/**
 * 根据项目模板创建新项目
 * @param {string}  --oldsuffix 旧的项目主键
 * @param {string}  --oldogameid 旧的项目id
 * @param {string}  --newsuffix 新的项目主键
 * @param {string}  --newgameid 新的项目id
 * @example new --ChargeBuffaloAscent --100042 --TestGame --1000001
 */
exports.new = require("./common/newTask");

/**
 * 自动更新启动项目
 * @param {string}  --gameid 项目id
 * slots/game_xxxxxx/gulp_tools同一级目录 会无脑覆盖子项目本地文件，请先备份重要文件！
 * @example gulp updateStartLib --1000001
 */
exports.updateStartLib = require("./common/updateStartLib");

/**
 * 自动更新slot与base库
 * @param {string}  --gameid 项目id
 * slots/game_xxxxxx/gulp_tools同一级目录 会无脑覆盖，请先备份
 * @example gulp updateSlotLib --1000001
 */
exports.updateSlotLib = require("./common/updateSlotLib");

/**
 * 压缩项目资源（支持三种模式）
 * 模式1 - 项目ID：@param {string}  --gameid 项目id
 * 模式2 - 目录压缩：@param {string}  --path=目录路径
 * 模式3 - 单文件压缩：@param {string}  --path=文件路径
 * @example gulp tinypng --1000001
 * @example gulp tinypng --path=E:/project/assets
 * @example gulp tinypng --path=../game_100042/assets/image.jpg
 */
exports.tinypng = require("./common/tinypng");


/**
 * 资源加密
 * @param {string}  --MoneyComing 项目名
 * @example gulp encryptImage --MoneyComing
 */
exports.encryptImage = require("./common/encryptImage");

/**
 * 批量合并游戏仓库（从 release 分支合并到 pre 分支）
 * @param {string}  --gameids 游戏ID列表（逗号分隔）
 * @example gulp gameMerge --100120,100123
 */
const fs = require('fs');
const path = require('path');
const gameMergePath = path.join(__dirname, 'common', 'gameMerge.js');
exports.gameMerge = fs.existsSync(gameMergePath)
    ? require(gameMergePath)
    : function(done) {
        done(new Error('缺少任务文件: common/gameMerge.js'));
    };

/**
 * 导表：调用 cli.js，可带参数
 * 用法：
 *   gulp cli --game_100042
 *   gulp cli --game=100042
 *   gulp cli --gameid=100042
 */
exports.cli = function(done) {
    const { spawn } = require('child_process');
    const args = process.argv.slice(3); // 保留传入的参数（支持无 -- 的位置参数）
    const child = spawn(process.execPath, [path.join(__dirname, 'common/cli.js'), ...args], { stdio: 'inherit' });
    child.on('close', (code) => done(code ? new Error(`cli 退出码: ${code}`) : undefined));
};
exports["cli.js"] = exports.cli;
