/**
 * Created by jiping on 15-1-14.
 */
var path = require('path');

module.exports = {
    base_path: process.cwd(),
    base_regexp: new RegExp(path.basename(process.cwd()) + '.*'),
    flag: '[om] ',
    token: 'Q8ZthQKYuTy53wXiSj7B'
};