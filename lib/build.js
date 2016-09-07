/**
 * Author: jiping
 * Date: 2014-12-11
 * Email: jiping.yjp@taobao.com
 * 本地打包功能
 */
var exec = require('child_process').exec;
var tag = require('./tag');

function build() {
    console.log('build starting...');
    var child  = exec('gulp', function (err, stdout, stderr) {
        if (err) throw err;
        console.log(stdout);
        console.log('build completed');
    });
}

exports.run = function(param){
    try {
        tag.run(build);
    } catch(e){
        console.log('build error');
    }
};