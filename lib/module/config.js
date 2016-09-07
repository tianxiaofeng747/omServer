/**
 * Author: jiping
 * Date: 2015-2-24
 * Email: jiping.yjp@taobao.com
 * seajs包依赖配置模块
 */
module.exports = function(str){
    var config = '<script type="text/javascript" src="../src/config.js"></script>\r\n';
    // buffer转成string
    var content = str.toString();
    // 插入config.js脚本
    var result = content.replace(/(<\/head>)/g, config + '$1');
    // string转成buffer
    content = new Buffer(result);
    return content;
};