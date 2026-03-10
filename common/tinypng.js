/** 
 * 
 * 优化：通过 X-Forwarded-For 添加了动态随机伪IP，绕过 tinypng 的上传数量限制
 * 支持三种模式：
 * 1. 项目ID模式：gulp tinypng --1000001
 * 2. 目录路径模式：gulp tinypng --path=E:/projects/assets
 * 3. 单文件模式：gulp tinypng --path=../game_100042/assets/image.jpg
 * 
 *  */
const rootDir = process.cwd();

module.exports = function (cb) {
    const fs = require('fs');
    const pathReq = require('path');
    const path = require('path');
    const https = require('https');
    const { URL } = require('url');

    // 解析命令行参数
    let targetPath = '';
    let mode = ''; // 'project' 或 'custom_dir' 或 'custom_file'
    let isFile = false;
    
    const arg = process.argv[3] ? process.argv[3] : '';
    const arg2 = process.argv[4] ? process.argv[4] : '';
    
    if (!arg) {
        console.log('错误：请提供参数');
        console.log('使用方法：');
        console.log('  方式1 - 指定项目并压缩assets目录：gulp tinypng --game_1000001 --dir=assets');
        console.log('  方式2 - 指定项目并压缩build/web-mobile目录：gulp tinypng --game_1000001 --dir=build/web-mobile');
        console.log('  方式3 - 指定项目并压缩子目录：gulp tinypng --1000001 --dir=assets/images/ui');
        console.log('  方式4 - 目录压缩：gulp tinypng --path=E:/project/assets');
        console.log('  方式5 - 单文件压缩：gulp tinypng --path=../game_100042/assets/image.jpg');
        cb();
        return;
    }

    // 判断是自定义路径模式还是项目ID模式
    if (arg.startsWith('--path=')) {
        // 自定义路径模式
        targetPath = arg.replace('--path=', '').trim();
        
        // 支持相对路径和绝对路径
        if (!path.isAbsolute(targetPath)) {
            targetPath = path.resolve(rootDir, targetPath);
        }
        
        if (!fs.existsSync(targetPath)) {
            console.log(`错误：指定路径不存在`);
            console.log(`路径：${targetPath}`);
            cb();
            return;
        }
        
        const stat = fs.statSync(targetPath);
        
        if (stat.isFile()) {
            // 单文件模式
            mode = 'custom_file';
            isFile = true;
            
            // 检查是否是图片文件
            const ext = path.extname(targetPath).toLowerCase();
            if (!['.jpg', '.png', '.jpeg'].includes(ext)) {
                console.log(`错误：只支持 .jpg 和 .png 文件`);
                console.log(`当前文件：${targetPath}`);
                cb();
                return;
            }
            
            console.log(`\n开始压缩单个文件`);
            console.log(`文件路径：${targetPath}\n`);
            
        } else if (stat.isDirectory()) {
            // 目录模式
            mode = 'custom_dir';
            console.log(`\n开始压缩目录资源`);
            console.log(`目录路径：${targetPath}\n`);
        }
        
    } else {
        // 项目ID模式
        mode = 'project';
        const game_id = arg.replace('--', '');
        const projectPath = path.resolve(rootDir, '../', `${game_id}`);
        
        if (!fs.existsSync(projectPath)) {
            console.log(`错误：项目 ${game_id} 不存在`);
            console.log(`路径：${projectPath}`);
            cb();
            return;
        }
        
        // 可选第二参数 --dir= 相对项目目录指定资源目录，默认 build/web-mobile
        let dirArg = '';
        if (arg2 && arg2.startsWith('--dir=')) {
            dirArg = arg2.replace('--dir=', '').trim();
        }
        const relDir = dirArg || 'build/web-mobile';
        targetPath = path.join(projectPath, relDir);
        
        if (!fs.existsSync(targetPath)) {
            console.log(`错误：目标资源目录不存在`);
            console.log(`项目：${game_id}`);
            console.log(`尝试路径：${targetPath}`);
            cb();
            return;
        }
        
        console.log(`\n开始压缩项目资源：${game_id}`);
        console.log(`项目路径：${projectPath}`);
        console.log(`资源路径：${targetPath}\n`);
    }

    const exts = ['.jpg', '.png'],
        minSize = 10000,
        maxSize = 5200000;

    const options = {
        method: 'POST',
        hostname: 'tinypng.com',
        path: '/backend/opt/shrink',
        headers: {
            rejectUnauthorized: false,
            'Postman-Token': Date.now(),
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent':
                'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
        }
    };

    var list = [];
    var runFlag = false;
    var intervalTime = 8000;
    var interSign;
    var totalFiles = 0;
    var compressedFiles = 0;
    var failedFiles = 0;

    // 生成随机IP， 赋值给 X-Forwarded-For
    function getRandomIP() {
        return Array.from(Array(4)).map(() => parseInt(Math.random() * 255)).join('.');
    }

    // 如果是单文件模式，直接处理该文件
    if (isFile) {
        const size = fs.statSync(targetPath).size;
        if (size > maxSize) {
            console.log(`文件太大（${(size / 1024 / 1024).toFixed(2)}MB），超过5MB限制`);
            cb();
            return;
        } else if (size < minSize) {
            console.log(`文件太小（${(size / 1024).toFixed(2)}KB），小于10KB不需要压缩`);
            cb();
            return;
        }
        
        totalFiles = 1;
        const fileName = path.basename(targetPath);
        const filePath = path.dirname(targetPath) + path.sep;
        list.push([filePath, fileName]);
        
        console.log(`准备压缩文件：${fileName}\n`);
        startCompress();
        
    } else {
        // 目录模式，遍历文件夹
        var assetsPath = targetPath.endsWith(path.sep) ? targetPath : targetPath + path.sep;

        //遍历文件夹
        var fileNames = fs.readdirSync(assetsPath);
        for (var fileName of fileNames) {
            const filePath = `${assetsPath}${fileName}`;
            if (fs.statSync(filePath).isFile()) {
                if (exts.includes(pathReq.extname(fileName))) {
                    // 检查文件大小
                    var size = fs.statSync(filePath).size;
                    if (size > maxSize) {
                        console.log("【图片太大，跳过】" + filePath);
                        continue;
                    } else if (size < minSize) {
                        continue;
                    }
                    if (filePath.indexOf('bg_blur') >= 0 || fileName.indexOf('launch.jpg') >= 0) {
                        console.log("【模糊图跳过】" + filePath);
                        continue;
                    }
                    totalFiles++;
                    list.push([assetsPath, fileName]);
                }
            }
            else loopRead(assetsPath, `${fileName}/`);
        }

        // 扫描完成后检查是否有文件需要压缩
        if (totalFiles === 0) {
            console.log('\n未找到需要压缩的图片文件');
            console.log('提示：只压缩 10KB~5MB 的 .jpg 和 .png 文件');
            cb();
            return;
        }

        console.log(`\n找到 ${totalFiles} 个文件需要压缩，开始处理...\n`);
        
        // 启动压缩任务
        startCompress();
    }

    //遍历
    function loopRead(path, dir) {
        var fileNames = fs.readdirSync(`${path}${dir}`);
        for (var fileName of fileNames) {
            var file = `${path}${dir}${fileName}`;
            if (fs.statSync(file).isFile()) {
                if (exts.includes(pathReq.extname(fileName))) {
                    var size = fs.statSync(file).size;
                    if (size > maxSize) {
                        console.log("【图片太大，跳过】" + file);
                        continue;
                    } else if (size < minSize) {
                        // console.log("【图片较小不压缩】" + file);
                        continue;
                    }
                    if (file.indexOf('bg_blur') >= 0 || fileName.indexOf('launch.jpg') >= 0) {
                        //模糊图不压缩
                        console.log("【模糊图跳过】" + file);
                        continue;
                    }
                    totalFiles++;
                    list.push([`${path}${dir}`, fileName]);
                }
            }
            else loopRead(path, `${dir}${fileName}/`);
        }
    }

    function startCompress() {
        if (!runFlag) {
            runFlag = true;
            setTimeout(compressOne, 100);
            interSign = setInterval(compressOne, intervalTime);
        }
    }

    function compressOne() {
        if (list.length == 0) {
            clearInterval(interSign);
            console.log(`\n压缩完成！`);
            console.log(`总文件数：${totalFiles}`);
            console.log(`成功：${compressedFiles} | 失败：${failedFiles}`);
            cb();
            return;
        }
        console.log(`⏳ 待压缩：${list.length} 张`);
        var tList = list.shift();
        readPicFile(tList[0], tList[1]);
    }

    //读图片文件
    function readPicFile(filePath, fileName) {
        var file = `${filePath}${fileName}`;

        // 通过 X-Forwarded-For 头部伪造客户端IP
        options.headers['X-Forwarded-For'] = getRandomIP();
        fileUpload(file);
    }

    // 异步API,压缩图片
    // {"error":"Bad request","message":"Request is invalid"}
    // {"input": { "size": 887, "type": "image/png" },"output": { "size": 785, "type": "image/png", "width": 81, "height": 81, "ratio": 0.885, "url": "https://tinypng.com/web/output/7aztz90nq5p9545zch8gjzqg5ubdatd6" }}
    function fileUpload(img) {
        var req = https.request(options, function (res) {
            res.on('data', buf => {
                try {
                    let obj = JSON.parse(buf.toString());
                    if (obj.error) {
                        console.log(`[${img}]：压缩失败！报错：${obj.message}`);
                        failedFiles++;
                    } else {
                        fileUpdate(img, obj);
                    }
                } catch (error) {
                    console.log(`[${img}]：压缩失败！报错：${error}`);
                    failedFiles++;
                }
            });
        });

        req.write(fs.readFileSync(img), 'binary');
        req.on('error', e => {
            console.error("请求报错1：" + img);
            failedFiles++;
        });
        req.end();
    }
    // 该方法被循环调用,请求图片数据
    function fileUpdate(imgpath, obj) {
        let options = new URL(obj.output.url);
        let req = https.request(options, res => {
            let body = '';
            res.setEncoding('binary');
            res.on('data', function (data) {
                body += data;
            });

            res.on('end', function () {
                fs.writeFileSync(imgpath, body, 'binary', err => {
                    if (err) return console.error("写文件报错：" + imgpath);
                    console.log(
                        `[${imgpath}] \n   原始：${obj.input.size}B 压缩后：${obj.output.size}B 优化：${(obj.output.ratio * 100).toFixed(1)}%`
                    );
                    compressedFiles++;
                });
            });
        });
        req.on('error', e => {
            console.error("请求报错2：" + imgpath);
            failedFiles++;
        });
        req.end();
    }
}
