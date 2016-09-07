/**
 * @Author 季平
 * @Date 2016-01-06
 * @Description util组件
 */

 var Popup = require('../../components/popupExt/index');

module.exports = {
    getUrlParams: function () {
        var search = window.location.search.replace(/^\?/, '');
        var params;
        var result = {};
        if (search) {
            params = search.split('&');
            for (var i = 0; i < params.length; i++) {
                params[i] = params[i].split('=');
                try {
                    result[params[i][0]] = decodeURIComponent(params[i][1]);
                } catch (e) {
                    result[params[i][0]] = params[i][1];
                }
            }
        }
        return result;
    },
    //接口是否是daily环境
    isDaily: function () {
        return location.hostname.indexOf("daily.") != -1;
    },
    //API接口构建
    normalize: function (url) {
        if (this.isDaily()) {
            url = url.replace('52shangou.com', 'daily.52shangou.com');
        } else {
            url = url.replace('52shangou.com', 'www.52shangou.com'); //灰度接口
        }
        return url;
    },
    //跳转url地址构建
    normalizeUrl: function (url) {
        if (this.isDaily()) {
            url = url.replace('52shangou.com', 'daily.52shangou.com');
        } else {
            url = url.replace('52shangou.com', 'www.52shangou.com'); //灰度跳转链接
        }
        return url;
    },
    //格式化日期时间
    formatDate: function (time, format) {
        var t = new Date(time);
        var tf = function (i) {
            return (i < 10 ? '0' : '') + i
        };
        return format.replace(/yyyy|MM|dd|HH|mm|ss/g, function (a) {
            switch (a) {
                case 'yyyy':
                    return tf(t.getFullYear());
                    break;
                case 'MM':
                    return tf(t.getMonth() + 1);
                    break;
                case 'mm':
                    return tf(t.getMinutes());
                    break;
                case 'dd':
                    return tf(t.getDate());
                    break;
                case 'HH':
                    return tf(t.getHours());
                    break;
                case 'ss':
                    return tf(t.getSeconds());
                    break;
            }
        })
    },

    //常用公共信息提示对话框
    infoConfirmBox: function(objAux) {
        var popupObj;

        //创建Popup容器
        if (objAux.type == 'tip') {
            popupObj = new Popup({
                notTransition: true,
                bodyContent: objAux.tipTxt
            })
        } else if (objAux.type == 'message') {
            popupObj = new Popup({
                id: objAux.id,
                classname: objAux.classname,
                headerContent: objAux.hdTitle,
                bodyContent: objAux.msgTxt,
                closeBtn: objAux.showCloseBtn,
                confirmBtn: true,
                callback: objAux.initFunc,
                confirmCallback: objAux.confirmFunc
            })
        }

        return popupObj;
    }
};
