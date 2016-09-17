/**
 * Author: jiping
 * Date: 2014-12-11
 * Email: jiping.yjp@taobao.com
 * 开启本地服务器功能
 */
var path = require('path');
var fs = require('fs');
var express = require('express');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var ejs = require('ejs');
var format = require('format-json');
var proxy = require('./util/proxy');
var ENV = require('./util/env');
var demo = require('./app/routes/demo');
var api = require('./app/routes/api');
var src = require('./app/routes/src');
var img = require('./app/routes/img');
var publish = require('./app/routes/publish');
var build = require('./app/routes/build');
var lib = require('./app/routes/lib');
var tag = require('./tag');
var app = express();
var spawn = require('cross-spawn');

function updateTagList(){
    var omPath = ENV.base_path + '/om.json';
    var omBuffer = fs.readFileSync(omPath);
    var om = JSON.parse(omBuffer.toString());
    var d = new Date();
    var date = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    if (!om.lastTime || om.lastTime !== date) {
        tag.run();
        om.lastTime = date;
        fs.writeFileSync(omPath, format.plain(om));
    }
}

exports.run = function(isDebug, paramCfg){
    var hasPort = false, hasDoc = false, portVal = '';

    app.use(function(req, res, next){
        var ms;
        var start = new Date;
        next();
        ms = new Date - start;
        res.set('x-Response-Time', ms + 'ms');
    });

    if (paramCfg) {
        if (paramCfg.commandar === 'port') {
            hasPort = true;
            portVal = paramCfg.val;
        } else if (paramCfg.commandar === 'doc') {
            hasDoc = true;
            portVal = paramCfg.val;
        }
    }

    // set port
    if (hasPort || hasDoc) {
        app.set('port', process.env.PORT || portVal);
    } else {
        app.set('port', process.env.PORT || 3000);
    }

    // set view engine
    app.set('views', path.join(process.cwd(), 'demo'));
    //app.set('view engine', 'ejs');
    // 模板文件后缀由.ejs变成.html
    app.engine('.html', ejs.__express);
    app.set('view engine', 'html');

    // set jsonp callback name
    app.set('jsonp callback name', 'callback');

    // 静态资源 js css img
    app.use(express.static(path.join(__dirname, 'app/assets')));

    // layout
    app.use(partials());

    // set body
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    // router
    app.use('/api', api);
    app.use('/demo', demo);
    app.use('/src', src);
    app.use('/img', img);
    app.use('/publish', publish);
    app.use('/build', build);
    app.use('/lib', lib);

    // catch 404 and forward to error handler
    app.use(function(req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // error handler
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.send(err.message);
        res.end();
    });

    app.listen(portVal || 3000);

    console.log("local service is running......");
    // 开启代理模块
    if (isDebug) {
        try{
            proxy();
            console.log('proxy service is running......');
        } catch(e){
            console.log('proxy went wrong');
        }
    }
    //console.log(ENV.flag + 'api mock页面地址：http://127.0.0.1:3000/api');
    console.log(ENV.flag + 'demo页面地址：http://127.0.0.1:' + (portVal || 3000) + '/demo/test.html');
    if (hasDoc) {
        spawn('om', ['doc'], { stdio: 'inherit' }).on('exit', function() {
            spawn('open', ['http://127.0.0.1:' + (portVal || 3000) + '/demo/doc/index.html'], { stdio: 'inherit' });
        })
    } else {
        //spawn('open', ['http://127.0.0.1:' + (portVal || 3000) + '/demo/test.html'], { stdio: 'inherit' });
    }
    
    // 保持每天更新依赖的lib/ctrl最新版本号
    //updateTagList();
};