const rootDir = process.cwd();

module.exports = function (cb) {
    const fs = require("fs");
    var proc = require('child_process');
    const path = require("path");

    let game_id = process.argv[3].replace('--', '');

    let destFolderPatn = path.resolve(rootDir, '../', `game_${game_id}`);
    if (!fs.existsSync(destFolderPatn)) {
        console.log(`项目id：game_${game_id} 不存在`);
        return;
    }

    const isWindows = process.platform === 'win32';
    let slotLibNames = ['bundleSlotFrame', 'bundleZmBase'];
    for (let i = 0; i < slotLibNames.length; i++) {
        const bundle = slotLibNames[i];
        let sourceFolderPath = path.resolve(destFolderPatn, 'assets', `${bundle}`);

        if (fs.existsSync(sourceFolderPath)) {
            let cmd;
            if (isWindows) {
                cmd = `start cmd /k "cd ${sourceFolderPath}`;
                cmd += ` && git reset --hard origin/dev`;
                cmd += ` && git pull origin dev`; // 拉取子模块
                cmd += ` && exit"`;
            } else {
                // Mac/Linux
                cmd = `cd ${sourceFolderPath} && git reset --hard origin/dev && git pull origin dev`;
            }
            proc.execSync(cmd, { shell: isWindows ? 'cmd.exe' : '/bin/bash' });
        }else{
            let cmd;
            if (isWindows) {
                cmd = `start cmd /k "cd ${destFolderPatn}`;
                cmd += ` && git init`;
                cmd += ` && git submodule update --init --recursive `; // 拉取子模块
                cmd += ` && cd assets/${bundle}`; // 拉取子模块
                cmd += ` && git checkout dev`; // 切换到dev分支
                cmd += ` && git pull`; // 拉取子模块
                cmd += ` && exit"`;
            } else {
                // Mac/Linux
                cmd = `cd ${destFolderPatn} && git init && git submodule update --init --recursive && cd assets/${bundle} && git checkout dev && git pull`;
            }
            proc.execSync(cmd, { shell: isWindows ? 'cmd.exe' : '/bin/bash' });
        }
    }
    cb();
}