/**
 * 同步递归删除目录及其所有内容的函数，也支持删除单个文件
 * @param {string} pathToDelete - 要删除的文件或目录路径
 */
module.exports = function (pathToDelete) {
    var fs = require("fs");
    const path = require('path');
    
    // 检查路径是否存在
    if (!fs.existsSync(pathToDelete)) {
        console.warn(`路径不存在: ${pathToDelete}`);
        return;
    }
    
    // 检查是文件还是目录
    const stats = fs.statSync(pathToDelete);
    
    if (stats.isDirectory()) {
        // 同步递归删除目录及其所有内容的函数
        function deleteDirectoryRecursiveSync(dirPath) {
            // 读取目录中的所有文件和子目录
            const files = fs.readdirSync(dirPath);
        
            // 遍历每一个文件/子目录
            files.forEach(file => {
                const filePath = path.join(dirPath, file);
                const stats = fs.statSync(filePath);
            
                if (stats.isDirectory()) {
                    // 如果是目录，递归删除目录
                    deleteDirectoryRecursiveSync(filePath);
                } else {
                    // 如果是文件，删除文件
                    fs.unlinkSync(filePath);
                }
            });
            
            // 删除目录本身
            fs.rmdirSync(dirPath);
        }
        
        // 调用递归删除函数
        deleteDirectoryRecursiveSync(pathToDelete);
    } else {
        // 如果是文件，直接删除
        fs.unlinkSync(pathToDelete);
    }
}