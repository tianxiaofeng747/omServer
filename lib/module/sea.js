/**
 * Author: jiping
 * Date: 2015-2-24
 * Email: jiping.yjp@taobao.com
 * seajs模块
 */
module.exports = function(str){
    var seajs = '<script type="text/javascript" src="/js/sea.js"></script>\r\n';
    // buffer转成string
    var content = str.toString();
    // 插入seajs脚本
    var result = content.replace(/(<\/head>)/g, seajs + '$1');
    // string转成buffer
    content = new Buffer(result);
    return content;
};