/**
 * Created by jiping on 15-3-8.
 * apiMock页面脚本
 */
try{
    KISSY.use('node, event, io, xtemplate, overlay', function(S, Node, E, IO, XTemplate, Overlay){
        var $ = Node.all;
        var ADD_TPL = $('#addTemplate').text();
        var EDIT_TPL = $('#editTemplate').text();
        var ERROR_TPL = '<div class="error-text-box">{text}</div>';
        var ITEM_TPL = '<li data-api="{{api}}">' +
            '<h3>{{api}}</h3>' +
            '<p>{{description}}</p>' +
            '<button class="J_Edit">EDIT</button>' +
            '<button class="J_Copy">COPY</button>' +
            '<button class="delete J_Delete"></button>' +
            '</li>';
        var addApiLock = false;
        var editApiLock = false;
        var deleteApiLock = false;
        var timer;
        var toaster;
        var originApi;

        /**
         * toast效果
         * @param text{String} 提示文案
         * @param callback {Function} 回调方法
         */
        function toast(text, callback){
            var data = {text: text};
            timer && clearTimeout(timer);
            if (toaster) {
                toaster.set('content', S.substitute(ERROR_TPL, data));
                toaster.render();
                toaster.center();
                toaster.show();
            } else {
                toaster = new Overlay({
                    elCls: "toast",
                    height: 40,
                    zIndex: 10020,
                    effect: {
                        effect:"fade",
                        duration:0.5
                    },
                    align: {
                        points: ["cc", "cc"],
                        offset: [0, 0]
                    },
                    content: S.substitute(ERROR_TPL, data)
                });
                toaster.render();
                toaster.show();
            }
            timer = setTimeout(function(){
                toaster.hide();
                callback && callback();
            },2000);
        }

        /**
         * 浮层
         * @param config{Object} 浮层参数
         * @constructor
         */
        function Dialog(config){
            var self = this;
            self.config = {
                zIndex: 10010,
                align: {
                    points: ["cc", "cc"],
                    offset: [0, 0]
                },
                closable: true,
                mask: true
            };
            //合并参数
            S.mix(self.config, config, undefined, undefined, true);
            self.init();
        }

        S.augment(Dialog, E.Target, {
            init: function(){
                var self = this;
                self.dialog = new Overlay.Dialog(self.config);
                self.dialog.render();
                self.el = this.dialog.get("el");
                self.fire('renderEnd');
                self.dialog.center();
                self.show();
            },
            show: function(){
                this.dialog.center();
                this.dialog.show();
            },
            hide: function(){
                this.dialog.hide();
            },
            destroy: function(){
                this.dialog.destroy();
            }
        });

        /**
         * 验证添加/编辑api请求参数是否正确，正确返回参数，否则返回错误码
         * @param type {String} 请求类型mtop/ajax-jsonp
         */
        function checkParam(type){
            var name = S.trim($('.J_Name').val());
            var description = S.trim($('.J_Description').val());
            var status = S.trim($('.J_Status').val());
            var url = S.trim($('.J_URL').val());
            var data = S.trim($('.J_Data').val());
            var isProxy = $('.J_Proxy').prop('checked');
            var params = {
                api: name,
                description: description,
                url: url,
                isProxy: isProxy,
                status: status || 200,
                type: type
            };

            if (!name) {
                toast('接口名称必填');
                return 'error';
            } else if (type === 'ajax-jsonp' && !url) {
                toast('线上接口地址必填');
                return 'error';
            } else if (!description) {
                toast('接口描述必填');
                return 'error';
            } else {
                try {
                    params.data = data || '{}';
                    return params;
                } catch (e){
                    toast('接口数据标准json格式');
                    return 'error';
                }
            }
        }

        /**
         * 添加api请求
         * @param type {String} 请求类型mtop/ajax-jsonp
         * @param el {Node} 触发请求的节点
         */
        function addApiRequest(type, el){
            var params = checkParam(type);
            // 返回值为error表示参数有错
            if (params === 'error') return;
            // 加锁
            addApiLock = true;
            IO({
                type: 'get',
                data: params,
                url: '/api/add',
                timeout: 3000,
                success: function(data){
                    // 解锁
                    addApiLock = false;
                    if (data.success) {
                        toast('接口添加成功', function(){
                            $('.ks-overlay-close-x').fire('click');
                        });
                        el.parent('ul').prepend(new XTemplate(ITEM_TPL).render(params));
                    } else {
                        toast(data.msg || '接口添加失败');
                    }
                },
                error: function(){
                    // 解锁
                    addApiLock = false;
                    toast('接口添加失败');
                }
            });
        }

        /**
         * 编辑api请求
         * @param type {String} 请求类型mtop/ajax-jsonp
         * @param el {Node} 触发请求的节点
         */
        function editApiRequest(type, el){
            var params = checkParam(type);
            // 返回值为error表示参数有错
            if (params === 'error') return;
            // 加锁
            editApiLock = true;
            IO({
                type: 'get',
                data: S.merge(params, {originApi: originApi}),
                url: '/api/edit',
                timeout: 3000,
                success: function(data){
                    // 解锁
                    editApiLock = false;
                    if (data.success) {
                        // 更新页面数据
                        var parentEl = el.parent('li');
                        var nameEl = el.siblings('h3');
                        var descriptionEl = el.siblings('p');
                        parentEl.attr('data-api', params.api);
                        nameEl.html(params.api);
                        originApi = params.api;
                        descriptionEl.html(params.description);
                        toast('接口编辑成功');
                    } else {
                        toast(data.msg || '接口编辑失败');
                    }
                },
                error: function(){
                    // 解锁
                    editApiLock = false;
                    toast('接口编辑失败');
                }
            });
        }
        
        /**
         * 删除api请求
         * @param type {String} 请求类型mtop/ajax-jsonp
         * @param originApi {String} 编辑的api名称
         * @param el {Node} 触发请求的节点
         */
        function deleteApiRequest(type, originApi, el){
            // 加锁
            deleteApiLock = true;
            IO({
                type: 'get',
                data: {
                    type: type,
                    originApi: originApi
                },
                url: '/api/delete',
                timeout: 3000,
                success: function(data){
                    // 解锁
                    deleteApiLock = false;
                    if (data.success) {
                        // 更新页面数据
                        var parentEl = el.parent('li');
                        parentEl.remove();
                        toast('接口删除成功');
                    } else {
                        toast(data.msg || '接口删除失败');
                    }
                },
                error: function(){
                    // 解锁
                    deleteApiLock = false;
                    toast('接口删除失败');
                }
            });
        }

        /**
         * 获取接口数据
         * @param params {Object} 请求参数
         * @param callback {Function} 回调方法
         */
        function getAPI (params, callback) {
            IO({
                type: 'get',
                url: '/api/getApi?t=' + (+new Date),
                data: params,
                timeout: 3000,
                success: function(data){
                    if (data.success) {
                        callback && callback(data);
                    } else {
                        toast(data.msg || '获取接口失败');
                    }
                },
                error: function(){
                    toast('获取接口失败');
                }
            });
        }

        /**
         * 渲染添加api模板
         * @param data {Object} 渲染数据
         * @returns {Dialog} dialog对象
         */
        function renderAddHtml(data){
            var html = new XTemplate(ADD_TPL).render(data);
            var dialog = new Dialog({
                width: 1170,
                height: 640,
                elCls: 'api-dialog',
                bodyContent: html
            });
            return dialog;
        }

        /**
         * 渲染编辑api模板
         * @param data {Object} 渲染的数据
         * @returns {Dialog} dialog对象
         */
        function renderEditHtml(data){
            var html = new XTemplate(EDIT_TPL, {
                commands: {
                    'stringify': function (scopes, option) {
                        return option.params[0];
                    }
                }
            }).render(data);
            // 显示弹层
            var dialog = new Dialog({
                width: 1170,
                height: 640,
                elCls: 'api-dialog',
                bodyContent: html
            });
            // 高亮json数据
            $('code').html($('.J_Data').val());
            Prism.highlightAll();
            return dialog;
        }

        // 添加api
        $('.J_Add').on('click', function(e){
            var el = $(e.currentTarget);
            var type = el.parent('.module').attr('data-type');
            var data = {
                type: type,
                text: '添加'
            };
            // 渲染添加api模板
            var dialog = renderAddHtml(data);

            // 绑定点击关闭按钮
            E.on('.ks-overlay-close-x', 'click', function(){
                E.detach('.J_AddSubmit');
                E.detach('.ks-overlay-close-x');
                dialog.destroy();
                dialog = null;
            });

            // 绑定发送添加api表单事件
            E.on('.J_AddSubmit', 'click', function(e){
                // 请求已被锁则退出,否则请求；
                if (addApiLock) {
                    return;
                } else {
                    addApiRequest(type, el);
                }
            });
        });

        // 编辑api
        E.delegate(document, 'click', '.J_Edit', function(e){
            var el = $(e.currentTarget);
            var type = el.parent('.module').attr('data-type');
            originApi = el.parent('li').attr('data-api');
            var params = {
                type: type,
                api: originApi
            };
            getAPI(params, function(data){
                // 合并数据
                var d = S.merge(data, {
                    type: type,
                    text: '编辑'
                });
                // 渲染模板
                var dialog = renderEditHtml(d);

                // 绑定点击关闭按钮
                E.on('.ks-overlay-close-x', 'click', function(){
                    E.detach('.J_EditSubmit');
                    E.detach('.ks-overlay-close-x');
                    dialog.destroy();
                    dialog = null;
                });

                // 绑定发送添加api表单事件
                E.on('.J_EditSubmit', 'click', function(e){
                    // 请求已被锁则退出,否则请求；
                    if (editApiLock) {
                        return;
                    } else {
                        editApiRequest(type, el);
                    }
                });
            });
        });

        // 拷贝 api
        E.delegate(document, 'click', '.J_Copy', function(e){
            var el = $(e.currentTarget);
            var type = el.parent('.module').attr('data-type');
            var originApi = el.parent('li').attr('data-api');
            var params = {
                type: type,
                api: originApi
            };
            getAPI(params, function(d){
                // 合并数据
                var data = S.merge(d, {
                    type: type,
                    text: '添加'
                });
                // 渲染模板
                var dialog = renderEditHtml(data);

                // 绑定点击关闭按钮
                E.on('.ks-overlay-close-x', 'click', function(){
                    E.detach('.J_EditSubmit');
                    E.detach('.ks-overlay-close-x');
                    dialog.destroy();
                    dialog = null;
                });

                // 绑定发送添加api表单事件
                E.on('.J_EditSubmit', 'click', function(e){
                    // 请求已被锁则退出,否则请求；
                    if (addApiLock) {
                        return;
                    } else {
                        addApiRequest(type, el);
                    }
                });
            });
        });

        // 删除api
        E.delegate(document, 'click', '.J_Delete', function(e){
            var el = $(e.currentTarget);
            var type = el.parent('.module').attr('data-type');
            var originApi = el.parent('li').attr('data-api');
            var result = confirm('确定要删除这个接口吗？');
            if (result){
                // 请求已被锁则退出,否则请求；
                if (deleteApiLock) {
                    return;
                } else {
                    deleteApiRequest(type, originApi, el);
                }
            }
        });

        E.delegate(document, 'input', '.J_Data', function(e){
            $('code').html(e.target.value);
            Prism.highlightAll();
        });
    })
} catch (e){}