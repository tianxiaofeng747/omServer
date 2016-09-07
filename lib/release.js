/**
 * Author: hanyu
 * Date: 2016-08-30
 * 项目发布快捷方式
 */
var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var prompt = require('cli-prompt');
var color = require('cli-color');
var chalk = require('chalk');
var spawn = require('cross-spawn');
var copyFiles = require('./util/cli-copy');
var env = require('./util/env');
var git = require('gulp-git');
var BASE_PATH = env.base_path;

var FLAG = env.flag;
var tag;

//获取当前git提交分支
var fetchCurGitBranch = function() {
    var str = fs.readFileSync(BASE_PATH + '/.git/HEAD').toString(),
        strArr = str.split('/'),
        len = strArr.length;

    return strArr[len - 1].replace('\n', '');
}

//获取本地所有分支
var fetchLocalAllBranchs = function() {
    return new Promise(function(resolve, reject) {
        fs.readdir(BASE_PATH + '/.git/refs/heads/', function(err, files) {
            var brList = [];
            if (err) {
                console.log(err);
                reject(err);
                return;
            } else {
                files.forEach(function(file) {
                    if (file != 'master' && file != 'dev') {
                        brList.push(file);
                    }
                })
                resolve(brList);
            }
        })
    })
}

//是否部署到日常环境dev分支
var devBranchOperate = function() {
    return new Promise(function(resolve, reject) {
        var selectShell = require('./util/cli-select');
        var select = selectShell();

        select.option(chalk.blue.bold(FLAG + 'Current commit branch is ' + color.red('dev') + ', Push to daily?'))
            .option('Yes')
            .option('No')
            .list();

        select.on('select', function(options) {
            if (options.value == 'Yes') {
                git.pull('origin', 'dev', function(err) {
                    if (err) {
                        console.log(err);
                        process.exit();
                    } else {
                        resolve();
                    }
                });
            } else {
                process.exit();
            }
        });
    })
}

//选择本地分支进行Merge
var selectBranch = function(branchList) {
    return new Promise(function(resolve, reject) {
        var selectShell = require('./util/cli-select');
        var select = selectShell();
        select.option(chalk.blue.bold(FLAG + 'Select the will merged local branch？'));
        branchList.forEach(function(branch) {
            select.option(branch);
        })
        select.list();

        select.on('select', function(options){
            git.merge(options.text, function(err) {
                if (err) {
                    console.log('Automatic merge failed; fix conflicts and then commit the result.');
                    process.exit();
                } else {
                    resolve();
                }
            });
        })
    })
}

var finalPublish = function() {
    git.pull('origin', 'master', function(err) {
        if (err) {
            throw err;
            process.exit();
        } else {
            fetchLocalAllBranchs().then(function(branchList) {
                var selectShell = require('./util/cli-select');
                var select = selectShell();
                select.option(FLAG + 'Select the will merged local branch？');
                branchList.forEach(function(branch) {
                    select.option(branch);
                })
                select.list();

                select.on('select', function(options){
                    git.merge(options.text, function(err) {
                        if (err) {
                            console.log('Automatic merge failed; fix conflicts and then commit the result.');
                            process.exit();
                        } else {
                            spawn('git', ['push', 'origin', 'master'], { stdio: 'inherit' }).on('exit', function() {
                                prompt(chalk.yellow.bold(FLAG + 'Input publish tag: '), function(val) {
                                    if (val) {
                                        tag = val;
                                        spawn('git', ['tag', val], { stdio: 'inherit' }).on('exit', function() {
                                            git.push('origin', tag);
                                        })
                                    }
                                })
                            })
                        }
                    });
                })
            })
        }
    })
}

exports.run = function(){

    //当前分支为dev时确认是否发布到日常环境
    if (fetchCurGitBranch() === 'dev') {
        devBranchOperate()
            .then(fetchLocalAllBranchs)
            .then(selectBranch)
            .then(function() {
                prompt(chalk.blue.bold(FLAG + 'Need rebuid?(y/n)'), function(val) {
                    if (val === 'y') {
                        spawn('gulp', { stdio: 'inherit' }).on('exit', function(){

                            prompt(chalk.yellow.bold(FLAG + 'Input commit message:'), function(val) {
                                if (val) {
                                    spawn('git', ['add', '.'], { stdio: 'inherit' }).on('exit', function() {
                                        spawn('git', ['commit', '-m', val], { stdio: 'inherit' }).on('exit', function() {
                                            git.push('origin', 'dev');
                                        })
                                    });
                                }
                            })

                        })
                    } else {
                        git.push('origin', 'dev');
                    }
                })
            });
    } else {
        var selectShell = require('./util/cli-select');
        var select = selectShell();

        select.option(chalk.blue.bold(FLAG + 'Current commit branch is ' + color.red(fetchCurGitBranch()) + ', Push now?'))
            .option('Yes')
            .option('No')
            .list();

        select.on('select', function(options) {
            if (options.text === 'Yes') {
                try {

                    var curGitBranchStr = fetchCurGitBranch();

                    //当前提交分支为master时
                    if (curGitBranchStr === 'master') {

                        finalPublish();

                    } else {
                        git.pull('origin', curGitBranchStr, function(err) {
                            if (err) {
                                throw err;
                                process.exit();
                            } else {
                                git.checkout('master', function(err) {
                                    if (err) {
                                        throw err;
                                        process.exit();
                                    } else {
                                        finalPublish();
                                    }
                                })
                            }
                        });

                    }

                } catch (e) {
                    throw e;
                }
            } else {
                process.exit();
            }
        })
    }
};