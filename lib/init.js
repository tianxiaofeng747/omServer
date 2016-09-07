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
var spawn = require('cross-spawn');
var copyFiles = require('./util/cli-copy');
var env = require('./util/env');

var FLAG = env.flag;
var param = {};

/**
 * 获取创建者的名字
 * @returns {Promise}
 */
var getAuthor = function(){
    return new Promise(function(resolve){
        prompt(color.cyan(FLAG + 'The name of the author?'), function (val) {
            param.author = val.trim();
            resolve();
        });
    });
};

/**
 * 获取默认项目模板引擎
 * @returns {Promise}
 */
var getTemplateType = function(){
    return new Promise(function(resolve, reject) {
        var selectShell = require('./util/cli-select');
        var select = selectShell();
        select.option(FLAG + 'The type of the stylesheet？')
            .option('mustache')
            .option('artTemplate')
            .option('lala')
            .list();

        select.on('select', function(options){
            param.templateType = options.text;
            resolve();
        });
    });
};

/**
 * 获取项目名称
 * @returns {Promise}
 */
var getProjectName = function(){
    return new Promise(function(resolve){
        prompt(color.cyan(FLAG + 'The name of the project?'), function (val) {
            param.author = val.trim();
            resolve();
        });
    });
};

exports.run = function(){

    prompt.multi([
      {
        label: color.cyan(FLAG + 'The name of the author?'),
        key: 'author',
        validate: function(val) {
            if (val.trim().length == 0) throw new Error(color.red(FLAG + 'the name of the author must be required'));
        }
      },
      {
        label: color.cyan(FLAG + 'Input Current Project Name'),
        key: 'name',
        default: path.basename(process.cwd())
      },
      {
        label: color.cyan(FLAG + 'The version of project'),
        key: 'version',
        default: '0.0.1'
      },
      {
        label: color.cyan(FLAG + 'The description of project'),
        key: 'description',
        default: path.basename(process.cwd()) + 'brief infomation'
      },
      {
        label: 'is this ok?',
        key: 'isOK',
        type: 'boolean'
      }
    ], function(obj) {
        if (obj.isOK) {
            try{
                console.log('init starting');
                var srcDir = path.join(__dirname, 'initFiles');
                var destDir = process.cwd();
                var copy = copyFiles(srcDir, destDir, obj);
                copy.on('complete', function(){
                    console.log('init Finished');

                    //是否安装依赖
                    prompt.multi([
                        {
                            label: color.cyan(FLAG + 'Skip install the dependencies?'),
                            key: 'skipInstall',
                            type: 'boolean'
                        }
                    ], function(obj) {
                        if (obj.skipInstall) {
                            spawn('cnpm', ['install'], { stdio: 'inherit' }).on('exit', function(){
                                console.log('install Finished!');

                                //是否启动本地服务
                                prompt.multi([
                                    {
                                        label: color.cyan(FLAG + 'Launch OM Local Server?'),
                                        key: 'launchServer',
                                        type: 'boolean'
                                    }
                                ], function(obj) {
                                    if (obj.launchServer) {
                                        spawn('om', ['server'], { stdio: 'inherit' });
                                    }
                                }, console.error);

                            })
                        }
                    }, console.error);
                });
            } catch (e){
                console.log(e.message);
            }
        } else {

        }
    }, console.error);
};