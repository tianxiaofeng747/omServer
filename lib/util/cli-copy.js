/**
 * Created by jiping on 15-1-3.
 */
var eventEmitter = require('events').EventEmitter;
var fs = require('fs');
var path = require('path');
var es = require('event-stream');
var prompt = require('cli-prompt');
var color = require('cli-color');
var env = require('./env');
var sub = require('substituter');

var BASE_REGEXP = env.base_regexp;
var FLAG = env.flag;

function CopyFile(src, dest, rawObj){
    // 读取目录中的所有文件/目录
    this.filePaths[dest] = fs.readdirSync(src);
    this.index[dest] = 0;
    this.doCopy(src, dest, rawObj);
}

/**
 * Inherit from `EventEmitter.prototype`.
 */
CopyFile.prototype.__proto__ = eventEmitter.prototype;

CopyFile.prototype.index = {};

CopyFile.prototype.filePaths = {};

CopyFile.prototype.doCopy = function(src, dest, rawObj){
    var self = this;
    var filePath = self.filePaths[dest] ? self.filePaths[dest][self.index[dest]] : '';
    var parentDirSrc = path.resolve(src, '../');
    var parentDirDest = path.resolve(dest, '../');

    if (!filePath) {// 当前目录下已copy完成
        if (process.cwd() === dest) {// 当前目录未根目录，表示copy完成
            self.emit('complete');
        } else {// 返回上一级目录继续copy
            self.index[parentDirDest] += 1;
            self.doCopy(parentDirSrc, parentDirDest, rawObj);
        }
    } else {
        var childDirSrc = src + '/' + filePath;
        var childDirDest = dest + '/' + filePath;
        var st = fs.statSync(childDirSrc);
        if(st.isFile()){// 判断是否为文件
            var exists = fs.existsSync(childDirDest);
            if (exists) {
                prompt(color.cyan(FLAG + childDirDest.match(BASE_REGEXP)[0] + ' already exists, is overwrite(Y/N)?'), function (val) {
                    if (val.toUpperCase() === 'Y') {
                        self.createFile(childDirSrc, childDirDest, rawObj);
                    } else {
                        self.index[dest] += 1;
                        self.doCopy(src, dest, rawObj);
                    }
                });
            } else {
                self.createFile(childDirSrc, childDirDest, rawObj);
            }
        } else if (st.isDirectory()){// 如果是目录则递归调用自身
            self.createChildDir(childDirSrc, childDirDest, rawObj);
        }
    }
};

CopyFile.prototype.createFile = function(src, dest, rawObj){
    var self = this;
    // 创建读取流
    var readable = fs.createReadStream(src);
    // 创建写入流
    var writable = fs.createWriteStream(dest);

    // 通过管道来传输流
    readable.pipe(es.map(function (data, cb) {
            data = sub(data, rawObj);
            cb(null, data)
          }))
          .pipe(writable);

    readable.on('end', function() {
        var parentDirSrc = path.resolve(src, '../');
        var parentDirDest = path.resolve(dest, '../');

        console.log('File ' + dest.match(BASE_REGEXP)[0] + ' is ' + color.green('created'));

        self.index[parentDirDest] += 1;
        self.doCopy(parentDirSrc, parentDirDest, rawObj);
    });
};

CopyFile.prototype.createChildDir = function(src, dest, rawObj){
    var self = this;
    var parentDirSrc = path.resolve(src, '../');
    var parentDirDest = path.resolve(dest, '../');
    // 读取目录是否存在
    var exists = fs.existsSync(dest);

    if (!exists) {// 不存在目录，则创建目录
        fs.mkdirSync(dest);
        console.log('Directory ' + dest.match(BASE_REGEXP)[0] + ' is ' + color.green('created'));
    }

    // 读取目录中的所有文件/子目录
    self.filePaths[dest] = fs.readdirSync(src);

    if (self.filePaths[dest].length > 0) {// 不是空目录，复制当前目录下文件
        self.index[dest] = 0;
        self.doCopy(src, dest, rawObj);
    } else {// 空目录，返回上级目录继续执行
        self.index[parentDirDest] += 1;
        self.doCopy(parentDirSrc, parentDirDest, rawObj);
    }
};

module.exports = function(src, dest, rawObj){
    return new CopyFile(src, dest, rawObj);
};