"use strict";

const fs = require('fs');
const path = require('path');
// 确保可从 excel-to-json/node_modules 解析第三方依赖（如 exceljs）
(function ensurePluginNodeModules() {
  try {
    const nm = path.join(__dirname, '..', 'node_modules');
    if (module.paths.indexOf(nm) === -1) module.paths.push(nm);
  } catch {}
})();

const ExcelToJson = {
    async convert(src, dst, name, isClient, config) {
        const excel = require('exceljs');
        const JsonToTs = require("./JsonToTs");
        
        let tableCfgData = {};
        let names = new Map();
        let keys = new Map();
        let types = new Map();
        let types_client = {};
        let isArrayIds = 1;
        
        const workbook = new excel.Workbook();
        try {
            await workbook.xlsx.readFile(src);
        } catch (e) {
            Editor.error("读取 Excel 失败:", src);
            return;
        }

        // 优先使用第一个有数据的工作表，而不是索引1
        let worksheet = null;
        workbook.eachSheet((sheet) => {
            if (!worksheet && sheet && sheet._rows && sheet._rows.length > 0) {
                worksheet = sheet;
            }
        });
        
        if (!worksheet) {
            Editor.warn("找不到有效的工作表");
            return;
        }

        worksheet.eachRow((row, rowNumber) => {
            // 获取第一列的值作为行类型标识
            let firstCell = row.getCell(1).value;
            let rowType = "";
            if (firstCell !== null && firstCell !== undefined) {
                rowType = firstCell.toString().trim();
            }

            // 1. 识别配置行 (NAME, TYPE, KEY, KEY_TYPE)
            if (rowType.indexOf("NAME") !== -1 || rowType === "NAME") {
                this.fillMap(row, names);
                return;
            } else if (rowType.indexOf("TYPE") !== -1 || rowType === "TYPE") {
                this.fillMap(row, types);
                return;
            } else if (rowType.indexOf("KEY_TYPE") !== -1 || rowType === "KEY_TYPE") {
                isArrayIds = Number(row.getCell(2).value) || 1;
                return;
            } else if (rowType.indexOf("KEY") !== -1 || rowType === "KEY") {
                this.fillMap(row, keys);
                return;
            }

            // 跳过表头行（gameID等）
            if (rowType === "gameID" || rowType === "gameid" || rowNumber === 1) {
                return;
            }

            // 2. 识别数据行 (第一列是数字的游戏ID)
            let isDataRow = false;
            let gameID = null;
            if (rowType !== "" && !isNaN(rowType)) {
                gameID = Number(rowType);
                let targetID = config.TargetGameID ? Number(config.TargetGameID) : -1;
                // 需求：默认导出 0, 1 以及指定 ID
                if (gameID === 0 || gameID === 1 || (targetID !== -1 && gameID === targetID)) {
                    isDataRow = true;
                }
            }

            // console.warn("Row:", rowNumber, "GameID:", rowType, "isDataRow:", isDataRow);

            if (isDataRow) {
                let data = {};
                
                // 如果没有定义keys，从names中自动生成
                if (keys.size === 0 && names.size > 0) {
                    names.forEach((name, colIdx) => {
                        keys.set(colIdx, name);
                    });
                }

                // console.warn("keys:", keys);
                // 遍历该行所有定义的列
                keys.forEach((key, colIdx) => {
                    let cellValue = row.getCell(colIdx).value;
                    
                    // 处理富文本或公式结果
                    if (cellValue && typeof cellValue === 'object') {
                        if (cellValue.result !== undefined) cellValue = cellValue.result;
                        else if (cellValue.richText) cellValue = cellValue.richText.map(t => t.text).join("");
                    }
                    
                    if (typeof cellValue === "number") cellValue = Number(cellValue.toFixed(6));

                    let type = types.get(colIdx) || "string";
                    if (type === "int") {
                        data[key] = parseInt(cellValue) || 0;
                    } else if (type === "float") {
                        data[key] = parseFloat(cellValue) || 0;
                    } else {
                        let str = (cellValue !== undefined && cellValue !== null) ? cellValue.toString() : "";
                        // 处理特殊数组格式 {1,2}
                        if (str.includes("{") && str.includes("}") && !/^{[^{}]+}$/.test(str)) {
                            try {
                                data[key] = JSON.parse(str.replace(/{/g, "[").replace(/}/g, "]"));
                            } catch (e) { data[key] = str; }
                        } else {
                            data[key] = str;
                        }
                    }
                    types_client[key] = { en: (typeof data[key] === 'object' ? "any[]" : "string"), zh: names.get(colIdx) || key };
                    if (typeof data[key] === "string") {
                        // 把 Excel 中以 "\\n" 表示的换行替换为真实换行
                        // 先处理 Windows 风格的 \r\n，再处理 \n 和常见的 \t
                        data[key] = data[key].replace(/\\r\\n/g, '\r\n').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
                    }
                });

                // 获取callName作为主键（第二列）
                let callName = data["callName"] || data[keys.get(2)];
                
                if (callName && gameID !== null) {
                    // 按照目标格式：{callName: {gameID: data}}
                    if (!tableCfgData[callName]) {
                        tableCfgData[callName] = {};
                    }
                    // 使用 Excel 中的 type 字段值作为键名 (如 "0" 或 "1")
                    let typeKey = (data["type"] !== undefined) ? data["type"].toString() : "0";
                    tableCfgData[callName][typeKey] = data;
                }
            }
        });

        if (Object.keys(tableCfgData).length > 0) {
            // 计算实际导出的数据行数
            let totalRows = 0;
            Object.keys(tableCfgData).forEach(key => {
                totalRows += Object.keys(tableCfgData[key]).length;
            });
            
            fs.writeFileSync(dst, JSON.stringify(tableCfgData, null, 2));
            if (isClient && config.PathTsClient) {
                await JsonToTs.createTs(name, types_client, tableCfgData, [], config);
            }
            Editor.log(`  [OK] ${name} (已导出 ${Object.keys(tableCfgData).length} 个配置项，共 ${totalRows} 条数据)`);
        } else {
            Editor.warn(`  [SKIP] ${name} 未匹配到符合条件的行 (TargetID: ${config.TargetGameID})`);
        }
    },

    // 辅助函数：填充表头映射
    fillMap(row, map) {
        for (let i = 1; i <= 30; i++) { // 从第1列开始扫描
            let val = row.getCell(i).value;
            if (val && typeof val === 'object' && val.richText) {
                val = val.richText.map(t => t.text).join("");
            }
            if (val) {
                let strVal = val.toString().trim();
                // 跳过 gameID 和 NAME 这些标识列
                if (strVal !== "gameID" && strVal !== "NAME" && strVal !== "TYPE" && strVal !== "KEY") {
                    map.set(i, strVal);
                }
            }
        }
    },

    async run(config) {
        function getRealPath(p) {
            if (p.startsWith("project://")) {
                let projectPath = (Editor.Project && Editor.Project.path) || (Editor.projectInfo && Editor.projectInfo.path);
                return path.join(projectPath, p.replace("project://", ""));
            }
            return path.isAbsolute(p) ? p : path.join(__dirname, p);
        }

        const inputPath = getRealPath(config.PathExcel);
        const outputPath = getRealPath(config.PathJsonClient);

        if (!fs.existsSync(inputPath)) throw new Error("Excel目录不存在: " + inputPath);
        if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });

        const files = fs.readdirSync(inputPath).filter(f => f.endsWith(".xlsx") && f.includes("_") && !f.includes("~$"));
        for (const f of files) {
            const name = f.substring(0, f.indexOf("_"));
            await this.convert(path.join(inputPath, f), path.join(outputPath, name + ".json"), name, true, config);
        }
    }
};

module.exports = ExcelToJson;
