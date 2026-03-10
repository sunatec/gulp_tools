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
 * @example gulp new --ChargeBuffaloAscent --100042 --TestGame --1000001
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


    let sourceFolderName = path.resolve(rootDir, '../');
    if (!fs.existsSync(path.resolve(sourceFolderName, `game_${oldGameId}`))) {
        console.log(`旧的项目id：game_${oldGameId} 不存在`);
        return;
    }
    if (fs.existsSync(path.resolve(sourceFolderName, `game_${newGameId}`))) {
        console.log(`新的项目id：game_${newGameId} 已存在，请备份删除！`);
        return;
    }
    const bundlePath = path.resolve(sourceFolderName, `game_${oldGameId}`, 'assets', `bundle${oldSuffix}`);
    if (!fs.existsSync(bundlePath)) {
        console.log(`旧的项目bundle：bundle${oldSuffix} 不存在`);
        return;
    }

    console.log(`====== 开始创建新项目 ======`);
    console.log(`模板项目: game_${oldGameId} (${oldSuffix})`);
    console.log(`新项目: game_${newGameId} (${newSuffix})`);
    console.log(`==========================\n`);
    
    // 步骤1: 克隆主仓库
    console.log('步骤1: 拉取 slots 主仓库...');
    let gitPath = `git clone https://git.dreamgames.app/zmgame/clients/slots.git game_${newGameId}`;
    let gitCmd = `start cmd /k "cd .. && ${gitPath} && cd game_${newGameId} && git checkout dev && exit"`;
    proc.execSync(gitCmd);

    // 等待克隆完成
    console.log('等待主仓库克隆完成...');
    try {
        proc.execSync('ping 127.0.0.1 -n 8 > nul', {stdio: 'ignore'});
    } catch(e) {}

    // 新项目地址
    let newGameFolderPath = path.resolve(sourceFolderName, `game_${newGameId}`);


    // 步骤2: 拷贝旧项目子游戏包到新项目
    console.log('\n步骤2: 拷贝旧项目游戏包...');
    // 构建源文件路径数组，确保复制整个bundle目录及其内容
    const metaPath = path.resolve(sourceFolderName, `game_${oldGameId}`, 'assets', `bundle${oldSuffix}.meta`);
    let srcBundles = [
        `${bundlePath}/**/*`,  // 复制bundle目录下的所有文件和子目录
        metaPath  // 复制bundle的meta文件
    ];
    let destPath = path.resolve(newGameFolderPath, 'assets', `bundle${oldSuffix}`);
    
    // 将srcBundles中的目录或文件复制到newGameFolderPath的assets中
    gulp.src(srcBundles, { base: path.dirname(bundlePath) })
        .pipe(gulp.dest(path.resolve(newGameFolderPath, 'assets')))
        .on('end', function() {
            console.log('游戏包拷贝完成\n');

            // 步骤3: 删除多余目录
            console.log('步骤3: 删除多余目录...');
            let deleteBundles = [
                'bundleSlotFrame', 'bundleSlotFrame.meta',
                'bundleZmBase', 'bundleZmBase.meta',
                'bundleGamestoneMiners', 'bundleGamestoneMiners.meta',
                'bundleMoneyPot', 'bundleMoneyPot.meta',
                '.git', 'build', 'packages', '更新说明.md', '接入新游戏说明.md'
            ];
            for (let i = 0; i < deleteBundles.length; i++) {
                let delPath = path.resolve(newGameFolderPath, deleteBundles[i].indexOf('bundle') === 0 ? 'assets' : '', deleteBundles[i]);
                if (fs.existsSync(delPath)) {
                    deleteDirectory(delPath);
                    console.log(`  已删除: ${deleteBundles[i]}`);
                }
            }
            console.log('多余目录删除完成\n');

            // 步骤4: 添加公共子模块
            console.log('步骤4: 添加公共子模块（bundleSlotFrame & bundleZmBase）...');
            try {
                // 初始化 git 仓库
                proc.execSync(`cd /d "${newGameFolderPath}" && git init`, {stdio: 'inherit'});
                
                // 添加子模块
                proc.execSync(`cd /d "${newGameFolderPath}" && git submodule add -b dev https://git.dreamgames.app/jili/clients/bundleSlotFrame.git assets/bundleSlotFrame`, {stdio: 'inherit'});
                console.log('  bundleSlotFrame 添加成功');
                
                proc.execSync(`cd /d "${newGameFolderPath}" && git submodule add -b dev https://git.dreamgames.app/jili/clients/bundleZmBase.git assets/bundleZmBase`, {stdio: 'inherit'});
                console.log('  bundleZmBase 添加成功');
                
                // 初始化并更新子模块
                proc.execSync(`cd /d "${newGameFolderPath}" && git submodule update --init --recursive`, {stdio: 'inherit'});
                console.log('公共子模块添加完成\n');
            } catch (error) {
                console.error('添加子模块失败:', error.message);
            }

            // 步骤5: 批量修改子包文件与文件夹键值
            console.log('步骤5: 批量修改游戏包文件...');
            let ignoreList = ['.skel'];//排除的文件
            
            //遍历文件夹
            let fileNames = fs.readdirSync(destPath);
            for (let fileName of fileNames) {
                if (fileName.indexOf(oldSuffix) > -1) {
                    let newFileName = fileName.replace(oldSuffix, newSuffix);
                    fs.renameSync(path.join(destPath, fileName), path.join(destPath, newFileName));
                    fileName = newFileName;
                }

                if (fs.statSync(path.join(destPath, fileName)).isFile())
                    editFile(path.join(destPath, fileName), fileName);
                else loopRead(destPath, fileName);
            }

            //遍历
            function loopRead(basePath, dir) {
                let fileNames = fs.readdirSync(path.join(basePath, dir));
                for (let fileName of fileNames) {
                    if (fileName.indexOf(oldSuffix) > -1) {
                        let newFileName = fileName.replace(oldSuffix, newSuffix);
                        fs.renameSync(path.join(basePath, dir, fileName), path.join(basePath, dir, newFileName));
                        fileName = newFileName;
                    }

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
                editFile(oldMetaPath, `bundle${oldSuffix}.meta`);
                fs.renameSync(oldMetaPath, newMetaPath);
            }
            console.log('游戏包文件修改完成\n');

            // 步骤6: 修改 gameConfig.ts
            console.log('步骤6: 修改 gameConfig.ts...');
            let gameConfigPath = path.resolve(newGameFolderPath, 'assets', 'scripts', 'gameConfig.ts');
            if (fs.existsSync(gameConfigPath)) {
                let content = fs.readFileSync(gameConfigPath, 'utf-8');
                content = content.replace(/gameID: \d+,/g, `gameID: ${newGameId},`);
                content = content.replace(/initBundleName: '.*',/g, `initBundleName: 'bundle${newSuffix}',`);
                fs.writeFileSync(gameConfigPath, content);
                console.log(`  gameID: ${newGameId}`);
                console.log(`  initBundleName: 'bundle${newSuffix}'`);
                console.log('  gameConfig.ts 修改完成\n');
            }

            // 步骤7: 修改 panel + newSuffix.prefab
            console.log(`步骤7: 修改 panel${newSuffix}.prefab...`);
            let gamePanelPath = path.resolve(newGameFolderPath, 'assets', `bundle${newSuffix}`, 'prefabs', `panel${newSuffix}.prefab`);
            if (fs.existsSync(gamePanelPath)) {
                let content = fs.readFileSync(gamePanelPath, 'utf-8');
                content = content.replace(/"gameId":\s*\d+\s*,/g, `"gameId": ${newGameId},`);
                fs.writeFileSync(gamePanelPath, content);
                console.log(`  gameId: ${newGameId}`);
                console.log(`  panel${newSuffix}.prefab 修改完成\n`);
            }

            // 步骤8: 修改资源 UUID（保证关联不丢失）
            console.log('\n步骤8: 修改资源 UUID...');
            let uuidMap = new Map(); // 存储旧UUID到新UUID的映射
            
            // 生成新的 UUID
            function generateUUID() {
                const chars = '0123456789abcdef';
                const sections = [8, 4, 4, 4, 12];
                let uuid = '';
                for (let i = 0; i < sections.length; i++) {
                    if (i > 0) uuid += '-';
                    for (let j = 0; j < sections[i]; j++) {
                        uuid += chars[Math.floor(Math.random() * 16)];
                    }
                }
                return uuid;
            }

            // 步骤8.1: 扫描所有 .meta 文件，建立 UUID 映射表
            console.log('  8.1 - 扫描并生成新的 UUID 映射表...');
            
            // 不应该修改 UUID 的文件类型（脚本文件）
            const scriptExtensions = ['.ts', '.js'];
            let skippedScriptCount = 0;
            
            function scanAndGenerateUUIDMap(dir) {
                let files = fs.readdirSync(dir);
                for (let file of files) {
                    let fullPath = path.join(dir, file);
                    let stat = fs.statSync(fullPath);
                    
                    if (stat.isDirectory()) {
                        // 递归扫描子目录
                        scanAndGenerateUUIDMap(fullPath);
                    } else if (file.endsWith('.meta')) {
                        // 获取对应的源文件名
                        let sourceFileName = file.replace('.meta', '');
                        let sourceExt = path.extname(sourceFileName);
                        
                        // 跳过脚本文件的 UUID 修改
                        if (scriptExtensions.includes(sourceExt)) {
                            skippedScriptCount++;
                            continue;
                        }
                        
                        // 读取 .meta 文件
                        try {
                            let content = fs.readFileSync(fullPath, 'utf-8');
                            let metaData = JSON.parse(content);
                            
                            // 如果有 uuid 字段，生成新的 UUID
                            if (metaData.uuid) {
                                let oldUUID = metaData.uuid;
                                let newUUID = generateUUID();
                                uuidMap.set(oldUUID, newUUID);
                            }
                            
                            // 处理子资源的 UUID（如图集中的精灵帧）
                            if (metaData.subMetas) {
                                for (let key in metaData.subMetas) {
                                    let subMeta = metaData.subMetas[key];
                                    if (subMeta.uuid) {
                                        let oldUUID = subMeta.uuid;
                                        let newUUID = generateUUID();
                                        uuidMap.set(oldUUID, newUUID);
                                    }
                                }
                            }
                        } catch (e) {
                            console.warn(`    警告: 解析 ${file} 失败:`, e.message);
                        }
                    }
                }
            }
            
            // 只扫描新游戏包目录
            scanAndGenerateUUIDMap(newBundlePath);
            console.log(`    已生成 ${uuidMap.size} 个 UUID 映射`);
            console.log(`    已跳过 ${skippedScriptCount} 个脚本文件（保持原有 UUID）`);

            // 步骤8.2: 更新所有 .meta 文件中的 UUID
            console.log('  8.2 - 更新 .meta 文件中的 UUID...');
            function updateMetaUUIDs(dir) {
                let files = fs.readdirSync(dir);
                let updatedCount = 0;
                
                for (let file of files) {
                    let fullPath = path.join(dir, file);
                    let stat = fs.statSync(fullPath);
                    
                    if (stat.isDirectory()) {
                        updatedCount += updateMetaUUIDs(fullPath);
                    } else if (file.endsWith('.meta')) {
                        try {
                            let content = fs.readFileSync(fullPath, 'utf-8');
                            let metaData = JSON.parse(content);
                            let modified = false;
                            
                            // 更新主 UUID
                            if (metaData.uuid && uuidMap.has(metaData.uuid)) {
                                metaData.uuid = uuidMap.get(metaData.uuid);
                                modified = true;
                            }
                            
                            // 更新子资源 UUID
                            if (metaData.subMetas) {
                                for (let key in metaData.subMetas) {
                                    let subMeta = metaData.subMetas[key];
                                    if (subMeta.uuid && uuidMap.has(subMeta.uuid)) {
                                        subMeta.uuid = uuidMap.get(subMeta.uuid);
                                        modified = true;
                                    }
                                }
                            }
                            
                            if (modified) {
                                fs.writeFileSync(fullPath, JSON.stringify(metaData, null, 2));
                                updatedCount++;
                            }
                        } catch (e) {
                            console.warn(`    警告: 更新 ${file} 失败:`, e.message);
                        }
                    }
                }
                return updatedCount;
            }
            
            let metaUpdatedCount = updateMetaUUIDs(newBundlePath);
            console.log(`    已更新 ${metaUpdatedCount} 个 .meta 文件`);

            // 步骤8.3: 更新所有引用文件中的 UUID
            console.log('  8.3 - 更新引用文件中的 UUID...');
            function updateReferencesUUIDs(dir) {
                let files = fs.readdirSync(dir);
                let updatedCount = 0;
                // 需要更新引用的文件类型
                const refFileExtensions = ['.prefab', '.fire', '.anim', '.scene', '.ts', '.js'];
                
                for (let file of files) {
                    let fullPath = path.join(dir, file);
                    let stat = fs.statSync(fullPath);
                    
                    if (stat.isDirectory()) {
                        updatedCount += updateReferencesUUIDs(fullPath);
                    } else {
                        let ext = path.extname(file);
                        if (refFileExtensions.includes(ext)) {
                            try {
                                let content = fs.readFileSync(fullPath, 'utf-8');
                                let originalContent = content;
                                
                                // 替换所有旧 UUID 为新 UUID
                                uuidMap.forEach((newUUID, oldUUID) => {
                                    // 匹配各种 UUID 引用格式
                                    content = content.replace(new RegExp(oldUUID, 'g'), newUUID);
                                });
                                
                                if (content !== originalContent) {
                                    fs.writeFileSync(fullPath, content);
                                    updatedCount++;
                                }
                            } catch (e) {
                                console.warn(`    警告: 更新引用 ${file} 失败:`, e.message);
                            }
                        }
                    }
                }
                return updatedCount;
            }
            
            let refUpdatedCount = updateReferencesUUIDs(newBundlePath);
            console.log(`    已更新 ${refUpdatedCount} 个引用文件`);
            console.log('资源 UUID 修改完成（所有关联已保持）\n');

            // 步骤9: 安装 npm 依赖
            console.log('步骤9: 安装 npm 依赖...');
            proc.execSync(`start cmd /k "cd ${newGameFolderPath} && npm install && exit"`);
            
            // 步骤10: 初始化并推送到 git 仓库
            console.log('\n步骤10: 初始化 git 仓库并推送...');
            let toGitPath = `https://git.dreamgames.app/zmgame/clients/game_${newGameId}.git`;
            var cmd = `start cmd /k "cd ${newGameFolderPath}`;
            cmd += ` && git checkout -b dev`;  // 创建并切换到dev分支
            cmd += ` && git add .`;
            cmd += ` && git commit -m "init: 初始化项目 game_${newGameId}"`;
            cmd += ` && git remote add origin ${toGitPath}`;
            // 先 fetch 检查远程分支
            cmd += ` && git fetch origin`;
            // 如果远程有 dev 分支则合并
            cmd += ` && (git branch -r | findstr "origin/dev" && git merge origin/dev --allow-unrelated-histories --no-edit -m "merge: 合并远程dev分支" || echo 远程dev分支不存在)`;
            cmd += ` && git push -u origin dev`;  // 推送到远程dev分支
            cmd += ` && @echo. && @echo ====== 项目创建完成！====== && @echo 项目路径: ${newGameFolderPath} && @echo Git仓库: ${toGitPath} && @ping 127.0.0.1 -n 3 >nul && exit"`;
            proc.execSync(cmd);

            console.log('\n====== 所有步骤执行完毕 ======');
            console.log(`项目路径: ${newGameFolderPath}`);
            console.log(`Git 仓库: ${toGitPath}`);
            console.log('============================\n');

            cb();
        })
}