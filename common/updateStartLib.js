const rootDir = process.cwd();

module.exports = function (cb) {
    const gulp = require("gulp");
    const fs = require("fs");
    var proc = require('child_process');
    const path = require("path");

    let game_id = process.argv[3].replace('--', '');

    let destFolderPatn = path.resolve(rootDir, '../', `game_${game_id}`);
    if (!fs.existsSync(destFolderPatn)) {
        console.log(`项目id：game_${game_id} 不存在`);
        return;
    }
    let sourceFolderPath = path.resolve(destFolderPatn, '../', `slots`);

    // 拉取TESTGAME最新代码
    const isWindows = process.platform === 'win32';
    let cmd;
    if (isWindows) {
        cmd = `start cmd /k "cd ${sourceFolderPath} && git pull && exit"`;
    } else {
        // Mac/Linux
        cmd = `cd ${sourceFolderPath} && git pull`;
    }
    proc.execSync(cmd, { shell: isWindows ? 'cmd.exe' : '/bin/bash' });

    console.log(`TESTGAME ----> game_${game_id}`);

    /**
     * 递归拷贝文件和文件夹
     * @param {string} source - 源文件或文件夹路径
     * @param {string} destination - 目标文件或文件夹路径
     * @param {Array} excludeFiles - 要排除的文件或文件夹列表（可选）
     */
    function copyRecursiveSync(source, destination, excludeFiles = []) {
        // 检查源路径是否存在
        if (!fs.existsSync(source)) {
            // console.warn(`源路径不存在: ${source}`);
            return;
        }

        // 获取源路径的状态
        const stats = fs.statSync(source);

        if (stats.isFile()) {
            // 如果是文件，检查是否在排除列表中
            const fileName = path.basename(source);
            if (excludeFiles.includes(fileName)) {
                // console.log(`排除文件: ${fileName}`);
                return;
            }
            
            // 创建目标文件夹（如果不存在）
            const destDir = path.dirname(destination);
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }
            
            // 拷贝文件（覆盖目标文件）
            fs.copyFileSync(source, destination);
            // console.log(`拷贝文件: ${source} -> ${destination}`);
        } else if (stats.isDirectory()) {
            // 如果是文件夹，检查是否在排除列表中
            const folderName = path.basename(source);
            if (excludeFiles.includes(folderName)) {
                // console.log(`排除文件夹: ${folderName}`);
                return;
            }
            
            // 创建目标文件夹（如果不存在）
            if (!fs.existsSync(destination)) {
                fs.mkdirSync(destination, { recursive: true });
            }
    
            // 读取源文件夹中的所有文件和子文件夹
            const files = fs.readdirSync(source);
    
            // 遍历并递归拷贝每个文件和子文件夹
            files.forEach(file => {
                const sourcePath = path.join(source, file);
                const destinationPath = path.join(destination, file);
                copyRecursiveSync(sourcePath, destinationPath, excludeFiles);
            });
            
            // console.log(`拷贝文件夹: ${source} -> ${destination}`);
        }
    }
    

    const sourceToCopy = [
        path.join(sourceFolderPath, 'build-templates'),
        path.join(sourceFolderPath, 'preview-templates'),
        path.join(sourceFolderPath, 'assets'),
    ];

    const destToCopy = [
        path.join(destFolderPatn, 'build-templates'),
        path.join(destFolderPatn, 'preview-templates'),
        path.join(destFolderPatn, 'assets'),
    ];
    const excludeFiles = [
        ['index_bg.jpg'],
        [],
        ['bundleSlotFrame', 'bundleGamestoneMiners','bundleZmBase','gameConfig.ts',
            'bundleSlotFrame.meta', 'bundleGamestoneMiners.meta','bundleZmBase.meta','gameConfig.ts.meta'
        ]
    ];
    for (let i = 0; i < sourceToCopy.length; i++) {
        const source = sourceToCopy[i];
        const dest = destToCopy[i];
        const exclude = excludeFiles[i];
        copyRecursiveSync(source, dest, exclude);
    }

    cb();
}