/**
 * 根据项目模板创建新项目
 * @param {string}  --oldsuffix 旧的项目主键
 * @param {string}  --oldogameid 旧的项目id
 * @param {string}  --newsuffix 新的项目主键
 * @param {string}  --newgameid 新的项目id
 * @param {string}  --y 可选，是否初始化git子仓库，默认为空
 * @example gulp new --RomaX --100055 --CandyBaby --100048
 */
exports.new = require("./common/newTask");

/**
 * 自动更新启动项目
 * @param {string}  --gameid 项目id
 * TESTGAME/game_xxxxxx/gulp_tools同一级目录 会无脑覆盖，请先备份，主要忽略index_bg.jpg与gameConfig.ts
 * @example gulp updateStartLib --100048
 */
exports.updateStartLib = require("./common/updateStartLib");

/**
 * 自动slot与base库
 * @param {string}  --gameid 项目id
 * TESTGAME/game_xxxxxx/gulp_tools同一级目录 会无脑覆盖，请先备份
 * @example gulp updateSlotLib --100048
 */
exports.updateSlotLib = require("./common/updateSlotLib");




/**
 * 资源加密
 * @param {string}  --MoneyComing 项目名
 * @example gulp encryptImage --MoneyComing
 */
exports.encryptImage = require("./common/encryptImage");