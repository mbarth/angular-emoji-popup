/*! Angular Emoji 1.0.0 2014-12-27 */

/**
 * emojiarea - A rich textarea control that supports emojis, WYSIWYG-style.
 * Copyright (c) 2012 DIY Co
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
 * file except in compliance with the License. You may obtain a copy of the License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 * ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 *
 * @author Brian Reavis <brian@diy.org>
 */

/**
 * This file also contains some modifications by Igor Zhukov in order to add
 * custom scrollbars to EmojiMenu See keyword `MODIFICATION` in source code.
 */

(function ($, window, document) {

    var ELEMENT_NODE = 1;
    var TEXT_NODE = 3;
    var TAGS_BLOCK = ['p', 'div', 'pre', 'form'];
    var KEY_ESC = 27;
    var KEY_TAB = 9;

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    /*
     * ! MODIFICATION START Options 'spritesheetPath', 'spritesheetDimens',
     * 'iconSize' added by Andre Staltz.
     */
    $.emojiarea = {
        path: '',
        spritesheetPath: '',
        spritesheetDimens: [],
        iconSize: 20,
        icons: {},
        defaults: {
            button: null,
            buttonLabel: 'Emojis',
            buttonPosition: 'after',
            prefixSpace: true
        }
    };
    var defaultRecentEmojis = ':joy:,:kissing_heart:,:heart:,:heart_eyes:,:blush:,:grin:,:+1:,:relaxed:,:pensive:,:smile:,:sob:,:kiss:,:unamused:,:flushed:,:stuck_out_tongue_winking_eye:,:see_no_evil:,:wink:,:smiley:,:cry:,:stuck_out_tongue_closed_eyes:,:scream:,:rage:,:smirk:,:disappointed:,:sweat_smile:,:kissing_closed_eyes:,:speak_no_evil:,:relieved:,:grinning:,:yum:,:laughing:,:ok_hand:,:neutral_face:,:confused:'
        .split(',');
    /* ! MODIFICATION END */

    $.fn.emojiarea = function (options) {
        options = $.extend({}, $.emojiarea.defaults, options);
        return this
            .each(function () {
                var $textarea = $(this);
                new EmojiArea_Plain($textarea, options);
            });
    };

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    var util = {};

    util.restoreSelection = (function () {
        if (window.getSelection) {
            return function (savedSelection) {
                var sel = window.getSelection();
                sel.removeAllRanges();
                for (var i = 0, len = savedSelection.length; i < len; ++i) {
                    sel.addRange(savedSelection[i]);
                }
            };
        } else if (document.selection && document.selection.createRange) {
            return function (savedSelection) {
                if (savedSelection) {
                    savedSelection.select();
                }
            };
        }
    })();

    util.saveSelection = (function () {
        if (window.getSelection) {
            return function () {
                var sel = window.getSelection(), ranges = [];
                if (sel.rangeCount) {
                    for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                        ranges.push(sel.getRangeAt(i));
                    }
                }
                return ranges;
            };
        } else if (document.selection && document.selection.createRange) {
            return function () {
                var sel = document.selection;
                return (sel.type.toLowerCase() !== 'none') ? sel.createRange()
                    : null;
            };
        }
    })();

    util.replaceSelection = (function () {
        if (window.getSelection) {
            return function (content) {
                var range, sel = window.getSelection();
                var node = typeof content === 'string' ? document
                    .createTextNode(content) : content;
                if (sel.getRangeAt && sel.rangeCount) {
                    range = sel.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(document.createTextNode(' '));
                    range.insertNode(node);
                    range.setStart(node, 0);

                    window.setTimeout(function () {
                        range = document.createRange();
                        range.setStartAfter(node);
                        range.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }, 0);
                }
            }
        } else if (document.selection && document.selection.createRange) {
            return function (content) {
                var range = document.selection.createRange();
                if (typeof content === 'string') {
                    range.text = content;
                } else {
                    range.pasteHTML(content.outerHTML);
                }
            }
        }
    })();

    util.insertAtCursor = function (text, el, prefixSpace) {
        var textToInsert = prefixSpace ? ' ' + text : text;
        var val = el.value, startIndex, range;
        if (typeof el.selectionStart != 'undefined'
            && typeof el.selectionEnd != 'undefined') {
            startIndex = el.selectionStart;
            if (startIndex === 0) {
                // if at the start, then don't insert starting
                // space, even if prefixSpace set to true
                textToInsert = text;
            }
            el.value = val.substring(0, startIndex) + textToInsert
                + val.substring(el.selectionEnd);
            el.selectionStart = el.selectionEnd = startIndex + textToInsert.length;
        } else if (typeof document.selection != 'undefined'
            && typeof document.selection.createRange != 'undefined') {
            el.focus();
            range = document.selection.createRange();
            range.text = textToInsert;
            range.select();
        }
    };

    util.extend = function (a, b) {
        if (typeof a === 'undefined' || !a) {
            a = {};
        }
        if (typeof b === 'object') {
            for (var key in b) {
                if (b.hasOwnProperty(key)) {
                    a[key] = b[key];
                }
            }
        }
        return a;
    };

    util.escapeRegex = function (str) {
        return (str + '').replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
    };

    util.htmlEntities = function (str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };

    /*
     * ! MODIFICATION START This function was added by Igor Zhukov to save
     * recent used emojis.
     */
    util.emojiInserted = function (emojiKey, menu) {
        ConfigStorage.get('emojis_recent', function (curEmojis) {
            curEmojis = curEmojis || defaultRecentEmojis || [];

            var pos = curEmojis.indexOf(emojiKey);
            if (!pos) {
                return false;
            }
            if (pos != -1) {
                curEmojis.splice(pos, 1);
            }
            curEmojis.unshift(emojiKey);
            if (curEmojis.length > 42) {
                curEmojis = curEmojis.slice(42);
            }

            ConfigStorage.set({
                emojis_recent: curEmojis
            });
        })
    };
    /* ! MODIFICATION END */

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    var EmojiArea = function () {
    };

    EmojiArea.prototype.setup = function () {
        var self = this;

        this.$editor.on('focus', function () {
            self.hasFocus = true;
        });
        this.$editor.on('blur', function () {
            self.hasFocus = false;
        });

        this.setupButton();
    };

    EmojiArea.prototype.setupButton = function () {
        var self = this;
        var $button;

        if (this.options.button) {
            $button = $(this.options.button);
        } else if (this.options.button !== false) {
            $button = $('<a href="javascript:void(0)">');
            $button.html(this.options.buttonLabel);
            $button.addClass('emoji-button');
            $button.attr({
                title: this.options.buttonLabel
            });
            this.$editor[this.options.buttonPosition]($button);
        } else {
            $button = $('');
        }

        $button.on('click', function (e) {
            EmojiMenu.show(self);
            e.stopPropagation();
        });

        this.$button = $button;
    };

    /*
     * ! MODIFICATION START This function was modified by Andre Staltz so that
     * the icon is created from a spritesheet.
     */
    EmojiArea.createIcon = function (emoji, menu) {
        var category = emoji[0];
        var row = emoji[1];
        var column = emoji[2];
        var name = emoji[3];
        var filename = $.emojiarea.spritesheetPath;
        var iconSize = menu && Config.Mobile ? 26 : $.emojiarea.iconSize
        var xoffset = -(iconSize * column);
        var yoffset = -(iconSize * row);
        var scaledWidth = ($.emojiarea.spritesheetDimens[category][1] * iconSize);
        var scaledHeight = ($.emojiarea.spritesheetDimens[category][0] * iconSize);

        var style = 'display:inline-block;';
        style += 'width:' + iconSize + 'px;';
        style += 'height:' + iconSize + 'px;';
        style += 'background:url(\'' + filename.replace('!', category) + '\') '
            + xoffset + 'px ' + yoffset + 'px no-repeat;';
        style += 'background-size:' + scaledWidth + 'px ' + scaledHeight
            + 'px;';
        return '<images src="' + $.emojiarea.imagesPath + '/blank.gif" class="images" style="'
            + style + '" alt="' + util.htmlEntities(name) + '">';
    };

    $.emojiarea.createIcon = EmojiArea.createIcon;
    /* ! MODIFICATION END */

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    /**
     * Editor (plain-text)
     *
     * @constructor
     * @param {object}
     *            $textarea
     * @param {object}
     *            options
     */

    var EmojiArea_Plain = function ($textarea, options) {
        this.options = options;
        this.$textarea = $textarea;
        this.$editor = $textarea;
        this.setup();
    };

    EmojiArea_Plain.prototype.insert = function (emoji) {
        if (!$.emojiarea.icons.hasOwnProperty(emoji))
            return;

        var textAreaElement = angular.element(this.$textarea);
        if (!textAreaElement)
            return;

        if (!Config.rx_colons)
            Config.init_unified();

        var unicodeEmojiLength = 2;
        var newEmojiWithSpaceLength = this.options.prefixSpace ? unicodeEmojiLength + 1: unicodeEmojiLength;

        if (textAreaElement[0].textLength + newEmojiWithSpaceLength <= textAreaElement[0].maxLength) {
            // allow insert if there's enough room
            util.insertAtCursor(Config.mapcolon[emoji], this.$textarea[0], this.options.prefixSpace);
            /*
             * MODIFICATION: Following line was added by Igor Zhukov, in order to
             * save recent emojis
             */
            util.emojiInserted(emoji, this.menu);

            angular.element(this.$textarea).triggerHandler('change');
        } else if (!textAreaElement[0].maxLength || textAreaElement[0].maxLength === -1) {
            // support for textareas with no maxLength restriction
            util.insertAtCursor(Config.mapcolon[emoji], this.$textarea[0], this.options.prefixSpace);
            util.emojiInserted(emoji, this.menu);
            angular.element(this.$textarea).triggerHandler('change');
        }
    };

    EmojiArea_Plain.prototype.val = function () {
        return this.$textarea.val();
    };

    util.extend(EmojiArea_Plain.prototype, EmojiArea.prototype);

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    /**
     * Emoji Dropdown Menu
     *
     * @constructor
     * @param {object}
     *            emojiarea
     */
    var EmojiMenu = function () {
        var self = this;
        var $body = $(document.body);
        var $window = $(window);

        this.visible = false;
        this.emojiarea = null;
        this.$menu = $('<div>');
        this.$menu.addClass('emoji-menu');
        this.$menu.hide();

        /*
         * ! MODIFICATION START Following code was modified by Igor Zhukov, in
         * order to add scrollbars and tail to EmojiMenu Also modified by Andre
         * Staltz, to include tabs for categories, on the menu header.
         */
        this.$itemsTailWrap = $('<div class="emoji-items-wrap1"></div>')
            .appendTo(this.$menu);
        this.$categoryTabs = $(
            '<table class="emoji-menu-tabs"><tr>'
            + '<td><a class="emoji-menu-tab icon-recent"></a></td>'
            + '<td><a class="emoji-menu-tab icon-smile"></a></td>'
            + '<td><a class="emoji-menu-tab icon-flower"></a></td>'
            + '<td><a class="emoji-menu-tab icon-bell"></a></td>'
            + '<td><a class="emoji-menu-tab icon-car"></a></td>'
            + '<td><a class="emoji-menu-tab icon-grid"></a></td>'
            + '</tr></table>').appendTo(this.$itemsTailWrap);
        this.$itemsWrap = $(
            '<div class="emoji-items-wrap nano mobile_scrollable_wrap"></div>')
            .appendTo(this.$itemsTailWrap);
        this.$items = $('<div class="emoji-items nano-content">').appendTo(
            this.$itemsWrap);
        /* ! MODIFICATION END */

        $body.append(this.$menu);

        /*
         * ! MODIFICATION: Following 3 lines were added by Igor Zhukov, in order
         * to add scrollbars to EmojiMenu
         */

        if (!Config.Mobile) {
            this.$itemsWrap.nanoScroller({
                preventPageScrolling: true, tabIndex: -1
            });
        }


        //this.$itemsWrap.nanoScroller({preventPageScrolling: true, tabIndex:* -1});

        $body.on('keydown', function (e) {
            if (e.keyCode === KEY_ESC || e.keyCode === KEY_TAB) {
                self.hide();
            }
        });

        /*
         * ! MODIFICATION: Following 3 lines were added by Igor Zhukov, in order
         * to hide menu on message submit with keyboard
         */
        $body.on('message_send', function (e) {
            self.hide();
        });

        $body.on('mouseup', function (e) {
            /*
             * ! MODIFICATION START Following code was added by Igor Zhukov, in
             * order to prevent close on click on EmojiMenu scrollbar
             */
            e = e.originalEvent || e;
            var target = e.originalTarget || e.target || window;
            while (target && target != window) {
                target = target.parentNode;
                if (target == self.$menu[0] || self.emojiarea
                    && target == self.emojiarea.$button[0]) {
                    return;
                }
            }
            /* ! MODIFICATION END */
            self.hide();
        });

        $window.on('resize', function () {
            if (self.visible)
                self.reposition();
        });

        this.$menu.on('mouseup', 'a', function (e) {
            e.stopPropagation();
            return false;
        });

        this.$menu.on('click', 'a', function (e) {
            /*
             * ! MODIFICATION START Following code was modified by Andre Staltz,
             * to capture clicks on category tabs and change the category
             * selection.
             */
            if ($(this).hasClass('emoji-menu-tab')) {
                if (self.getTabIndex(this) !== self.currentCategory) {
                    self.selectCategory(self.getTabIndex(this));
                }
                return false;
            }
            /* ! MODIFICATION END */
            var emoji = $('.label', $(this)).text();
            window.setTimeout(function () {
                self.onItemSelected(emoji);
                /*
                 * ! MODIFICATION START Following code was modified by Igor
                 * Zhukov, in order to close only on ctrl-, alt- emoji select
                 */
                if (e.ctrlKey || e.metaKey) {
                    self.hide();
                }
                /* ! MODIFICATION END */
            }, 0);
            e.stopPropagation();
            return false;
        });

        /*
         * MODIFICATION: Following line was modified by Andre Staltz, in order
         * to select a default category.
         */
        this.selectCategory(1);
    };

    /*
     * ! MODIFICATION START Following code was added by Andre Staltz, to
     * implement category selection.
     */
    EmojiMenu.prototype.getTabIndex = function (tab) {
        return this.$categoryTabs.find('.emoji-menu-tab').index(tab);
    };

    EmojiMenu.prototype.selectCategory = function (category) {
        var self = this;
        this.$categoryTabs.find('.emoji-menu-tab').each(function (index) {
            if (index === category) {
                this.className += '-selected';
            } else {
                this.className = this.className.replace('-selected', '');
            }
        });
        this.currentCategory = category;
        this.load(category);


        if (!Config.Mobile) {
            this.$itemsWrap.nanoScroller({
                scroll: 'top'
            });
        }


    };
    /* ! MODIFICATION END */

    EmojiMenu.prototype.onItemSelected = function (emoji) {
        this.emojiarea.insert(emoji);
    };

    /*
     * MODIFICATION: The following function argument was modified by Andre
     * Staltz, in order to load only icons from a category. Also function was
     * modified by Igor Zhukov in order to display recent emojis from
     * localStorage
     */
    EmojiMenu.prototype.load = function (category) {
        var html = [];
        var options = $.emojiarea.icons;
        var path = $.emojiarea.path;
        var self = this;
        if (path.length && path.charAt(path.length - 1) !== '/') {
            path += '/';
        }

        /*
         * ! MODIFICATION: Following function was added by Igor Zhukov, in order
         * to add scrollbars to EmojiMenu
         */
        var updateItems = function () {
            self.$items.html(html.join(''));


            if (!Config.Mobile) {
                setTimeout(function () {
                    self.$itemsWrap.nanoScroller();
                }, 100);
            }

        }

        if (category > 0) {
            for (var key in options) {
                /*
                 * MODIFICATION: The following 2 lines were modified by Andre
                 * Staltz, in order to load only icons from the specified
                 * category.
                 */
                if (options.hasOwnProperty(key)
                    && options[key][0] === (category - 1)) {
                    html.push('<a href="javascript:void(0)" title="'
                        + util.htmlEntities(key) + '">'
                        + EmojiArea.createIcon(options[key], true)
                        + '<span class="label">' + util.htmlEntities(key)
                        + '</span></a>');
                }
            }
            updateItems();
        } else {
            ConfigStorage.get('emojis_recent', function (curEmojis) {
                curEmojis = curEmojis || defaultRecentEmojis || [];
                var key, i;
                for (i = 0; i < curEmojis.length; i++) {
                    key = curEmojis[i]
                    if (options[key]) {
                        html.push('<a href="javascript:void(0)" title="'
                            + util.htmlEntities(key) + '">'
                            + EmojiArea.createIcon(options[key], true)
                            + '<span class="label">'
                            + util.htmlEntities(key) + '</span></a>');
                    }
                }
                updateItems();
            });
        }
    };

    EmojiMenu.prototype.reposition = function () {
        var $button = this.emojiarea.$button;
        var offset = $button.offset();
        offset.top += $button.outerHeight();
        offset.left += Math.round($button.outerWidth() / 2);

        this.$menu.css({
            top: offset.top,
            left: offset.left
        });
    };

    EmojiMenu.prototype.hide = function (callback) {
        if (this.emojiarea) {
            this.emojiarea.menu = null;
            this.emojiarea.$button.removeClass('on');
            this.emojiarea = null;
        }

        this.visible = false;
        this.$menu.hide("fast");
    };

    EmojiMenu.prototype.show = function (emojiarea) {
        /*
         * MODIFICATION: Following line was modified by Igor Zhukov, in order to
         * improve EmojiMenu behaviour
         */
        if (this.emojiarea && this.emojiarea === emojiarea)
            return this.hide();
        emojiarea.$button.addClass('on');
        this.emojiarea = emojiarea;
        this.emojiarea.menu = this;

        this.reposition();
        this.$menu.show("fast");
        /*
         * MODIFICATION: Following 3 lines were added by Igor Zhukov, in order
         * to update EmojiMenu contents
         */
        if (!this.currentCategory) {
            this.load(0);
        }
        this.visible = true;
    };

    EmojiMenu.show = (function () {
        var menu = null;
        return function (emojiarea) {
            menu = menu || new EmojiMenu();
            menu.show(emojiarea);
        };
    })();

})(jQuery, window, document);