/**
 * Author: jiping
 * Date: 2014-12-11
 * Email: jiping.yjp@taobao.com
 * 添加components或page模块
 */
var fs = require('fs');
var path = require('path');
var prompt = require('cli-prompt');
var color = require('cli-color');
var Promise = require('bluebird');
var rmdirSync = require('rmdir-recursive').sync;
var Gitlab = require('gitlab');
var ejs = require('ejs');
var ENV = require('./util/env');

var BASE_REGEXP = ENV.base_regexp;
var FLAG = ENV.flag;
var BASE_PATH = ENV.base_path;
var TEMPLATE_PATH = path.join(__dirname, 'template');

var gitlab = new Gitlab({
    url: 'http://gitlab.51xianqu.com/',
    token: ENV.token
});
var param = {};

function Add(){}

/**
 *
 * @param name {String} 页面名称
 */
Add.prototype.page = function(name){
    var self = this;
    // 创建的页面html文件路径
    var pageHtmlPath = BASE_PATH + '/demo/' + name + '.html';
    // 创建的页面assets入口文件路径
    var pageAsstesPath = BASE_PATH + '/src/page/' + name;
    // 页面html文件是否存在
    var pageHtmlExists = fs.existsSync(pageHtmlPath);
    // 页面assets入口文件是否存在
    var pageAssetsExists = fs.existsSync(pageAsstesPath);

    param.name = name;
    param.date = getDate();

    if (pageHtmlExists || pageAssetsExists) {// 已存在
        prompt(color.cyan(FLAG + name + ' page already exists, is overwrite(Y/N)?'), function (val) {
            if (val.toUpperCase() === 'Y') {// 覆盖
                self.pageInit(pageHtmlPath, pageAsstesPath);
            } else {// 不覆盖
                console.log(color.cyan('You did not create the page!'));
            }
        });
    } else {// 未存在
        self.pageInit(pageHtmlPath, pageAsstesPath);
    }
};

/**
 *
 * @param name {String} components名称
 */
Add.prototype.components = function(name){
    var self = this;
    // 创建的components assets入口文件路径
    var componentsAsstesPath = BASE_PATH + '/src/components/' + name;
    // components assets入口文件是否存在
    var componentsAssetsExists = fs.existsSync(componentsAsstesPath);

    param.name = name;
    param.date = getDate();

    if (componentsAssetsExists) {// 已存在
        prompt(color.cyan(FLAG + name + ' components already exists, is overwrite(Y/N)?'), function (val) {
            if (val.toUpperCase() === 'Y') {// 覆盖
                self.componentsInit(componentsAsstesPath);
            } else {// 不覆盖
                console.log(color.cyan('You did not create the page!'));
            }
        });
    } else {// 未存在
        self.componentsInit(componentsAsstesPath);
    }
};

/**
 *
 * @param htmlPath {String} 页面路径
 * @param assetsPath {String} 页面入口assets路径
 */
Add.prototype.pageInit = function(htmlPath, assetsPath){
    getAuthor()
        .then(getPageTitle)
        .then(getDescription)
        .then(getStyleType)
        .then(getFlexibleJS)
        .then(getFlexibleCSS)
        .then(function(){
            var jsPath = assetsPath + '/index.js';
            var stylePath = assetsPath + '/index.' + (param.styleType === 'sass' ? 'scss' : param.styleType);
            var htmlTPL = fs.readFileSync(TEMPLATE_PATH + '/html.ejs').toString();
            var jsTPL = fs.readFileSync(TEMPLATE_PATH + '/pagejs.ejs').toString();
            var html = ejs.render(htmlTPL, param);
            var js = ejs.render(jsTPL, param);
            // 初始化xx页面目录开始
            console.log('created page Files starting......');
            createFile(htmlPath, html);
            createDir(assetsPath);
            createFile(jsPath, js);
            createFile(stylePath, '');
            // 初始化xx页面目录结束
            console.log('created components Files finished......');
            process.exit();
        });
};

