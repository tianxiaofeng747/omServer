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
var ejs = require('ejs');
var ENV = require('./util/env');

var gitlab = new Gitlab({
    url: 'http://gitlab.alibaba-inc.com/',
    token: ENV.token
});
var TEMPLATE_PATH = path.join(__dirname, 'template');

/**
 * 获取仓库最新tag
 * @param id {String} 仓库id
 * @param type {String} 组件类型
 * @param name {String} 组件名称
 */
function getTag(id, type, name){
    return new Promise(function(resolve, reject){
        gitlab.projects.listTags({
            id: encodeURIComponent(id)
        }, function(tags) {
            if (tags) {
                console.log(ENV.flag + 'update ' + id + ' tag ' + color.green('done'));
                resolve({
                    version: tags[0].name.split('/')[1],
                    moduleName: type + '.' + name,
                    fileName: name,
                    filePath: type + '-' + name
                });
            } else {
                console.log(ENV.flag + 'update ' + id + ' tag ' + color.red('failed'));
                console.log('please update tags again');
                reject();
            }
        });
    });
}

exports.run = function(callback){
    try {
        var omBuffer = fs.readFileSync(ENV.base_path + '/om.json');
        var om = JSON.parse(omBuffer.toString());
        var libList = om.options.lib;
        var ctrlList = om.options.ctrl;
        var fnList = [];
        console.log('update tag starting......');
        libList.forEach(function(name, i){
            var id = 'mtb/lib-' + name;
            fnList.push(getTag(id, 'lib', name));
        });
        ctrlList.forEach(function(name, i){
            var id = 'mtb/ctrl-' + name;
            fnList.push(getTag(id, 'ctrl', name));
        });
        new Promise.all(fnList).then(function(tagList){
            var TPL = fs.readFileSync(TEMPLATE_PATH + '/config.ejs').toString();
            var packageConfig = ejs.render(TPL, {tagList: tagList});
            var configPath = ENV.base_path + '/src/config.js';
            // 更新config.js
            fs.writeFileSync(configPath, packageConfig.replace(/^[ \t]*\n/g, ''));
            console.log('update tag completed......');
            callback && callback();
        }, function(){
            console.log('getTags error');
        });
    } catch(e){
        console.log('getTags error');
    }
};