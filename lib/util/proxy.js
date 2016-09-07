/**
 * Created by jiping on 15-3-9.
 */
var http = require('http');
var fs = require('fs');
var url = require('url');
var querystring = require('querystring');
var httpProxy = require('http-proxy');
var request = require('request');
var ENV = require('./env');

var proxy = httpProxy.createProxyServer();

var MTOP_API_HOST = [
    'api.m.taobao.com/rest/h5ApiUpdate.do',
    'api.wapa.taobao.com/rest/h5ApiUpdate.do',
    'api.waptest.taobao.com/rest/h5ApiUpdate.do',
    'unit.api.m.taobao.com/rest/h5ApiUpdate.do',
    'unit.api.wapa.taobao.com/rest/h5ApiUpdate.do',
    'unit.api.waptest.taobao.com/rest/h5ApiUpdate.do'
];

function sendRequest(req, res){
    request({
        method: req.method,
        url: req.url,
        headers: req.headers
    }).pipe(res);
}

module.exports = function () {
    http.createServer(function (req, res) {
        var targetPath = '';
        var urlObj = url.parse(req.url);
        var queryObj = querystring.parse(urlObj.query);
        var hostPath = urlObj.host + urlObj.pathname;
        var configPath = ENV.base_path + '/api/config.json';
        var configIsExists = fs.existsSync(configPath);
        var configBuffer = configIsExists ? fs.readFileSync(configPath) : '';
        var config = configBuffer ? JSON.parse(configBuffer.toString()) : configBuffer;
        var mtop;
        var ajaxJsonp;

        if (config) {
            mtop = config['mtop'];
            ajaxJsonp = config['ajax-jsonp'];
            // 判断是否为mtop请求
            MTOP_API_HOST.forEach(function (val, i) {
                // 本地是否存在这个api
                if (val === hostPath && mtop && mtop[queryObj.api] && mtop[queryObj.api]['isProxy']) {
                    targetPath = '/api/mtop/' + queryObj.api + '.json';
                }
            });

            // 若不是mtop接口，则判断是否是ajax-jsonp接口
            if (!targetPath && ajaxJsonp) {
                for (var i in ajaxJsonp) {
                    if (ajaxJsonp.hasOwnProperty(i) && ajaxJsonp[i] && ajaxJsonp[i]['isProxy'] && ajaxJsonp[i]['url'].indexOf(hostPath) >= 0) {
                        targetPath = '/api/ajax-jsonp/' + i + '.json';
                        break;
                    }
                }
            }

            // 若需要代理本地文件，则代理，否则正常请求
            if (targetPath) {
                proxy.web(req, res, {
                    target: {
                        host: '127.0.0.1',
                        port: 3000,
                        path: targetPath
                    }
                });

                // 代理出错事件
                proxy.on('error', function (err, req, res) {
                    res.writeHead(500, {
                        'Content-Type': 'text/plain'
                    });
                    res.end('Something went wrong. And we are reporting a custom error message.');
                });
            } else {
                sendRequest(req, res);
            }
        } else {
            sendRequest(req, res);
        }

    }).listen(3001);
};