/**
 *
 * @param assetsPath {String} components的路径
 */
Add.prototype.componentsInit = function(assetsPath){
    getAuthor()
        .then(getDescription)
        .then(getStyleType)
        .then(function(){
            var jsPath = assetsPath + '/index.js';
            var stylePath = assetsPath + '/index.' + (param.styleType === 'sass' ? 'scss' : param.styleType);
            var tplPath = assetsPath + '/tpl/index.html';
            var jsTPL = fs.readFileSync(TEMPLATE_PATH + '/componentsjs.ejs').toString();
            var styleTPL = fs.readFileSync(TEMPLATE_PATH + '/style.ejs').toString();
            var js = ejs.render(jsTPL, param);
            var style = ejs.render(styleTPL, param);
            // 初始化xx components目录开始
            console.log('created components Files starting......');
            createDir(assetsPath);
            createDir(assetsPath + '/tpl');
            createFile(jsPath, js);
            createFile(stylePath, style);
            createFile(tplPath, '');
            // 初始化xx components目录结束
            console.log('created components Files finished......');
            process.exit();
        });
};

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
    console.log('File ' + path.match(BASE_REGEXP)[0] + ' is ' + color.green('created'));
};

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
 * 获取详细的描述
 * @returns {Promise}
 */
var getDescription = function(){
    return new Promise(function(resolve){
        prompt(color.cyan(FLAG + 'The description of the ' + param.type + ' ?'), function (val) {
            param.description = val.trim();
            resolve();
        });
    });
};

/**
 * 获取页面title
 * @returns {Promise}
 */
var getPageTitle = function(){
    return new Promise(function(resolve){
        prompt(color.cyan(FLAG + 'The title of the page?'), function (val) {
            param.title = val.trim();
            resolve();
        });
    });
};

/**
 * 获取创建样式文件类型
 * @returns {Promise}
 */
var getStyleType = function(){
    return new Promise(function(resolve, reject) {
        var selectShell = require('./util/cli-select');
        var select = selectShell();
        select.option(FLAG + 'The type of the stylesheet？')
            .option('css')
            .option('less')
            .option('sass')
            .list();

        select.on('select', function(options){
            param.styleType = options.text;
            resolve();
        });
    });
};

/**
 * 获取最新版本的lib-flexible脚本
 * @returns {Promise}
 */
var getFlexibleJS = function(){
    return new Promise(function(resolve, reject) {
        gitlab.projects.repository.showFile({
            projectId: 'lib/flexible',
            ref: 'master',
            file_path: 'build/flexible.js'
        }, function(file) {
            if (file) {
                param.flexibleJS = (new Buffer(file.content, 'base64')).toString();
                resolve();
            } else {
                console.log('获取flexible js失败');
                reject();
            }
        });
        //param.flexibleJS = '!function(a,b){function c(){var b=f.getBoundingClientRect().width;b/i>540&&(b=540*i);var c=b/10;f.style.fontSize=c+"px",k.rem=a.rem=c}var d,e=a.document,f=e.documentElement,g=e.querySelector(\'meta[name="viewport"]\'),h=e.querySelector(\'meta[name="flexible"]\'),i=0,j=0,k=b.flexible||(b.flexible={});if(g){console.warn("将根据已有的meta标签来设置缩放比例");var l=g.getAttribute("content").match(/initial\-scale=([\d\.]+)/);l&&(j=parseFloat(l[1]),i=parseInt(1/j))}else if(h){var m=h.getAttribute("content");if(m){var n=m.match(/initial\-dpr=([\d\.]+)/),o=m.match(/maximum\-dpr=([\d\.]+)/);n&&(i=parseFloat(n[1]),j=parseFloat((1/i).toFixed(2))),o&&(i=parseFloat(o[1]),j=parseFloat((1/i).toFixed(2)))}}if(!i&&!j){var p=(a.navigator.appVersion.match(/android/gi),a.navigator.appVersion.match(/iphone/gi)),q=a.devicePixelRatio;i=p?q>=3&&(!i||i>=3)?3:q>=2&&(!i||i>=2)?2:1:1,j=1/i}if(f.setAttribute("data-dpr",i),!g)if(g=e.createElement("meta"),g.setAttribute("name","viewport"),g.setAttribute("content","initial-scale="+j+", maximum-scale="+j+", minimum-scale="+j+", user-scalable=no"),f.firstElementChild)f.firstElementChild.appendChild(g);else{var r=e.createElement("div");r.appendChild(g),e.write(r.innerHTML)}a.addEventListener("resize",function(){clearTimeout(d),d=setTimeout(c,300)},!1),a.addEventListener("pageshow",function(a){a.persisted&&(clearTimeout(d),d=setTimeout(c,300))},!1),"complete"===e.readyState?e.body.style.fontSize=12*i+"px":e.addEventListener("DOMContentLoaded",function(){e.body.style.fontSize=12*i+"px"},!1),c(),k.dpr=a.dpr=i,k.refreshRem=c,k.rem2px=function(a){var b=parseFloat(a)*this.rem;return"string"==typeof a&&a.match(/rem$/)&&(b+="px"),b},k.px2rem=function(a){var b=parseFloat(a)/this.rem;return"string"==typeof a&&a.match(/px$/)&&(b+="rem"),b}}(window,window.lib||(window.lib={}));';
        //resolve();
    });
};

