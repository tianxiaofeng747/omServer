/**
 * Author: jiping
 * Date: 2014-12-11
 * Email: jiping.yjp@taobao.com
 * 初始化项目环境
 */
var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var prompt = require('cli-prompt');
var color = require('cli-color');
var chalk = require('chalk');
var spawn = require('cross-spawn');
var rmdirSync = require('rmdir-recursive').sync;
var copyFiles = require('./util/cli-copy');
var ENV = require('./util/env');

var FLAG = ENV.flag;
var BASE_REGEXP = ENV.base_regexp;


/**
 * 创建目录
 * @param path {String} 目录路径
 */
var createDir = function(path){
    return new Promise(function(resolve, reject){
        var exists = fs.existsSync(path);
        if (exists) {
            rmdirSync(path);
        }
        fs.mkdirSync(path);
        console.log('Directory ' + path.match(BASE_REGEXP)[0] + ' is ' + color.green('created'));
        resolve();
    })
};

exports.run = function(commandar){
    if (commandar === 'doc') {
        prompt.multi([
          {
            label: chalk.blue.bold(FLAG + 'Update Doc module ?'),
            key: 'isOK',
            type: 'boolean'
          }
        ], function(obj) {
            if (obj.isOK) {
                try {
                    var destDir = path.join(process.cwd(), 'demo/docs');

                    createDir(destDir).then(function() {
                        console.log(chalk.green.bold('update starting'));
                        var srcDir = path.join(__dirname, 'initFiles/demo/docs');
                        var destDir = path.join(process.cwd(), 'demo/docs');
                        var copy = copyFiles(srcDir, destDir, obj);
                        copy.on('complete', function(){
                            var nicoCfg = fs.readFileSync(path.join(__dirname, 'initFiles/nico.json'));
                            fs.writeFileSync(path.join(process.cwd(), 'nico.json'), nicoCfg);
                            console.log(chalk.green.bold('update finished'));
                        });
                    })
                } catch (e){
                    console.log(e.message);
                }
            } else {

            }
        }, console.error);
    }
};