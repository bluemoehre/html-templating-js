/**
 * @license MIT
 * @author BlueMöhre <bluemoehre@gmx.de>
 * @copyright 2014 BlueMöhre
 * @link http://www.github.com/bluemoehre
 */
(function (win, doc) {

    'use strict';

    // ----- Config (edit here) -----

    var config = {

        // All elements having a data-attr with this key will be used. (e.g. "data-tpl")
        dataKey: 'tpl',

        // Placeholder for images without valid URLs
        imgSrc: 'dummy.png',

        // Path to jQuery (only used internally)
        jquerySrc: 'jquery.min.js',

        // the JavaScript files listed here will be added to each page's head
        js: [],

        // the stylesheet files listed here will be added to each page's head
        css: [
            'dummy.css'
        ],

        // the HTML files listed here will be loaded for inclusion of templates
        html: [
            '_partials.html'
        ]
    };


    // ----- do not edit below this line if you do not know what you are doing! -----

    var debug = win.console;

    var jTag = doc.createElement('script');
    jTag.type = 'text/javascript';
    jTag.src = config.jquerySrc;
    jTag.addEventListener('load', function () {
        debug.info('jQuery loaded');

        var $ = win.jQuery;
        var $doc = $(doc);
        var replacements = {};
        var docReady = $.Deferred();
        var tplReady = $.Deferred();
        var $editButton = $('<button style="position:fixed; right:10px; top:10px; z-index:9999;">Edit Contents</button>');

        /**
         * Create random key
         * @param length
         * @returns {string}
         */
        function randKey(length) {
            var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
            var ret = '';
            var i;
            for (i = 0; i < length; i++) {
                ret += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return ret;
        }

        /**
         * Create random text
         * @param {number} targetCharCount
         * @param {boolean} [punctation]
         * @returns {string}
         */
        function loremIpsum(targetCharCount, punctation) {
            punctation = punctation === undefined ? true : false;
            var dummyWordString = 'molestie a lectus hendrerit gravida proin pulvinar sed nibh feugiat semper praesent tincidunt nec urna posuere fermentum in risus tristique adipiscing donec diam aenean odio commodo quis morbi facilisis eu elementum at leo convallis pharetra maecenas egestas turpis ac fames malesuada et netus senectus habitant pellentesque mauris scelerisque elit vel rhoncus congue vitae cursus arcu ipsum vehicula nullam facilisi nulla amet sit sollicitudin duis consectetur dolor lorem interdum faucibus suspendisse lacus quam non etiam id quisque varius eget porttitor nunc enim integer tellus viverra tortor dignissim curabitur laoreet volutpat iaculis tempus accumsan dui imperdiet erat mattis ante est vulputate pretium massa nisl consequat cras aliquam rutrum phasellus orci neque augue auctor mollis purus ut sodales ultrices velit nam dictum blandit lacinia euismod vestibulum ullamcorper tempor metus aliquet ultricies placerat fringilla sem venenatis fusce bibendum felis vivamus ornare libero mi sapien justo sagittis eleifend nisi luctus ligula suscipit mus ridiculus nascetur montes parturient dis magnis penatibus natoque sociis cum lobortis magna porta dictumst platea habitasse hac potenti eros condimentum dapibus';
            var dummyWordArray = dummyWordString.split(/\s+/);
            var output = [];
            var totalCharCount = 0;
            var wordsInSentence = 0;
            var wordsInSubSentence = 0;
            var word = '';
            var random = 0;
            while (totalCharCount <= targetCharCount) {
                word = dummyWordArray[Math.floor(Math.random() * dummyWordArray.length)];
                // capitalize
                if (!wordsInSentence) {
                    word = word.charAt(0).toUpperCase() + word.slice(1);
                }
                // randomly add comma and dots
                random = Math.round(Math.random() * 10);
                if (punctation && wordsInSentence > 3 && totalCharCount + 20 < targetCharCount && random < 3) {
                    word += '.';
                    wordsInSentence = 0;
                    wordsInSubSentence = 0;
                } else if (punctation && wordsInSubSentence > 3 && totalCharCount + 20 < targetCharCount && random < 4) {
                    word += ',';
                    wordsInSubSentence = 0;
                } else {
                    wordsInSentence++;
                    wordsInSubSentence++;
                }
                output.push(word);
                totalCharCount += word.length;
                totalCharCount++; // trailing whitespace
            }
            output = output.join(' ');
            if (punctation) {
                output = output.slice(0, targetCharCount - 1) + '.';
            } else {
                output = output.slice(0, targetCharCount);
            }
            return output.toString();
        }

        /**
         * Create random number
         * @param {number} length
         * @returns {string}
         */
        function randomNumber(length) {
            var ret = '';
            while (ret.length < length) {
                ret += (Math.random().toString()).slice(2);
            }
            return ret.slice(-length);
        }

        /**
         * Clone elements where specified
         * @param {jQuery} $nodes
         * @returns {number}
         */
        function clones($nodes) {
            debug.log('clones');
            return $nodes.find('[data-clone]').each(function (idx, el) {
                var $el = $(el);
                var count = $el.data('clone');
                var i, clone;
                $el.removeAttr('data-clone');
                for (i = 1; i < count; i++) {
                    clone = $el.clone(); // do not copy event listeners. they should be attached with document ready (which is holded here)
                    // count up IDs and FORs
                    clone.find('[id]').each(function (idx, el) {
                        var id = el.id.replace(/\W/g, '') + (parseInt(el.id.replace(/\D/g, '')) || i) + '-' + randKey(5);
                        clone.find('[for="' + el.id + '"]').attr('for', id);
                        el.id = id;
                    });
                    $el.after(clone);
                }
            }).length;
        }

        /**
         * Replace all placeholders
         * @param {jQuery} $nodes
         * @returns {number}
         */
        function placeholders($nodes) {
            debug.log('placeholders');
            return $nodes.find('var').not('[data-noreplacement]').each(function () {
                if (replacements[this.textContent]) {
                    var $clone = $(replacements[this.textContent]);
                    var i;
                    // copy attributes from VAR to clone
                    for (i = 0; i < this.attributes.length; i++) {
                        if (this.attributes[i].name === 'class') {
                            $clone.addClass(this.attributes[i].value);
                        } else {
                            $clone.attr(this.attributes[i].name, this.attributes[i].value);
                        }
                    }
                    $(this).replaceWith($clone);
                } else if (this.textContent.match(/text\(\d+\)/)) {
                    $(this).replaceWith(loremIpsum(this.textContent.match(/text\((\d+)\)/)[1]));
                } else if (this.textContent.match(/string\(\d+\)/)) {
                    $(this).replaceWith(loremIpsum(this.textContent.match(/string\((\d+)\)/)[1], false));
                } else if (this.textContent.match(/number\(\d+\)/)) {
                    $(this).replaceWith(randomNumber(this.textContent.match(/number\((\d+)\)/)[1], false));
                } else {
                    $(this).attr('data-noreplacement', '1');
                }
            }).length;
        }

        /**
         * Registers a placeholder
         * @param html
         */
        function addPlaceholder(html) {
            var $el = $(html);
            replacements[$el.attr('data-' + config.dataKey)] = $el.html();
        }

        /**
         * Main function
         * @param {jQuery} $nodes
         */
        function run(nodes) {
            var $nodes = nodes ? $(nodes) : $doc;

            if ($editButton.parent().length < 1) {
                $editButton.appendTo('body');
            }

            // run cloning and replacing placeholders as long, as there are such elements present
            var cp = 1;
            while (cp) {
                cp = Math.max(clones($nodes), placeholders($nodes));
            }

            // mark images without any src as faulty
            $nodes.find('img[src=""]').addBack('img[src=""]').css('background', 'red');

            // replace image src placeholders with some default image
            $nodes.find('img[src^="#"]').addBack('img[src^="#"]').each(function (idx, el) {
                el.src = config.imgSrc;
            });
        }


        // insert scripts & styles
        debug.info('adding styles and scripts');
        var i, append, head = doc.getElementsByTagName('head')[0];
        for (i = 0; i < config.css.length; i++) {
            append = doc.createElement('link');
            append.rel = 'stylesheet';
            append.href = config.css[i];
            head.appendChild(append);
        }
        for (i = 0; i < config.js.length; i++) {
            append = doc.createElement('script');
            append.type = 'text/javascript';
            append.src = config.js[i];
            head.appendChild(append);
        }


        // placeholder replacements
        debug.info('replacing placeholders');
        // get local templates
        $doc.find('[data-' + config.dataKey + ']').each(function (idx, el) {
            addPlaceholder(el);
        });
        // get remote templates
        for (i = 0; i < config.html.length; i++) {
            $.get(config.html[i], function (data) {
                $(data).find('[data-' + config.dataKey + ']').addBack('[data-' + config.dataKey + ']').each(function (idx, el) {
                    addPlaceholder(el);
                });
            }).always(function () {
                i--;
                if (i < 1) {
                    debug.info('html loaded');
                    tplReady.resolve();
                }
            });
        }
        if (!config.html.length) {
            tplReady.resolve();
        }


        debug.info('holding ready event');
        $.holdReady(true);


        $.when(docReady, tplReady).done(function () {
            run();
            debug.info('releasing ready event');
            $.holdReady(false);
        });

        $doc
            .on('DOMContentLoaded', function () {
                debug.info('DOMContentLoaded');
                docReady.resolve();
            })
            .on('ajaxStop DOMContentAdded', function (nodes) {
                run(nodes);
            });
        if (['complete', 'loaded', 'interactive'].indexOf(doc.readyState) > -1) {
            docReady.resolve();
        }

        // Make several elements editable in browser
        $editButton.on('click', function () {
            var selector = 'p,h1,h2,h3,h4,h5,h6,span,a,strong,li,label';
            var nodes = $doc.find(selector).addBack(selector);
            if (!$editButton.data('active')) {
                nodes
                    .attr('contenteditable', true)
                    .on('focus.editable', function () {
                        $.data(this, 'backup', this.innerHTML);
                    })
                    .on('keyup.editable', function (evt) {
                        if (evt.which === 27) {
                            this.innerHTML = $.data(this, 'backup');
                            $(this).trigger('blur');
                        }
                    });
                $editButton.css('color', 'red');
                $editButton.data('active', true);
            } else {
                nodes.attr('contenteditable', false).off('*.editable');
                $editButton.css('color', 'initial');
                $editButton.data('active', false);
            }
        });
    });

    doc.getElementsByTagName('head')[0].appendChild(jTag);
})(window, document);