/**
 * 获取最新版本的lib-flexible样式
 * @returns {Promise}
 */
var getFlexibleCSS = function(){
    return new Promise(function(resolve, reject) {
        gitlab.projects.repository.showFile({
            projectId: 'lib/flexible',
            ref: 'master',
            file_path: 'build/flexible.css'
        }, function(file) {
            if (file) {
                param.flexibleCSS = (new Buffer(file.content, 'base64')).toString();
                resolve();
            } else {
                console.log('获取flexible css失败');
                reject();
            }
        });
        //param.flexibleCSS = '@charset "utf-8";html{color:#000;background:#fff;overflow-y:scroll;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}html *{outline:0;-webkit-text-size-adjust:none;-webkit-tap-highlight-color:rgba(0,0,0,0)}html,body{font-family:sans-serif}body,div,dl,dt,dd,ul,ol,li,h1,h2,h3,h4,h5,h6,pre,code,form,fieldset,legend,input,textarea,p,blockquote,th,td,hr,button,article,aside,details,figcaption,figure,footer,header,hgroup,menu,nav,section{margin:0;padding:0}input,select,textarea{font-size:100%}table{border-collapse:collapse;border-spacing:0}fieldset,img{border:0}abbr,acronym{border:0;font-variant:normal}del{text-decoration:line-through}address,caption,cite,code,dfn,em,th,var{font-style:normal;font-weight:500}ol,ul{list-style:none}caption,th{text-align:left}h1,h2,h3,h4,h5,h6{font-size:100%;font-weight:500}q:before,q:after{content:\'\'}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sup{top:-.5em}sub{bottom:-.25em}a:hover{text-decoration:underline}ins,a{text-decoration:none}';
        //resolve();
    });
};

var getDate = function(){
    var date = new Date();
    var y = date.getFullYear();
    var m = (date.getMonth() + 1);
    var d = date.getDate();
    return y + '-' + (m >= 10 ? m : '0' + m) + '-' + (d >= 10 ? d : '0' + d);
};

/**
 *
 * @param type 添加的文件类型
 * @param name 添加的文件名称
 */
exports.run = function(type, name){
    var add = new Add();
    if (type === 'p') {// 创建html页面及页面级入口脚本、样式文件
        param.type = 'page';
        add.page(name);
    } else if (type === 'c') {// 创建页面模块或组建
        param.type = 'component';
        add.components(name);
    }
};
