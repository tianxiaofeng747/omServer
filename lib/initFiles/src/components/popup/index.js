/**
 * @Author 季平
 * @Date 2016-01-13
 * @Description 弹层组件
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
    $('body').append(html);
    self.container = $('#' + self.config.id);
    self.container.popup({
        color: '#000',
        opacity: 0.5,
        scrolllock: self.config.scrolllock || false,
        blur: false,
        transition: 'opacity 0.3s',
        closeelement: '.popup_close',
        opentransitionend: function () {
            self.config.callback && self.config.callback.call(self);
        },
        closetransitionend: function () {
            setTimeout(function () {
                $('#' + self.config.id + '_background').remove();
                $('#' + self.config.id + '_wrapper').remove();
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
