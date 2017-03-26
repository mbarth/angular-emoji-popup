/*! Angular Emoji 1.0.0 2014-12-27 */

'use strict';
emojiPlugin.filter('colonToCode', function () {

    return function (input) {

        if (!input)
            return "";

        if (!Config.rx_colons)
            Config.init_unified();

        return input.replace(Config.rx_colons, function (m) {
            var val = Config.mapcolon[m];
            if (val) {
                return val;
            }
            else
                return "";
        });

    };
});

emojiPlugin.filter('codeToSmiley', function () {

    return function (input) {

        if (!input)
            return "";

        if (!Config.rx_codes)
            Config.init_unified();

        return input.replace(Config.rx_codes, function (m) {
            var val = Config.reversemap[m];
            if (val) {
                val = ":" + val + ":";

                var $img = $.emojiarea.createIcon($.emojiarea.icons[val]);
                return $img;
            }
            else
                return "";
        });

    };
});


emojiPlugin.filter('colonToSmiley', function () {

    return function (input) {

        if (!input)
            return "";

        if (!Config.rx_colons)
            Config.init_unified();

        return input.replace(Config.rx_colons, function (m) {
            if (m) {
                var $img = $.emojiarea.createIcon($.emojiarea.icons[m]);
                return $img;
            }
            else
                return "";
        });

    };
});