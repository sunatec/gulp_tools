/**
 * 资源加密
 */
module.exports = function encryptImage(cb) {
    const fs = require("fs");
    const path = require("path");

    if (process.argv.length < 4) {
        console.log(`请输入相应的参数，示例：gulp encryptImage --MoneyComing`);
        return;
    }
    
    let targetName = process.argv[3].replace('--', '');
    let projectPath = `../${targetName}/`;

    const encryType = [
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".webp",
    ];

    let uuidRegex = /[a-f\d]{8}(-[a-f\d]{4}){4}[a-f\d]{8}/gi;//正则表达式检测uuid
    let readUuidRegex = /"uuid": "[a-f\d]{8}(-[a-f\d]{4}){4}[a-f\d]{8}"/gi;//正则表达式检测uuid  找到meta uuid

    // 加密函数
    function encryptArrayBuffer(arrayBuffer, key) {
        const keyBytes = new TextEncoder().encode(key);
        const keyLength = keyBytes.length;
        const dataView = new DataView(arrayBuffer);

        for (let i = 0; i < arrayBuffer.byteLength; i++) {
            dataView.setUint8(i, dataView.getUint8(i) ^ keyBytes[i % keyLength]);
        }

        return dataView.buffer;
    }

    // 将大数转换为255以内的数并记录
    function convertTo255(number) {
        let result = [];
        while (number > 0) {
            let high = Math.floor(number / 255); // 计算高位，即原始数除以255的商
            let low = number % 255; // 计算低位，即原始数除以255的余数
            result.push(low); // 将低位记录下来
            number = high; // 将高位作为下一个数继续处理
        }
        return result;
    }

    /**
     * 加密文件
     */
    function encryptFile(fileBuffer) {
        const fileBufferLen = fileBuffer.length;//文件数据长
        const offsetIndex = Math.floor(Math.random() * fileBufferLen);//插入位置
        const insertNum = Math.floor(Math.random() * 155 + 100);//插入长度
        const header = convertTo255(offsetIndex);//头部元数据
        const headerLength = header.length;//头部元数据长
        const tailLen = Math.floor(Math.random() * 10 + 16);//尾部数据长度
        const tailDataList = [];//尾部元数据
        for (let i = tailLen - 1; i >= 0; --i) {
            if (i == tailLen - 1) {
                tailDataList[i] = tailLen;
                continue;
            }
            if (i == tailLen - 2) {
                tailDataList[i] = headerLength;
                continue;
            }
            if (i == tailLen - 3) {
                tailDataList[i] = insertNum;
                continue;
            }
            if (i == tailLen - 4) {
                tailDataList[i] = tailDataList[tailLen - 3] ^ tailDataList[tailLen - 2];
                continue;
            }
            if (i == tailLen - 5) {
                tailDataList[i] = (tailDataList[tailLen - 4] * tailDataList[tailLen - 2]) >> tailDataList[tailLen - 2];
                continue;
            }
            if (i == tailLen - 6) {
                tailDataList[i] = Math.abs(tailDataList[tailLen - 4] - tailDataList[tailLen - 5]);
                continue;
            }
            tailDataList[i] = Math.floor(Math.random() * 255);
        }

        const totalLen = headerLength + insertNum + fileBufferLen + tailLen;//总数据长
        let newBuffer = new ArrayBuffer(totalLen);
        const byteLen = newBuffer.byteLength;
        let bufferDataview = new DataView(newBuffer);
        for (let u = 0; u < byteLen - tailLen; u++) {
            if (u < headerLength) {//头部元数据
                bufferDataview.setUint8(u, header[u]);
            } else if (u < headerLength + offsetIndex) {//第一段原数据
                bufferDataview.setUint8(u, fileBuffer[u - headerLength]);
            } else if (u < headerLength + offsetIndex + insertNum) {//插入数据
                let value = Math.floor(Math.random() * 255);
                bufferDataview.setUint8(u, value);
            } else if (u < totalLen - tailLen) {//第二段原数据
                bufferDataview.setUint8(u, fileBuffer[u - insertNum - headerLength]);
            }
        }
        newBuffer = encryptArrayBuffer(newBuffer, 'no_encrypt_key');//加密数据
        for (let i = 0; i < tailLen; i++) {//添加尾部元数据
            //尾部元数据
            bufferDataview.setUint8(headerLength + insertNum + fileBufferLen + i, tailDataList[i]);
        }
        return newBuffer;
    }

    /**图片以二进制数据保存本地，并且随机插入值*/
    function changeTextureToBinary(filePath, extName) {
        let fileBuffer = fs.readFileSync(filePath);
        buffer = encryptFile(fileBuffer);
        let tempbuf = Buffer.from(buffer);

        let newExt = extName + 'epb';
        // console.log(`图片加密处理：`, filePath);
        //原图片文件内容转换为 Base64 字符串
        fs.writeFileSync(
            filePath.replace(extName, newExt),
            tempbuf
        );

        //删除原图片资源
        fs.unlinkSync(filePath);
    }

    function encryptBundle() {
        let bundlePath = `${projectPath}/assets/`;
        if (!fs.existsSync(bundlePath))
            return;

        let noEncryptList = [];

        function getNoEncryptList() {
            //遍历文件夹
            let fileNames = fs.readdirSync(bundlePath);
            for (let fileName of fileNames) {
                if (fs.statSync(`${bundlePath}${fileName}`).isFile())
                    readFile(`${bundlePath}${fileName}`, fileName);
                else loopRead(bundlePath, `${fileName}/`);
            }

            //遍历
            function loopRead(path, dir) {
                let fileNames = fs.readdirSync(`${path}${dir}`);
                for (let fileName of fileNames) {
                    if (fs.statSync(`${path}${dir}${fileName}`).isFile())
                        readFile(`${path}${dir}${fileName}`, fileName);
                    else loopRead(path, `${dir}${fileName}/`);
                }
            }

            function readFile(filePath, fileName) {
                let fileEx = fileName.substring(fileName.lastIndexOf('.') + 1);
                if (fileEx != "meta")
                    return;
                if (fileName.indexOf('___no-encrypt') < 0)
                    return;
                let content = fs.readFileSync(filePath, 'utf-8');
                let matchArray = content.match(readUuidRegex);
                if (matchArray && matchArray.length > 0) {
                    let mArr = matchArray[0].match(uuidRegex);
                    if (mArr && mArr.length > 0)
                        noEncryptList.push(mArr[0]);
                }
            }
        }

        function isNoEncrypt(fileName) {
            for (let i = 0; i < noEncryptList.length; i++) {
                if (fileName.indexOf(noEncryptList[i]) > -1)
                    return true;
            }
            return false;
        }

        //遍历文件夹 查找图片
        function loopReadFiles(folderPath, dir) {
            let _path;
            if (dir && dir != "")
                _path = `${folderPath}${dir}/`;
            else
                _path = folderPath;
            if (!fs.existsSync(_path))
                return;
            let fileNames = fs.readdirSync(_path);
            for (let fileName of fileNames) {
                if (fs.statSync(`${_path}${fileName}`).isFile()) {
                    if (!isNoEncrypt(fileName)) {
                        let extname = path.extname(fileName);
                        if (encryType.includes(extname))
                            changeTextureToBinary(`${_path}${fileName}`, path.extname(fileName));
                    }
                }
                else loopReadFiles(_path, fileName);
            }
        }

        getNoEncryptList();

        let bundleBuildPath = `${projectPath}/build/web-mobile/assets/`;
        loopReadFiles(bundleBuildPath, "");
    }

    encryptBundle();

    console.log('==============================encrypt texture success!==============================');
    cb();
}