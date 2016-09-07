/**
 * @Author 季平
 * @Date 2016-01-18
 * @Description 统一网络层请求模块
 */

function ajax (config) {
    var emptyFn = function () {};
    var success = config.success || emptyFn;
    var error = config.error || emptyFn;
    var cfg = {
        login: true
    };
    $.extend(cfg, config);
    cfg.success = function (data) {
        if (cfg.login === true) {
            if (data.code === 100) {
                //TODO: 异步登录
                location.reload();
            } else {
                success && success(data);
            }
        } else {
            success && success(data);
        }
    };
    cfg.error = error;
    return $.ajax(cfg);
}

module.exports = ajax;
