"use strict";

const fs = require('fs');
const path = require('path');
// 优先把 excel-to-json 的 node_modules 放入搜索路径，复用已有依赖
(function ensurePluginNodeModules() {
  try {
    const nm = path.join(__dirname, '..', 'node_modules');
    if (module.paths.indexOf(nm) === -1) module.paths.push(nm);
  } catch {}
})();

// 模拟 Cocos Creator 环境
global.Editor = {
    log: console.log,
    success: console.log,
    warn: console.warn,
    error: console.error,
    Project: {
        // slots 根目录（Windows: e:\slots, Mac/Linux: /path/to/slots）
        path: path.join(__dirname, "../../")
    }
};


async function run() {
    try {
        const configPath = path.join(__dirname, "config/config.json");
        const excelToJsonPath = path.join(__dirname, 'ExcelToJson.js');

        const fail = (message, error) => {
            if (error) {
                console.error(message, error);
            } else {
                console.error(message);
            }
            process.exitCode = 1;
            return;
        };

        if (!fs.existsSync(configPath)) {
            return fail('找不到配置文件: ' + configPath);
        }

        // 1) 仅解析参数（不交互）。支持：gulp cli.js game_100042 或 gulp cli.js 100042
        const argv = process.argv.slice(2);
        let idNum = null;
        for (const a of argv) {
            if (!a) continue;
            const m = a.match(/(\d{3,})/);
            if (m) { idNum = m[1]; break; }
        }
        if (!idNum) {
            return fail('缺少参数。用法：gulp cli.js game_100042（或 100042）');
        }
        const gameFolderName = `game_${idNum}`;

        // 2) 计算各路径并校验 assets 目录是否存在
        const projectRoot = global.Editor.Project.path;
        const gameAssetsDir = path.join(projectRoot, gameFolderName, 'assets');
        if (!fs.existsSync(gameAssetsDir)) {
            return fail(`未找到目录: ${gameAssetsDir}`);
        }

        if (!fs.existsSync(excelToJsonPath)) {
            return fail(`缺少导表模块: ${excelToJsonPath}`);
        }

        const ExcelToJson = require(excelToJsonPath);

        // 3) 读取并更新配置
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        config.TargetGameID = Number(idNum);
        config.PathJsonClient = `project://${gameFolderName}/assets/resources/config/`;
        config.PathTsClient = `project://${gameFolderName}/assets/scripts/config/`;

        // 若 Excel 路径无效，自动修正到 project://doc/配置表/
        const tryResolve = (p) => {
            if (typeof p !== 'string') return '';
            if (p.startsWith('project://')) {
                return path.join(projectRoot, p.replace('project://', ''));
            }
            return path.isAbsolute(p) ? p : path.join(__dirname, p);
        };
        let excelDir = tryResolve(config.PathExcel);
        if (!fs.existsSync(excelDir)) {
            const fallback = 'project://doc/配置表/';
            const fallbackAbs = tryResolve(fallback);
            if (fs.existsSync(fallbackAbs)) {
                config.PathExcel = fallback;
                excelDir = fallbackAbs;
                console.log(`已自动修正 PathExcel 到: ${fallback}`);
            } else {
                return fail(`Excel 目录不存在: ${excelDir}`);
            }
        }

        // 确保输出目录存在
        const jsonOutAbs = tryResolve(config.PathJsonClient);
        const tsOutAbs = tryResolve(config.PathTsClient);
        if (!fs.existsSync(jsonOutAbs)) fs.mkdirSync(jsonOutAbs, { recursive: true });
        if (!fs.existsSync(tsOutAbs)) fs.mkdirSync(tsOutAbs, { recursive: true });

        // 将更新后的配置写回文件（便于下次直接使用）
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

        console.log(`正在为 ${gameFolderName} (TargetGameID=${config.TargetGameID}) 执行导表...`);
        await ExcelToJson.run(config);
        console.log('导表成功！');
    } catch (err) {
        process.exitCode = 1;
        console.error('导表失败:', err);
    }
}

run();
