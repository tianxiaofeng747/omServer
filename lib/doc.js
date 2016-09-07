/**
 * Author: jiping
 * Date: 2014-12-11
 * Email: jiping.yjp@taobao.com
 * 本地更新依赖模块版本号功能
 */
var path = require('path');
var fs = require('fs');
var Gitlab = require('gitlab');
var Promise = require('bluebird');
var color = require('cli-color');
var rmdirSync = require('rmdir-recursive').sync;
var nico = require('nico');
var ENV = require('./util/env');

var gitlab = new Gitlab({
    url: 'http://gitlab.51xianqu.com/',
    token: ENV.token
});
var BASE_REGEXP = ENV.base_regexp;
var loop = 0;

//获取文档名列表
function getDocNames() {
    return new Promise(function(resolve, reject) {
        var docNameList = [];
        gitlab.projects.repository.listTree('backsdg/docs', function(files) {
            if (files.length) {
                files.forEach(function(file) {
                    var ext = file['name'].split('.')[1];
                    if (ext === 'md') {
                        docNameList.push(file.name);
                    }
                })
                resolve(docNameList);
            } else {
                console.log('获取flexible js失败');
                reject();
            }
        });
    });
}

/**
 * 创建目录
 * @param path {String} 目录路径
 */
var createDir = function(path){
    var exists = fs.existsSync(path);
    if (exists) {
        rmdirSync(path);
    }
    fs.mkdirSync(path);
    console.log('Directory ' + path.match(BASE_REGEXP)[0] + ' is ' + color.green('created'));
};

/**
 *
 * @param path {String} 文件路径
 * @param tpl {String} 文件模板
 */
var createFile = function(path, tpl){
    fs.writeFileSync(path, tpl);
    loop += 1;
    console.log('File ' + path.match(BASE_REGEXP)[0] + ' is ' + color.green('created'));
};

//获取具体文档内容
var getFileContent = function(){
    return new Promise(function(resolve, reject) {
        getDocNames().then(function(names) {
            var len = names.length;

            names.forEach(function(name) {
                gitlab.projects.repository.showFile({
                    projectId: 'backsdg/docs',
                    ref: 'master',
                    file_path: name
                }, function(file) {
                    if (file) {
                        createFile(ENV.base_path + '/demo/docs/content/' + name, (new Buffer(file.content, 'base64')).toString());
                        if (loop == len) {
                            resolve();
                        }
                    }
                });
            })
        })
    });
};

exports.run = function(callback){
    try {
        getFileContent().then(function() {
            nico.build({ force: true });
        });
    } catch(e){
        console.log('docs error');
    }
};