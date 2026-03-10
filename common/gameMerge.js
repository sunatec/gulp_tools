const rootDir = process.cwd();

module.exports = function (cb) {
    const fs = require("fs");
    const proc = require('child_process');
    const path = require("path");

    // 获取游戏ID列表参数
    let gameIdsArg = process.argv[3];
    if (!gameIdsArg || !gameIdsArg.startsWith('--')) {
        console.log('❌ 错误：请提供游戏ID参数');
        console.log('使用方法: gulp gameMerge --100120,100123');
        cb();
        return;
    }

    // 解析游戏ID列表
    let gameIds = gameIdsArg.replace('--', '').split(',').map(id => id.trim()).filter(id => id);
    
    if (gameIds.length === 0) {
        console.log('❌ 错误：未找到有效的游戏ID');
        cb();
        return;
    }

    console.log(`\n📋 准备合并 ${gameIds.length} 个游戏仓库：${gameIds.join(', ')}\n`);

    // 临时目录用于克隆仓库
    const tempDir = path.resolve(rootDir, '.temp_merge');
    
    // 确保临时目录存在
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    let successCount = 0;
    let failCount = 0;
    const results = [];

    // 处理每个游戏ID
    for (let i = 0; i < gameIds.length; i++) {
        const gameId = gameIds[i];
        console.log(`\n${'='.repeat(60)}`);
        console.log(`[${i + 1}/${gameIds.length}] 处理游戏 ID: ${gameId}`);
        console.log(`${'='.repeat(60)}\n`);

        const repoUrl = `https://git.dreamgames.app/zmgame/clients/game_${gameId}.git`;
        const repoPath = path.resolve(tempDir, `game_${gameId}`);

        try {
            // 1. 清理旧的临时目录
            if (fs.existsSync(repoPath)) {
                console.log(`🗑️  清理旧的临时目录...`);
                deleteDirectory(repoPath);
            }

            // 2. 克隆仓库
            console.log(`📥 克隆仓库: ${repoUrl}`);
            execCommand(`git clone ${repoUrl} ${repoPath}`, rootDir);

            // 3. 获取所有分支
            console.log(`🔍 检查分支...`);
            const branches = execCommand('git branch -r', repoPath)
                .split('\n')
                .map(b => b.trim().replace('origin/', ''))
                .filter(b => b && b !== 'HEAD');

            console.log(`   找到远程分支: ${branches.join(', ')}`);

            const hasRelease = branches.includes('release');
            const hasPre = branches.includes('pre');

            // 4. 检查 release 分支是否存在
            if (!hasRelease) {
                throw new Error(`❌ 仓库没有 release 分支，跳过合并`);
            }

            console.log(`✅ release 分支存在`);

            // 5. 切换到 release 分支
            console.log(`🔄 切换到 release 分支...`);
            execCommand('git checkout release', repoPath);
            execCommand('git pull origin release', repoPath);

            // 6. 处理 pre 分支
            if (!hasPre) {
                console.log(`⚠️  pre 分支不存在，从 release 创建新分支...`);
                execCommand('git checkout -b pre', repoPath);
                execCommand('git push -u origin pre', repoPath);
                console.log(`✅ 成功创建并推送 pre 分支`);
            } else {
                console.log(`✅ pre 分支存在`);
                
                // 7. 切换到 pre 分支
                console.log(`🔄 切换到 pre 分支...`);
                execCommand('git checkout pre', repoPath);
                execCommand('git pull origin pre', repoPath);

                // 8. 合并 release 到 pre
                console.log(`🔀 合并 release 分支到 pre 分支...`);
                try {
                    execCommand('git merge origin/release --no-edit', repoPath);
                    console.log(`✅ 合并成功`);
                } catch (mergeError) {
                    // 检查是否有冲突
                    const status = execCommand('git status', repoPath);
                    if (status.includes('Unmerged paths') || status.includes('both modified')) {
                        throw new Error(`❌ 合并冲突，需要手动解决冲突\n${status}`);
                    }
                    throw mergeError;
                }

                // 9. 推送到远程
                console.log(`📤 推送到远程 pre 分支...`);
                execCommand('git push origin pre', repoPath);
                console.log(`✅ 推送成功`);
            }

            console.log(`\n✅ 游戏 ${gameId} 处理完成！\n`);
            successCount++;
            results.push({ gameId, status: 'success', message: '合并成功' });

        } catch (error) {
            console.error(`\n❌ 游戏 ${gameId} 处理失败: ${error.message}\n`);
            failCount++;
            results.push({ gameId, status: 'failed', message: error.message });
        } finally {
            // 清理临时目录
            if (fs.existsSync(repoPath)) {
                try {
                    // 等待一下确保Git进程释放文件
                    console.log(`🗑️  清理临时目录...`);
                    setTimeout(() => {}, 100);
                    deleteDirectory(repoPath);
                } catch (cleanError) {
                    console.warn(`⚠️  清理临时目录失败: ${cleanError.message}`);
                    console.warn(`   请手动删除: ${repoPath}`);
                }
            }
        }
    }

    // 输出汇总结果
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 合并结果汇总`);
    console.log(`${'='.repeat(60)}\n`);
    console.log(`总计: ${gameIds.length} 个游戏`);
    console.log(`✅ 成功: ${successCount} 个`);
    console.log(`❌ 失败: ${failCount} 个\n`);

    if (results.length > 0) {
        console.log(`详细结果:`);
        results.forEach(result => {
            const icon = result.status === 'success' ? '✅' : '❌';
            console.log(`  ${icon} 游戏 ${result.gameId}: ${result.message}`);
        });
    }

    console.log(`\n${'='.repeat(60)}\n`);

    // 清理临时目录
    if (fs.existsSync(tempDir)) {
        try {
            console.log(`🗑️  正在清理临时目录...`);
            deleteDirectory(tempDir);
            console.log(`✅ 已清理临时目录\n`);
        } catch (error) {
            console.warn(`⚠️  清理临时目录失败: ${error.message}`);
            console.warn(`   请手动删除目录: ${tempDir}\n`);
        }
    }

    cb();
};

// 执行命令的辅助函数
function execCommand(command, cwd) {
    const proc = require('child_process');
    try {
        const result = proc.execSync(command, {
            cwd: cwd,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        return result;
    } catch (error) {
        throw new Error(`命令执行失败: ${command}\n${error.message}`);
    }
}

// 递归删除目录的辅助函数（Windows优化版本）
function deleteDirectory(dirPath) {
    const fs = require("fs");
    const path = require("path");
    const proc = require('child_process');
    
    if (!fs.existsSync(dirPath)) {
        return;
    }

    try {
        // 在Windows下使用rmdir命令更可靠
        if (process.platform === 'win32') {
            // 使用 /S 删除目录树，/Q 静默模式
            proc.execSync(`rmdir /S /Q "${dirPath}"`, { 
                encoding: 'utf8',
                stdio: 'ignore'
            });
        } else {
            // Unix/Linux 系统使用 rm -rf
            proc.execSync(`rm -rf "${dirPath}"`, { 
                encoding: 'utf8',
                stdio: 'ignore'
            });
        }
    } catch (error) {
        // 如果命令失败，尝试使用Node.js方式删除
        try {
            deleteDirectoryRecursive(dirPath);
        } catch (err) {
            console.warn(`⚠️  无法删除目录 ${dirPath}: ${err.message}`);
        }
    }
}

// Node.js递归删除（备用方案）
function deleteDirectoryRecursive(dirPath) {
    const fs = require("fs");
    const path = require("path");
    
    if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach((file) => {
            const curPath = path.join(dirPath, file);
            try {
                const stat = fs.lstatSync(curPath);
                if (stat.isDirectory()) {
                    deleteDirectoryRecursive(curPath);
                } else {
                    // 移除只读属性
                    try {
                        fs.chmodSync(curPath, 0o666);
                    } catch (e) {
                        // 忽略权限修改错误
                    }
                    fs.unlinkSync(curPath);
                }
            } catch (e) {
                console.warn(`⚠️  无法删除文件 ${curPath}: ${e.message}`);
            }
        });
        fs.rmdirSync(dirPath);
    }
}
