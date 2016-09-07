/**
 * Created by jiping on 15-3-6.
 */
var fs = require('fs');
var url = require('url');
var querystring = require('querystring');
var express = require('express');
var ejs = require('ejs');
var format = require('format-json');
var ENV = require('../../util/env');
var router = express.Router();

/**
 * 请求失败响应方法
 * @param res {Object} response对象
 * @param msg {String} 错误文案
 */
function failure(res, msg){
    res.jsonp({
        success: false,
        msg: msg
    });
}

router.get('/', function (req, res) {
    var configPath = ENV.base_path + '/api/config.json';
    var configFileExists = fs.existsSync(configPath);
    var configContent = configFileExists ? fs.readFileSync(configPath).toString() : '{}';
    var config = JSON.parse(configContent || '{}');
    var mtopApis = [];
    var ajaxJsonpApis = [];
    // 获取mtop接口数据
    if (config['mtop']) {
        for (var i in config['mtop']) {
            if (config['mtop'].hasOwnProperty(i)) {
                mtopApis.push(config['mtop'][i]);
            }
        }
    }
    // 获取ajax-jsonp接口数据
    if (config['ajax-jsonp']) {
        for(var j in config['ajax-jsonp']) {
            if (config['ajax-jsonp'].hasOwnProperty(j)) {
                ajaxJsonpApis.push(config['ajax-jsonp'][j]);
            }
        }
    }
    // 渲染页面
    res.render('api', {
        indexCSS: '/css/api.css',
        indexJS: '/js/api.js',
        prismCSS: '/css/prism.css',
        prismJS: '/js/prism.js',
        mtopApis: mtopApis,
        ajaxJsonpApis: ajaxJsonpApis
    });
});

// 添加api接口
router.get('/add', function (req, res) {
    try {
        var urlObj = url.parse(req.url);
        var params = querystring.parse(urlObj.query);
        // config文件里插入的数据
        var content = {
            api: params.api,
            description: params.description || '',
            status: params.status || 200,
            isProxy: params.isProxy || true
        };
        // 接口目录
        var dirPath = ENV.base_path + '/api/' + params.type;
        // 接口路径
        var apiPath = dirPath + '/' + params.api + '.json';
        // 接口的目录是否存在
        var dirIsExists = fs.existsSync(dirPath);
        // config文件目录
        var configPath = ENV.base_path + '/api/config.json';
        // config文件是否存在
        var configIsExists = fs.existsSync(configPath);
        // config文件内容转成json数据
        var config = {
            'mtop': {},
            'ajax-jsonp': {}
        };
        // config文件内容
        var configContent;
        // 接口是否存在
        var apiIsExists;

        // 不存在接口目录文件夹，创建目录文件夹
        if (!dirIsExists) {
            fs.mkdirSync(dirPath);
        }
        apiIsExists = fs.existsSync(apiPath);
        if (apiIsExists) {
            res.jsonp({success: false, msg: '接口已经存在'});
        } else {
            // ajax-jsonp增加url字段
            if (params.type === 'ajax-jsonp') {
                content.url = params.url;
            }
            // config文件已存在,则读取数据
            if (configIsExists){
                configContent = fs.readFileSync(configPath).toString();
                config = configContent ? JSON.parse(configContent) : config;
            }
            if (!config[params.type]) {
                config[params.type] = {};
            }

            // 更新config文件数据
            config[params.type][params.api] = content;
            fs.writeFileSync(configPath, format.plain(config));
            // 创建接口
            fs.writeFileSync(apiPath, params.data || '{}');
            // 返回成功
            res.jsonp({success: true});
        }
    } catch (e){
        failure(res, '接口添加失败');
    }
});

// 编辑api接口
router.get('/edit', function (req, res) {
    try {
        var urlObj = url.parse(req.url);
        var params = querystring.parse(urlObj.query);
        // config文件里插入的数据
        var content = {
            api: params.api,
            description: params.description || '',
            status: params.status || 200,
            isProxy: params.isProxy || true
        };
        // 若接口名称修改了，则产生新接口路径
        var apiPath = ENV.base_path + '/api/' + params.type + '/' + params.api + '.json';
        // 老接口路径
        var originApiPath = ENV.base_path + '/api/' + params.type + '/' + params.originApi + '.json';
        // config文件
        var configPath = ENV.base_path + '/api/config.json';
        // config文件内容
        var configBuffer = fs.readFileSync(configPath);
        // config文件内容json格式
        var configJSON = JSON.parse(configBuffer.toString());

        // ajax-jsonp增加url字段
        if (params.type === 'ajax-jsonp') {
            content.url = params.url;
        }

        // 原始api名称有问题
        if (!params.originApi || typeof params.originApi !== 'string') {
            failure(res, '接口编辑失败');
            return;
        }

        // 判断接口名字是否有改动过
        if (params.api === params.originApi){
            // 更新config文件的数据
            configJSON[params.type][params.originApi] = content;
            fs.writeFileSync(configPath, format.plain(configJSON));
            // 更新接口文件数据
            fs.writeFileSync(apiPath, params.data || '{}');
        } else {
            // 更新config文件的数据
            delete configJSON[params.type][params.originApi];
            configJSON[params.type][params.api] = content;
            fs.writeFileSync(configPath, format.plain(configJSON));
            // 更新接口文件数据
            fs.writeFileSync(apiPath, params.data || '{}');
            fs.renameSync(originApiPath, apiPath);
        }
        // 返回成功
        res.jsonp({success: true});
    } catch (e){
        failure(res, '接口编辑失败');
    }
});

