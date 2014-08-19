﻿define(function () {

    function CompilerAbsoluteStackReference(type, offset, reserved, context) {
        /// <param name='type' type='BaseType' />
        /// <param name='offset' type='Number' />
        /// <param name='reserved' type='Number' />
        /// <param name='context' type='CompilerContext' />
        this.type = type;
        this.offset = offset;
        this.reserved = reserved;
        this.context = context;
        this.types = this.context.types;
        this.refCount = 1;
    }
    CompilerAbsoluteStackReference.prototype = {
        setValue: function setValue(value, context) {
            if (!context)
                context = this.context;
            var mem = 'MEMS32';
            var shift = 2;
            if (this.type === this.types.Double) {
                mem = 'MEMF64';
                shift = 3;
            }
            context.push(mem + '[(SB+' + this.offset + '|0)>>' + shift + ']=' + value.type.castTo(value.getValue(), this.type) + ';');
        },
        getValue: function getValue() {
            var mem = 'MEMS32';
            var shift = 2;
            if (this.type === this.types.Double) {
                mem = 'MEMF64';
                shift = 3;
            }
            return this.type.cast(mem + '[(SB+' + this.offset + '|0)>>' + shift + ']');
        },
        freeRef: function freeRef(real) {
            if (real !== false)
                real = true;
            if (!this.refCount)
                throw new Error('No reference to free');

            var size = 4;
            if (this.type === this.types.Double)
                size = 8;
            if (real && this.context.stackOffset - size !== this.offset)
                throw new Error('Stack popped in wrong order!');
            this.context.push('SP=(SP-' + this.reserved + ')|0;');
            if (real) {
                this.refCount--;
                if (!this.refCount)     // Was the last reference
                    this.context.stackOffset -= this.reserved;
            }
        },
        refType: 'absstack'
    };

    return CompilerAbsoluteStackReference;
});