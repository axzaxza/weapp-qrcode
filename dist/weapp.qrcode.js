/**
 * weapp.qrcode.js v2.0.0 (Canvas 2D Version)
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            (global.drawQrcode = factory());
}(this, (function () {
    'use strict';

    // 保留原有的工具函数和QR码生成核心逻辑
    var hasOwn = Object.prototype.hasOwnProperty;
    var toStr = Object.prototype.toString;
    var defineProperty = Object.defineProperty;
    var gOPD = Object.getOwnPropertyDescriptor;

    var isArray = function isArray(arr) {
        if (typeof Array.isArray === 'function') {
            return Array.isArray(arr);
        }
        return toStr.call(arr) === '[object Array]';
    };

    var isPlainObject = function isPlainObject(obj) {
        if (!obj || toStr.call(obj) !== '[object Object]') {
            return false;
        }

        var hasOwnConstructor = hasOwn.call(obj, 'constructor');
        var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
        if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
            return false;
        }

        var key;
        for (key in obj) { /**/ }

        return typeof key === 'undefined' || hasOwn.call(obj, key);
    };

    var extend = function extend() {
        var options, name, src, copy, copyIsArray, clone;
        var target = arguments[0];
        var i = 1;
        var length = arguments.length;
        var deep = false;

        if (typeof target === 'boolean') {
            deep = target;
            target = arguments[1] || {};
            i = 2;
        }
        if (target == null || (typeof target !== 'object' && typeof target !== 'function')) {
            target = {};
        }

        for (; i < length; ++i) {
            options = arguments[i];
            if (options != null) {
                for (name in options) {
                    src = target[name];
                    copy = options[name];

                    if (target !== copy) {
                        if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
                            if (copyIsArray) {
                                copyIsArray = false;
                                clone = src && isArray(src) ? src : [];
                            } else {
                                clone = src && isPlainObject(src) ? src : {};
                            }
                            target[name] = extend(deep, clone, copy);
                        } else if (typeof copy !== 'undefined') {
                            target[name] = copy;
                        }
                    }
                }
            }
        }
        return target;
    };

    function drawQrcode(options) {
        options = options || {};
        options = extend(true, {
            width: 256,
            height: 256,
            x: 0,
            y: 0,
            typeNumber: -1,
            correctLevel: QRErrorCorrectLevel.H,
            background: '#ffffff',
            foreground: '#000000',
            image: {
                imageResource: '',
                dx: 0,
                dy: 0,
                dWidth: 100,
                dHeight: 100
            }
        }, options);

        if (!options.canvasId && !options.canvas) {
            console.warn('please set canvasId or canvas!');
            return;
        }

        function createCanvas() {
            // 创建QR码数据
            var qrcode = new QRCode(options.typeNumber, options.correctLevel);
            qrcode.addData(utf16to8(options.text));
            qrcode.make();

            // 获取canvas上下文
            var ctx;
            if (options.canvas) {
                ctx = options.canvas.getContext('2d');
            } else {
                const query = options._this ? options._this.createSelectorQuery() : wx.createSelectorQuery();
                query.select('#' + options.canvasId)
                    .fields({ node: true, size: true })
                    .exec((res) => {
                        if (!res[0]) {
                            console.error('Failed to get canvas node!');
                            return;
                        }

                        const canvas = res[0].node;
                        ctx = canvas.getContext('2d');

                        // 设置canvas尺寸和像素比
                        const dpr = wx.getSystemInfoSync().pixelRatio;
                        canvas.width = options.width * dpr;
                        canvas.height = options.height * dpr;
                        ctx.scale(dpr, dpr);

                        // 计算每个QR码模块的大小
                        var tileW = options.width / qrcode.getModuleCount();
                        var tileH = options.height / qrcode.getModuleCount();

                        // 绘制QR码
                        for (var row = 0; row < qrcode.getModuleCount(); row++) {
                            for (var col = 0; col < qrcode.getModuleCount(); col++) {
                                ctx.fillStyle = qrcode.isDark(row, col) ? options.foreground : options.background;
                                var w = Math.ceil((col + 1) * tileW) - Math.floor(col * tileW);
                                var h = Math.ceil((row + 1) * tileW) - Math.floor(row * tileW);
                                ctx.fillRect(Math.round(col * tileW) + options.x, Math.round(row * tileH) + options.y, w, h);
                            }
                        }

                        // 绘制图片
                        if (options.image.imageResource) {
                            const img = canvas.createImage();
                            img.src = options.image.imageResource;
                            img.onload = () => {
                                ctx.drawImage(
                                    img,
                                    options.image.dx,
                                    options.image.dy,
                                    options.image.dWidth,
                                    options.image.dHeight
                                );
                                options.callback && options.callback();
                            };
                        } else {
                            options.callback && options.callback();
                        }
                    });
            }
        }

        createCanvas();
    }

    return drawQrcode;

})));
