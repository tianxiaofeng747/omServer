/**
 * Created by jiping on 15-3-6.
 */
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var express = require('express');
var less = require('less');
//var Px2rem = require('px2rem');
var TmodJS = require('tmodjs');
var rmdirSync = require('rmdir-recursive').sync;
var ENV = require('../../util/env');

var router = express.Router();
// 文件匹配正则
var CSS_REGEXP = new RegExp('\\.css$', 'i');
var LESS_SCSS_REGEXP = new RegExp('\\.less|\\.scss$', 'i');
var JS_REGEXP = new RegExp('\\.js$', 'i');

//var px2remIns = new Px2rem({
//    remUnit: 75,
//    threeVersion: false,
//    remVersion: true,
//    baseDpr: 2,
//    remPrecision: 6
//});
//var omBuffer = fs.readFileSync(ENV.base_path + '/om.json');
//var omJson = JSON.parse(omBuffer.toString());
//var rem = omJson.options.rem;

/**
 * 返回css请求文件
 * @param req {Request} 请求对象
 * @param res {Response} 响应对象
 * @param cssPath {String} 请求地址
 */
function cssFile(req, res, cssPath){
    var file = '';
    var filePath;
    var cssText;
    // 设置response头信息
    res.set({
        'Content-Type': 'text/css'
    });
    // 存在css文件输出css文件
    filePath = cssPath.replace(CSS_REGEXP, '.css');
    if (fs.existsSync(filePath)) {
        //cssText = px2remIns.generateRem(fs.readFileSync(filePath).toString());
        //res.send(cssText);
        res.sendFile(filePath);
        return;
    }
    // 存在less文件输出less文件
    filePath = cssPath.replace(CSS_REGEXP, '.less');
    // less文件处理成css
    if (fs.existsSync(filePath)) {
        file = fs.readFileSync(filePath).toString();
        less.render(file, {
            paths: [path.resolve(filePath, '..')],//[ENV.base_path],  // Specify search paths for @import directives
            compress: false          // Minify CSS output
        }, function (e, output) {
            if (e) {
                res.status(404).send(e.message);
            } else {
                //cssText = px2remIns.generateRem(output.css);
                //res.send(cssText);
                res.send(output.css);
            }
        });
        return;
    }
    // 存在sass文件输出sass文件
    filePath = cssPath.replace(CSS_REGEXP, '.scss');
    // sass文件处理成css
    if (fs.existsSync(filePath)) {
        var child = exec('sass ' + filePath + ' --style expanded -C', function (err, stdout, stderr) {
                if (err) throw err;
            //cssText = px2remIns.generateRem(stdout);
            res.send(stdout);
            });
    } else {
        res.status(404).send('');
    }
}

/**
 * 返回js请求文件
 * @param req {Request} 请求对象
 * @param res {Response} 响应对象
 * @param filePath {String} 请求地址
 * @param module {String} 模块名称
 */
function jsFile(req, res, filePath, module){
    if (fs.existsSync(filePath)) {
        var file = fs.readFileSync(filePath).toString();
        if (module) {
            file = 'define("' + module + '", function(require, exports, module) {\r\n' + file + '\r\n})\r\nseajs.use("' + module + '");'
        } else {
            file = 'define(function(require, exports, module) {\r\n' + file + '\r\n});';
        }
        res.send(file);
    } else {
        res.status(404).send('');
    }
}

/**
 * 返回html模板请求文件
 * @param req {Request} 请求对象
 * @param res {Response} 响应对象
 * @param filePath {String} 请求地址
 */
function templateFile(req, res, filePath){
    var templatePath = filePath.replace(/\.js$/g, '.html');
    var text;
    var result;
    // 设置response头信息
    res.set({
        'Content-Type': 'text/javascript'
    });
    if (fs.existsSync(templatePath)) {
        var tmodjs = new TmodJS('./src', {
            type: 'cmd',
            output: './',
            minify: false
        });
        tmodjs.on('compileError', function (data) {
            console.log('compile template failed');
        });
        result = tmodjs._compile(templatePath).output;
        rmdirSync(filePath);
        res.send(result);
    } else {
        res.status(404).send('');
    }
}

router.get('/page/:name/:type', function (req, res) {
    try {
        var filePath = ENV.base_path + '/src/page/' + req.params.name + '/' + req.params.type;
        if (CSS_REGEXP.test(filePath)) {// css文件
            cssFile(req, res, filePath);
        } else if (LESS_SCSS_REGEXP.test(filePath)){// less/sass文件
            res.redirect(req.originalUrl.replace(LESS_SCSS_REGEXP, '.css'));
        } else if (JS_REGEXP.test(filePath)){// js文件
            if (req.params.type !== 'index.js') { //支持多个js模块 by hanyu(20160805)
                jsFile(req, res, filePath);
            } else {
                jsFile(req, res, filePath, 'src/page/'+ req.params.name + '/index');
            }
        } else {
            res.status(404).send('Not Found');
        }
    } catch (e) {
        res.status(500).send(e.message);
    }
});

//支持增加业务模块 by hanyu(20160805)
router.get('/page/:name/:biz/:type', function (req, res) {
    try {
        var filePath;

        if (req.params.biz === 'tpl') {
            filePath = ENV.base_path + '/src/page/' + req.params.name + '/tpl/' + req.params.type;
        } else {
            filePath = ENV.base_path + '/src/page/' + req.params.name + '/' + req.params.biz + '/' + req.params.type;
        }
        
        if (JS_REGEXP.test(filePath)){// js文件
            if (req.params.biz === 'tpl') {
                templateFile(req, res, filePath);
            } else {
                jsFile(req, res, filePath);
            }
        } else {
            res.status(404).send('Not Found');
        }
    } catch (e) {
        res.status(500).send(e.message);
    }
});

router.get('/components/:name/:type', function (req, res) {
    try {
        var filePath = ENV.base_path + '/src/components/' + req.params.name + '/' + req.params.type;
        if (CSS_REGEXP.test(filePath)) {// css文件
            cssFile(req, res, filePath);
        } else if (LESS_SCSS_REGEXP.test(filePath)){// less/sass文件
            res.redirect(req.originalUrl.replace(LESS_SCSS_REGEXP, '.css'));
        } else if (JS_REGEXP.test(filePath)){// js文件
            jsFile(req, res, filePath);
        } else {
            res.status(404).send('Not Found');
        }
    } catch (e) {
        res.status(500).send(e.message);
    }
});

router.get('/components/:name/tpl/:type', function (req, res) {
    try {

        var filePath = path.join(ENV.base_path,req.originalUrl);
        if(path.sep == '\\'){
            filePath = filePath.replace(/\\/g,'/');
        }
        templateFile(req, res, filePath);
    } catch (e) {
        res.status(500).send(e.message);
    }
});

router.get('/config.js', function (req, res) {
    try {
        var filePath = ENV.base_path + '/src/config.js';
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            res.status(404).send('Not Found');
        }
    } catch (e) {
        res.status(500).send(e.message);
    }
});

router.get('/template.js', function (req, res) {
    try {
        var filePath = ENV.base_path + '/src/template.js';
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            res.status(404).send('Not Found');
        }
    } catch (e) {
        res.status(500).send(e.message);
    }
});

module.exports = router;