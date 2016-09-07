/**
 * @Author 季平
 * @Date 2016-01-13
 * @Description 弹层组件
 * @modified hanyu
 * @mDescription 基于原弹层组件进行了部分扩展，可支持自定义尺寸、确定操作等等
 */

require('../../components/overlay/jquery.popupoverlay');
var Template = require('./tpl/index');

/**
 * 显示弹层
 * @param config {Object} 弹层参数
 */

function Popup(config) {
    this.config = config;
    this.init();
}

Popup.prototype.init = function () {
    var self =  this;
    var html = Template(self.config);

    //config id tag
    if (!self.config.id) {
        self.container = $('<div id="J_commonInfoConfirmBox"></div>');
    } else {
        if (0 == $('#' + self.config.id).length) {
            self.container = $('<div id="'+ self.config.id +'"></div>')
        }
    }

    self.container.popup({
        color: '#000',
        opacity: 0.5,
        blur: false,
        transition: self.config.notTransition ? null : 'opacity 0.3s',
        closeelement: '.popup_close',
        beforeopen: function(dom) {
            $(dom).html(html);
        },
        opentransitionend: function () {
            self.config.callback && self.config.callback.call(self);

            //确认按钮
            if (self.config.confirmBtn) {
                self.container.find('.common-confirm-btn').on('click', function(){
                    if(self.config.confirmCallback) {
                        var result = self.config.confirmCallback.call(self);
                        result && self.hide();
                    } else {
                        self.hide();
                    }
                })
            }
        },
        closetransitionend: function () {
            setTimeout(function () {
                if (!self.config.id) { 
                    self.container = $('<div id="J_commonInfoConfirmBox"></div>');
                    $('#J_commonInfoConfirmBox_background').remove();
                    $('#J_commonInfoConfirmBox_wrapper').remove();
                } else {
                    if (0 != $('#' + self.config.id).length) {
                        $('#' + self.config.id + '_background').remove();
                        $('#' + self.config.id + '_wrapper').remove();
                    }
                }
            }, 300);
        }
    });
    this.show();
};

Popup.prototype.show = function () {
    this.container.popup('show');
};

Popup.prototype.hide = function () {
    this.container.popup('hide');
};


module.exports = Popup;
