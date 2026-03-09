/**
 * 根据项目模板创建新项目
 * gulp new --旧的项目主键 --旧的项目id --新的项目主键 --新的项目id
 */
const rootDir = process.cwd();

module.exports = function (cb) {
    const gulp = require("gulp");
    const fs = require("fs");
    var proc = require('child_process');
    const path = require("path");
    const deleteDirectory = require('./deleteDirectory');

    if (process.argv.length < 7) {
        console.log(`请输入相应的参数，示例：gulp new --旧的项目主键 --旧的项目id --新的项目主键 --新的项目id`);
        return;
    }

    let oldSuffix = process.argv[3].replace('--', '');
    let oldGameId = process.argv[4].replace('--', '');
    let newSuffix = process.argv[5].replace('--', '');
    let newGameId = process.argv[6].replace('--', '');
    // 是否上传到git
    let isGit = false;
    if (process.argv.length >= 8) {
        isGit = process.argv[7].replace('--', '') == 'y';
    }

    let sourceFolderName = path.resolve(rootDir, '../');
    if (!fs.existsSync(path.resolve(sourceFolderName, `game_${oldGameId}`))) {
        console.log(`旧的项目id：game_${oldGameId} 不存在`);
        return;
    }
    if (fs.existsSync(path.resolve(sourceFolderName, `game_${newGameId}`))) {
        console.log(`新的项目id：game_${newGameId} 已存在，请备份删除！`);
        return;
        // deleteDirectory(path.resolve(sourceFolderName, `game_${newGameId}`));
    }
    const bundlePath = path.resolve(sourceFolderName, `game_${oldGameId}`, 'assets', `bundle${oldSuffix}`);
    if (!fs.existsSync(bundlePath)) {
        console.log(`旧的项目id：bundle${oldSuffix} 不存在`);
        return;
    }

    console.log(`game_${oldGameId}--->game_${newGameId}`);

    // clone 到目标目录 game_<newGameId>
    let gitPath = `git clone https://git.dreamgames.app/zmgame/clients/TESTGAME game_${newGameId}`;

    // 拉取主项目到上层目录的 game_<newGameId> 并切换到 dev 分支 并更新子模块
    const isWindows = process.platform === 'win32';
    let gitCmd;
    if (isWindows) {
        gitCmd = `start cmd /k "cd .. && ${gitPath} && cd game_${newGameId} && git checkout dev `;
        if (!isGit) {
            gitCmd += `&& git submodule update --init --recursive `;
        }
        gitCmd += `&& exit"`;
    } else {
        // Mac/Linux
        gitCmd = `cd .. && ${gitPath} && cd game_${newGameId} && git checkout dev`;
        if (!isGit) {
            gitCmd += ` && git submodule update --init --recursive`;
        }
    }
    proc.execSync(gitCmd, { shell: isWindows ? 'cmd.exe' : '/bin/bash' });

    // 新项目地址
    let newGameFolderPath = path.resolve(sourceFolderName, `game_${newGameId}`);

    if (!isGit){
        // 切换 bundleSlotFrame与bundleZmBase 库分支更新
        let preBundles = ['bundleSlotFrame', 'bundleZmBase'];
        for (let i = 0; i < preBundles.length; i++) {
            const element = preBundles[i];
            let bundlePath = path.resolve(newGameFolderPath, 'assets', element);
            let bundleCmd;
            if (isWindows) {
                bundleCmd = `start cmd /k "cd ${bundlePath} && git checkout dev && git pull && exit"`;
            } else {
                // Mac/Linux
                bundleCmd = `cd ${bundlePath} && git checkout dev && git pull`;
            }
            proc.execSync(bundleCmd, { shell: isWindows ? 'cmd.exe' : '/bin/bash' });
        }

        // 删除assets下其他文件和目录
        let otherBundles = ['bundleGamestoneMiners', 'bundleGamestoneMiners.meta'];
        for (let i = 0; i < otherBundles.length; i++) {
            const element = otherBundles[i];
            let bundlePath = path.resolve(newGameFolderPath, 'assets', element);
            deleteDirectory(bundlePath);
        }
    }

    // 构建源文件路径数组，确保复制整个bundle目录及其内容
    const metaPath = path.resolve(sourceFolderName, `game_${oldGameId}`, 'assets', `bundle${oldSuffix}.meta`);
    let srcBundles = [
        `${bundlePath}/**/*`,  // 复制bundle目录下的所有文件和子目录
        metaPath  // 复制bundle的meta文件
    ];
    // 使用path.join确保平台兼容性，不需要手动添加路径分隔符
    let destPath = path.resolve(sourceFolderName, `game_${newGameId}`, 'assets', `bundle${oldSuffix}`);
    
    // 将srcBundles中的目录或文件复制到newGameFolderPath的assets中
    gulp.src(srcBundles, { base: path.dirname(bundlePath) })
        .pipe(gulp.dest(path.resolve(newGameFolderPath, 'assets')))
        .on('end', function() {
            let ignoreList = ['.skel'];//排除的文件
            //遍历文件夹
            let fileNames = fs.readdirSync(destPath);
            for (let fileName of fileNames) {
                if (fileName.indexOf(oldSuffix) > -1) {
                    let newFileName = fileName.replace(oldSuffix, newSuffix);
                    // 使用path.join构建完整路径，确保平台兼容性
                    fs.renameSync(path.join(destPath, fileName), path.join(destPath, newFileName));
                    fileName = newFileName;
                }

                // 使用path.join构建完整路径，确保平台兼容性
                if (fs.statSync(path.join(destPath, fileName)).isFile())
                    editFile(path.join(destPath, fileName), fileName);
                else loopRead(destPath, fileName);
            }

            //遍历
            function loopRead(basePath, dir) {
                // 使用path.join构建完整路径，确保平台兼容性
                let fileNames = fs.readdirSync(path.join(basePath, dir));
                for (let fileName of fileNames) {
                    if (fileName.indexOf(oldSuffix) > -1) {
                        let newFileName = fileName.replace(oldSuffix, newSuffix);
                        // 使用path.join构建完整路径，确保平台兼容性
                        fs.renameSync(path.join(basePath, dir, fileName), path.join(basePath, dir, newFileName));
                        fileName = newFileName;
                    }

                    // 使用path.join构建完整路径，确保平台兼容性
                    if (fs.statSync(path.join(basePath, dir, fileName)).isFile())
                        editFile(path.join(basePath, dir, fileName), fileName);
                    else loopRead(basePath, path.join(dir, fileName));
                }
            }

            function editFile(filePath, fileName) {
                for (let i = 0; i < ignoreList.length; i++) {
                    const ext = ignoreList[i];
                    if (fileName.indexOf(ext) >= 0)
                        return;
                }
                let content = fs.readFileSync(filePath, 'utf-8');
                if (content.indexOf(oldSuffix) > -1) {
                    let reg = new RegExp(`${oldSuffix}`, 'g');
                    content = content.replace(reg, newSuffix);
                    fs.writeFileSync(filePath, content);
                }
            }

            // 重命名bundle目录
            let newBundlePath = path.resolve(newGameFolderPath, 'assets', `bundle${newSuffix}`);
            if (fs.existsSync(destPath)) {
                fs.renameSync(destPath, newBundlePath);
            }

            // 重命名和修改meta文件
            let oldMetaPath = path.resolve(newGameFolderPath, 'assets', `bundle${oldSuffix}.meta`);
            let newMetaPath = path.resolve(newGameFolderPath, 'assets', `bundle${newSuffix}.meta`);
            if (fs.existsSync(oldMetaPath)) {
                // 修改meta文件内容
                editFile(oldMetaPath, `bundle${oldSuffix}.meta`);
                // 重命名meta文件
                fs.renameSync(oldMetaPath, newMetaPath);
            }

            // 修改 gameConfig.ts
            let gameConfigPath = path.resolve(newGameFolderPath, 'assets', 'scripts','gameConfig.ts');
            if (fs.existsSync(gameConfigPath)) {
                let content = fs.readFileSync(gameConfigPath, 'utf-8');
                // 将gameID改成newGameId
                content = content.replace(/gameID: \d+,/g, `gameID: ${oldGameId},`);
                // 将initBundleName改成`bundle${newSuffix}`
                content = content.replace(/initBundleName: '.*',/g, `initBundleName: 'bundle${newSuffix}',`);
                fs.writeFileSync(gameConfigPath, content);
            }
            // 安装npm依赖
            let npmCmd;
            if (isWindows) {
                npmCmd = `start cmd /k "cd ${newGameFolderPath} && npm install && exit"`;
            } else {
                // Mac/Linux
                npmCmd = `cd ${newGameFolderPath} && npm install`;
            }
            proc.execSync(npmCmd, { shell: isWindows ? 'cmd.exe' : '/bin/bash' });

            // 删除不需要的目录或文件
            let needDeletes = ['.git', 'build','packages','更新说明.md','接入新游戏说明.md'];
            for (let k = 0; k < needDeletes.length; k++) {
                deleteDirectory(path.join(newGameFolderPath, needDeletes[k]));
            }

            // 初始化git仓库
            if (isGit){
                let toGitPath = `https://git.dreamgames.app/zmgame/clients/game_${newGameId}.git`;
                let gitInitCmd;
                if (isWindows) {
                    var cmd = `start cmd /k "cd ${newGameFolderPath}`;
                    cmd += ` && git init`;
                    cmd += ` && git checkout -b dev`;  // 创建并切换到dev分支
                    cmd += ` && git add .`;
                    cmd += ` && git commit -m "init"`;
                    cmd += ` && git remote add origin ${toGitPath}`;
                    cmd += ` && git push -u origin dev`;  // 推送到远程dev分支
                    cmd += ` && git submodule update --init --recursive `; // 拉取子模块
                    cmd += ` && @echo ${newGameId} git仓库推送完毕! && @ping 127.0.0.1 -n 2 >nul && exit"`;
                    gitInitCmd = cmd;
                } else {
                    // Mac/Linux
                    gitInitCmd = `cd ${newGameFolderPath} && git init && git checkout -b dev && git add . && git commit -m "init" && git remote add origin ${toGitPath} && git push -u origin dev && git submodule update --init --recursive && echo "${newGameId} git仓库推送完毕!"`;
                }
                proc.execSync(gitInitCmd, { shell: isWindows ? 'cmd.exe' : '/bin/bash' });

                // 切换 bundleSlotFrame与bundleZmBase 库分支更新
                let preBundles = ['bundleSlotFrame', 'bundleZmBase'];
                for (let i = 0; i < preBundles.length; i++) {
                    const element = preBundles[i];
                    let bundlePath = path.resolve(newGameFolderPath, 'assets', element);
                    let preBundleCmd;
                    if (isWindows) {
                        preBundleCmd = `start cmd /k "cd ${bundlePath} && git checkout dev && git pull && exit"`;
                    } else {
                        // Mac/Linux
                        preBundleCmd = `cd ${bundlePath} && git checkout dev && git pull`;
                    }
                    proc.execSync(preBundleCmd, { shell: isWindows ? 'cmd.exe' : '/bin/bash' });
                }

                // 删除assets下其他文件和目录
                let otherBundles = ['bundleGamestoneMiners', 'bundleGamestoneMiners.meta'];
                for (let i = 0; i < otherBundles.length; i++) {
                    const element = otherBundles[i];
                    let bundlePath = path.resolve(newGameFolderPath, 'assets', element);
                    deleteDirectory(bundlePath);
                }
            }

            cb();
        })
}