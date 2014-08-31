﻿define(['require', './workerclient', './graphics', './input'], function (require) {
    "use strict";

    var WorkerClient = require('./workerclient');
    var Graphics = require('./graphics');
    var Input = require('./input');

    function Runtime(editor, canvasHolder) {
        this.editor = editor;
        this.canvasHolder = canvasHolder;

        this.openWorker();
    }

    Runtime.prototype = {
        close: function close() {
            this.worker.send('')
            window.close();
        },
        init: function init(code) {
            this.worker.send('init', code);
        },
        start: function start() {
            if (!this.worker)
                throw new Error('Worker not initialize yet');
            // Start the worker
            this.worker.send('start');
        },


        openWorker: function () {
            if (this.worker)
                throw new Error('A worker is already opened');      // TODO Destroy the previous one
            this.worker = new WorkerClient('../build/runtime/worker.js');

            this.worker.on('ready', function ready() {
                // Setup the output and input when the worker is ready
                this.graphics = new Graphics(this.worker, this.canvasHolder);
                this.input = new Input(this.worker, this.canvasHolder, this.graphics.canvas);
                // And set the screen size
                this.graphics.setSize(640, 480);

                // Finally when the worker is ready the whole
                // runtime is ready. Tell that also to the editor
                // so that it can send back the code.
                this.editor.runtimeReady();
            }.bind(this));
        }
    };

    return Runtime;
});