// 删除api接口
router.get('/delete', function (req, res) {
    try{
        var urlObj = url.parse(req.url);
        var params = querystring.parse(urlObj.query);
        // 接口路径
        var originApiPath = ENV.base_path + '/api/' + params.type + '/' + params.originApi + '.json';
        // config文件
        var configPath = ENV.base_path + '/api/config.json';
        // config文件内容
        var configBuffer = fs.readFileSync(configPath);
        // config文件内容json格式
        var configJSON = JSON.parse(configBuffer.toString());
        // 更新config文件的数据
        delete configJSON[params.type][params.originApi];
        fs.writeFileSync(configPath, format.plain(configJSON));
        fs.unlinkSync(originApiPath);
        // 返回成功
        res.jsonp({success: true});
    }catch(e){
        failure(res, '接口删除失败');
    }
});

// 获取此api相关所有数据的接口，用于编辑api的数据
router.get('/getApi', function (req, res) {
    try {
        var urlObj = url.parse(req.url);
        var params = querystring.parse(urlObj.query);
        if (!params) {
            failure(res, '缺少api和type参数');
        } else {
            if (!params.api) {
                failure(res, '缺少api参数');
            } else if (!params.type) {
                failure(res, '缺少type参数');
            }
        }
        // 接口路径
        var apiPath = ENV.base_path + '/api/' + params.type + '/' + params.api + '.json';
        // api数据
        var apiBuffer = fs.readFileSync(apiPath);
        // api数据json格式
        var apiJSON = JSON.parse(apiBuffer.toString());
        // config文件
        var configPath = ENV.base_path + '/api/config.json';
        // config文件内容
        var configBuffer = fs.readFileSync(configPath);
        // config文件内容json格式
        var configJSON = JSON.parse(configBuffer.toString());
        var data = configJSON[params.type][params.api];
        data.success = true;
        data.data = format.plain(apiJSON);
        // 返回成功
        res.jsonp(data);
    } catch(e) {
        failure(res, '获取接口数据失败');
    }
});

// 获取api数据
router.all('/:name', function (req, res) {
    try {
        // 请求参数
        var params = req.params;
        var name = params.name;
        var api = name.replace(/\.json$/g, '');
        // config文件路径
        //var configPath = ENV.base_path + '/api/config.json';
        // config文件是否存在
        //var configIsExists = fs.existsSync(configPath);
        // 读取config文件内容
        //var configBuffer = fs.readFileSync(configPath);
        // config文件内容转成json数据
        //var config = JSON.parse(configBuffer.toString());
        // 接口文件路径
        var apiPath = ENV.base_path + '/api/' + name;
        // 读取接口是否存在
        //var apiIsExists = fs.existsSync(apiPath);
        // 读取接口数据
        var dataBuffer = fs.readFileSync(apiPath);
        var renderByEjs = ejs.render(dataBuffer.toString(), { query: req.query });
        // 接口数据转成json格式
        var data = JSON.parse(renderByEjs);
        // 返回的状态码
        //var status = config[type][api].status || 200;
        res.status(200).jsonp(data);
    } catch (e){
        res.status(200).jsonp({
            success: false,
            msg: '接口不存在'
        });
    }
});

router.all('*', function (req, res) {
    //var apiPath;
    //var urlObj;
    //var pathArr;
    //// 若通过代理请求api接口，则重定向到api目录的接口数据，否则重定向到api目录
    //if (/^\/(ajax-jsonp)|(mtop)\//.test(req.url)) {
    //    urlObj = url.parse(req.url);
    //    pathArr = urlObj.pathname.split('/');
    //    apiPath = '/' + pathArr[1] + '/' + pathArr[2] + (urlObj.search || '');
    //    res.redirect(301, '//127.0.0.1:3000/api' + apiPath);
    //} else {
    //    res.status(404).send('Not Found');
    //}
    res.status(404).send('Not Found');
});

module.exports = router;