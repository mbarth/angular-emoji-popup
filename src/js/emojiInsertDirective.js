/*! Angular Emoji 1.0.0 2014-12-27 */

'use strict';

emojiPlugin.directive('emojiInsert', function () {
    return {
        restrict: 'AE',
        scope: {
            emojiTextAreaId: '=',
            emojiButtonId: '=',
            prefixSpace: '=?'
        },
        link: function (scope, element, attrs) {
            var prefixSpace = attrs.prefixSpace ? attrs.prefixSpace === 'true' : false;
            var emojiArea = $('#' + attrs.emojiTextAreaId).emojiarea({
                button: $('#' + attrs.emojiButtonId, element)[0],
                prefixSpace: prefixSpace
            });
        }
    };
});