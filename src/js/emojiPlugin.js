/*! Angular Emoji 1.0.0 2014-12-27 */

'use strict';

var emojiPlugin = angular.module("emojiPlugin", ['ngSanitize']);

emojiPlugin.config(['$sceProvider', function ($sceProvider) {

    $sceProvider.enabled(false);

    var icons = {},
        reverseIcons = {},
        i, j, name, dataItem, row, column, totalColumns;

    for (j = 0; j < Config.EmojiCategories.length; j++) {
        totalColumns = Config.EmojiCategorySpritesheetDimens[j][1];
        for (i = 0; i < Config.EmojiCategories[j].length; i++) {
            dataItem = Config.Emoji[Config.EmojiCategories[j][i]];
            name = dataItem[1][0];
            row = Math.floor(i / totalColumns);
            column = (i % totalColumns);
            icons[':' + name + ':'] = [j, row, column, ':' + name + ':'];
            reverseIcons[name] = dataItem[0];
        }
    }

    $.emojiarea.imagesPath = '/images/emojis';
    $.emojiarea.spritesheetPath = $.emojiarea.imagesPath + '/emojisprite_!.png';
    $.emojiarea.spritesheetDimens = Config.EmojiCategorySpritesheetDimens;
    $.emojiarea.iconSize = 20;
    $.emojiarea.icons = icons;
    $.emojiarea.reverseIcons = reverseIcons;

}]);