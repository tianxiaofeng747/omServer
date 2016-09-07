## om
* 命令行项目开发工具，支持项目脚手架构建、本地静态服务器、快速创建组件和页面，自动部署等功能；

### Getting Started
* Clone the repo: git clone git@gitlab.51xianqu.com:backsdg/om.git
* install global: sudo npm link
[注：]若在最新Node环境下无法正常link，可以尝试通过sudo ln -s '/bin/om.js绝对路径' /usr/local/bin/om 命令进行软链操作

### Require Tools
* node >= 0.11.12
* gulp >= 3.8.11

### Features
* 支持命令行项目脚手架初始化 —— om init
    + 根据命令行提示可进行快速构建目录
    + 创建过程中可进行依赖安装与否的选择
    + 是否快速启动本地服务的选择，当产生端口冲突时需手动自定义端口重启服务
* 支持命令行添加文件 —— om add
    + om add c xxx 添加一个名字为xxx的components文件；包括模板文件、脚本文件、样式文件
    + om add p xxx 添加一个名字为xxx的page文件；包括html文件、脚本文件、样式文件
* 支持本地服务 —— om server(默认3000端口,可通过om server port xxxx自定义端口，便于并行开发)
    + api mock页面地址：http://127.0.0.1:3000/api
    + demo页面地址：http://127.0.0.1:3000/demo/test.html
* 支持本地apiMock（mtop、ajax、jsonp） —— om server debug
    + 使用时确保绑定代理，代理ip：127.0.0.1；代理端口：3001
* 支持本地打包功能 —— om build
* 支持cmd包管理功能
* 支持css、less、sass依赖及编译
* 支持[artTemplate](https://github.com/aui/artTemplate)

### 本应用采用web components的目录结构
* src目录
    + page下存放页面入口assets
    + components下存放模块或者组件assets
* api目录
    + 存放ajax请求的json数据接口或jsonp请求的数据接口
    + 在json文件中支持ejs语法
* demo目录存放本地开发的html文件
* build目录存放打包后每个页面的js、css文件

### cmd包管理机制——seajs（可使用nodejs的方式写模块）
* 模块定义方式, 比如在components目录下定义一个模块a
```javascript
module.export = {
    init: function(){
        console.log('module a');
    }
}
```

* 模块依赖方式
    + 依赖本地模块，在page目录下的index入口文件引用模块a
    
    ```javascript
    var a = require('../../components/a/index');
    a.init();
    ```

    + 依赖本地模板，模块a引用模块a的模板
    
    ```javascript
    var template = require('./tpl/index');
    module.exports = {
        init: function () {
            var data = {
               a: 1,
               b: 2
           }
            var html = template(data);
            $('body').html(html);
        }
    }
    ```

    + 依赖远程模块，如依赖lib.env
    
    ```javascript
    require('lib.env');
    console.log(lib.env.os);
    ```

### 该工具要解决的问题
* 提升开发效率
* 降低项目的维护成本

### ChangeLog
* 支持本地服务Server端口可自定义指定
* 更新om init脚手架构建
* 更新脚手架部署打包文件，支持自动部署artTemplate模板文件(20160803)
* 支持功能模块在page目录中颗粒化组织管理，即可以添加tpl目录及模板文件，增加一级功能模块目录：
  * src
      * page
        * bizModule
            * tpl
            * module(此目录中存在拆分功能代码，例如a.js,b.js...)
            * index.js(入口初始化模块，其中可以直接require到module目录中的a,b文件)
* 支持快速静态资源推送 —— om pp(pp:push && publish)
    + 支持dev分支的快速推送，部署到日常
    + 支持master分支、打tag发布到线上环境
    + 使用该特性时需要注意，首先要严格按照团队开发工作流，即不能推送固定的测试分支dev分支，同时切记不能从dev分支进行新分支的创建；另外需要注意的是使用命令前需打包部署好分支资源并提交。
* 支持本地文档 —— om doc(默认3000端口,可通过om doc xxxx自定义端口，便于并行开发)
    + doc mock页面地址：http://127.0.0.1:3000/demo/doc/index.html
    + 同步backsdg组的doc库中的文档，可以运行于本地服务便利查看
    + **该功能待使用验证，目前属Beta版本**
* 升级旧项目支持文档化 —— om update doc
    + **该功能针对已经构建过的老项目支持本地文档化**
* Demo文件中支持获取Url参数，通过query对象直接获取，便于在ejs语法中使用；
* Api目录中的json文件支持ejs语法

