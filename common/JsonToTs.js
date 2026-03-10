"use strict";

const path = require("path");
const fs = require("fs");

/**
 * 生成 TypeScript 配置表定义文件
 * @param {string} name - 配置表名称
 * @param {Object} fieldType - 字段类型定义
 * @param {Object} data - 配置数据
 * @param {Array} primary - 主键字段列表
 * @param {Object} config - 配置对象
 */
async function createTs(name, fieldType, data, primary, config) {
    const className = name.charAt(0).toUpperCase() + name.slice(1);
    
    // 生成数据项的字段定义
    const fields = generateFields(fieldType, primary);
    
    // 生成完整的 TypeScript 代码
    const script = generateTypeScriptCode(name, className, fields);
    
    // 写入文件
    writeTypeScriptFile(config, className, script);
}

/**
 * 生成字段定义
 */
function generateFields(fieldType, primary) {
    const fields = [];
    
    for (const fieldName in fieldType) {
        // 跳过主键字段
        if (primary.indexOf(fieldName) !== -1) {
            continue;
        }
        
        const field = fieldType[fieldName];
        const fieldTypeStr = field.isAny ? "any" : field.en;
        const comment = field.zh || fieldName;
        
        fields.push({
            name: fieldName,
            type: fieldTypeStr,
            comment: comment
        });
    }
    
    return fields;
}

/**
 * 生成 TypeScript 代码
 */
function generateTypeScriptCode(name, className, fields) {
    // 生成字段定义字符串
    const fieldDefinitions = fields.map(field => 
        `    /** ${field.comment} */\n    ${field.name}: ${field.type};`
    ).join('\n');
    
    // 生成完整的 TypeScript 代码
    return `/** ${name} 配置表数据项 */
export interface Table${className}Item {
${fieldDefinitions}
}

/** ${name} 配置表 - 按 callName 和 gameID 索引 */
export interface Table${className}Data {
    [callName: string]: {
        [gameID: string]: Table${className}Item;
    };
}

/** ${name} 配置表类 */
export class Table${className} {
    static TableName: string = "${name}";
    
    /** 配置数据 */
    static data: Table${className}Data;
    
    /**
     * 根据 callName 和 gameID 获取配置
     * @param callName 配置名称
     * @param gameID 游戏ID (默认为 "0")
     * @returns 配置数据项，如果不存在则返回 undefined
     */
    static get(callName: string, gameID: string = "0"): Table${className}Item | undefined {
        return this.data?.[callName]?.[gameID];
    }
    
    /**
     * 获取指定 callName 的所有 gameID 配置
     * @param callName 配置名称
     * @returns 该 callName 下所有 gameID 的配置，如果不存在则返回 undefined
     */
    static getAll(callName: string): { [gameID: string]: Table${className}Item } | undefined {
        return this.data?.[callName];
    }
    
    /**
     * 检查配置是否存在
     * @param callName 配置名称
     * @param gameID 游戏ID (默认为 "0")
     * @returns 配置是否存在
     */
    static has(callName: string, gameID: string = "0"): boolean {
        return this.data?.[callName]?.[gameID] !== undefined;
    }
    
    /**
     * 获取所有配置项名称
     * @returns 所有 callName 的数组
     */
    static getAllKeys(): string[] {
        return this.data ? Object.keys(this.data) : [];
    }
}
`;
}

/**
 * 解析路径（支持 project:// 协议）
 */
function resolvePath(pathStr) {
    if (pathStr.startsWith("project://")) {
        // 在 Cocos Creator 环境中
        if (typeof Editor !== 'undefined' && Editor.Project && Editor.Project.path) {
            return path.join(Editor.Project.path, pathStr.replace("project://", ""));
        }
        // 在命令行环境中
        return path.join(__dirname, pathStr.replace("project://", "../../../"));
    }
    
    // 绝对路径或相对路径
    return path.isAbsolute(pathStr) ? pathStr : path.join(__dirname, pathStr);
}

/**
 * 写入 TypeScript 文件
 */
function writeTypeScriptFile(config, className, script) {
    const outputDir = resolvePath(config.PathTsClient);
    
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 写入文件
    const outputPath = path.join(outputDir, `Table${className}.ts`);
    fs.writeFileSync(outputPath, script, 'utf8');
}

// 导出函数
module.exports = {
    createTs
};
