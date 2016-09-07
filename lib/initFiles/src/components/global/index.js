/**
 * Created by yizui on 16/3/4.
 */
(function ($) {
    var HEADER = {
        init: function () {
            var self = this;
            self.initMenuToggle();
        },
        //页面切换
        initMenuToggle: function () {
            var self = this;
            //左侧菜单切换
            $(document).delegate(".J_ToggleMenu", "click", function (e) {
                e.preventDefault();
                var ul = $(this).parents('li').find('.nav-stacked');
                var li = $(this).parents('li');
                $('.J_MainMenu').each(function (i) {
                    $(this).removeClass('active');
                });
                $(li).addClass('active');
            });
            //布局切换
            $(document).delegate(".J_ToggleLayout", "click", function (e) {
                e.preventDefault();
                $('body').toggleClass('expand-body');
            });
        }
    };
    HEADER.init();
})(jQuery);
