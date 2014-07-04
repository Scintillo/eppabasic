﻿function Graphics2D(canvasHolder, heap) {
    this.canvas = document.createElement('canvas');
    canvasHolder.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    this.MEMU8 = new Int8Array(heap);
    this.MEMS32 = new Int32Array(heap);
    this.MEMF32 = new Float32Array(heap);

    // Make all functions to use right this
    for (func in this.env) {
        if (this.env.hasOwnProperty(func))
            this.env[func] = this.env[func].bind(this);
    }
}

Graphics2D.prototype = {
    setSize: function setSize(widht, height) {
        this.canvas.width = widht;
        this.canvas.height = height;
    },

    /*
     * Functions for the program
     */
    env: {
        clearColor: function clearColor(r, g, b) {
            this.clearColor = 'rgb(' + r + ',' + g + ',' + b + ')';
        },
        lineColor: function lineColor(r, g, b) {
            this.ctx.strokeStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
        },
        fillColor: function fillColor(r, g, b) {
            this.ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
        },
        rect: function rect(x, y, w, h) {
            this.ctx.beginPath();
            this.ctx.rect(x, y, w, h);
            this.ctx.stroke();
        },
        fillRect: function fillRect(x, y, w, h) {
            this.ctx.fillRect(x, y, w, h);
        },
        circle: function circle(x, y, r) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, r, 0, 2 * Math.PI, false);
            this.ctx.stroke();
        },
        fillCircle: function fillCircle(x, y, r) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, r, 0, 2 * Math.PI, false);
            this.ctx.fill();
        },
        line: function line(x1, y1, x2, y2) {
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        },
        dot: function dot(x, y) {
            this.ctx.fillRect(x, y, 1, 1);
        },
        text: function text(x, y, ptr) {
            var len = this.MEMS32[ptr >> 2];
            var buf = [];
            for (var i = 0; i < len; i++) {
                buf.push(String.fromCharCode(this.MEMU8[ptr + i + 8]));
            }
            var str = buf.join('');

            var x = this.MEMS32[(sp - 12) >> 2];
            var y = this.MEMS32[(sp - 8) >> 2];

            this.ctx.fillText(str, x, y);
        },
        clear: function clear() {
            var origStyle = this.ctx.fillStyle;
            this.ctx.fillStyle = this.clearColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = origStyle;
        },
        drawScreen: function drawScreen() {
        }
    },
    stdlib: {}
};