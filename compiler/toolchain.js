function CompilationUnit(ast, compiler, errors) {
    this.ast = ast;
    this.compiler = compiler;
    this.errors = errors;
}

CompilationUnit.prototype = {

}

function Toolchain() {
    this.types = new TypeContainer();
    this.operators = new OperatorContainer(this.types);
    this.operators.addDefaultOperators();
}

Toolchain.prototype = {
    parse: function (code) {
        var parser = this.getParser(code);
        var ast;
        var compiler;

        try {
            ast = parser.parse();
        } catch (e) {
            console.log(e);
        }

        if (parser.errors.length === 0) {
            compiler = new Compiler(ast, this.operators, this.types);
            this.defineFunctions(compiler);
        }

        return new CompilationUnit(ast, compiler, parser.errors);
    },

    check: function (compilationUnit) {
        var ast = compilationUnit.ast;
        var compiler = compilationUnit.compiler;

        if (compilationUnit.errors.length === 0) {
            var typechecker = new Typechecker(ast, compiler.functions, this.operators, this.types);
            try {
                typechecker.check();
            } catch (e) {
                console.log(e);
            }
            Array.prototype.push.apply(compilationUnit.errors, typechecker.errors);
        }
        if (compilationUnit.errors.length === 0) {
            new Atomicchecker(ast, compiler.functions).check();
        }
    },

    compile: function (compilationUnit) {
        return compilationUnit.compiler.compile();
    },

    getParser: function (code) {
        return new Parser(code, this.operators, this.types);
    },

    defineFunctions: function (compiler) {
        //// Drawing functions
        compiler.defineJsFunction('env.clearColor', true, 'ClearColor', [this.types.Integer, this.types.Integer, this.types.Integer]);
        compiler.defineJsFunction('env.lineColor', true, 'DrawColor', [this.types.Integer, this.types.Integer, this.types.Integer]);
        compiler.defineJsFunction('env.lineColor', true, 'LineColor', [this.types.Integer, this.types.Integer, this.types.Integer]);
        compiler.defineJsFunction('env.fillColor', true, 'FillColor', [this.types.Integer, this.types.Integer, this.types.Integer]);
        compiler.defineJsFunction('env.line', true, 'DrawLine', [this.types.Integer, this.types.Integer, this.types.Integer, this.types.Integer]);
        compiler.defineJsFunction('env.line', true, 'Line', [this.types.Integer, this.types.Integer, this.types.Integer, this.types.Integer]);
        compiler.defineJsFunction('env.circle', true, 'DrawCircle', [this.types.Integer, this.types.Integer, this.types.Integer]);
        compiler.defineJsFunction('env.circle', true, 'Circle', [this.types.Integer, this.types.Integer, this.types.Integer]);
        compiler.defineJsFunction('env.fillCircle', true, 'FillCircle', [this.types.Integer, this.types.Integer, this.types.Integer]);
        compiler.defineJsFunction('env.rect', true, 'DrawRect', [this.types.Integer, this.types.Integer, this.types.Integer, this.types.Integer]);
        compiler.defineJsFunction('env.rect', true, 'Rect', [this.types.Integer, this.types.Integer, this.types.Integer, this.types.Integer]);
        compiler.defineJsFunction('env.fillRect', true, 'FillRect', [this.types.Integer, this.types.Integer, this.types.Integer, this.types.Integer]);
        compiler.defineJsFunction('env.dot', true, 'DrawDot', [this.types.Integer, this.types.Integer]);
        compiler.defineJsFunction('env.dot', true, 'Dot', [this.types.Integer, this.types.Integer]);
        compiler.defineJsFunction('env.clear', true, 'ClearScreen', []);
        compiler.defineJsFunction('env.clear', true, 'Clear', []);
        compiler.defineJsFunction('env.drawScreen', true, 'DrawScreen', [], undefined, false);

        compiler.defineJsFunction('env.drawText', true, 'DrawText', [this.types.Integer, this.types.Integer, this.types.String]);
        compiler.defineJsFunction('env.textColor', true, 'TextColor', [this.types.Integer, this.types.Integer, this.types.Integer]);
        compiler.defineJsFunction('env.textFont', true, 'TextFont', [this.types.String]);
        compiler.defineJsFunction('env.textSize', true, 'TextSize', [this.types.Integer]);

        compiler.defineJsFunction('env.message', true, 'Message', [this.types.String]);
        compiler.defineJsFunction('env.askNumber', true, 'AskNumber', [this.types.String], this.types.Double);
        compiler.defineJsFunction('env.askText', true, 'AskText', [this.types.String], this.types.String);


        //compiler.defineJsFunction('env.fullScreen', true, 'FullScreen', []);                  // Reserved for a better day

        /// Screen size
        compiler.defineJsFunction('env.width', true, 'Width', [], this.types.Integer);
        compiler.defineJsFunction('env.height', true, 'Height', [], this.types.Integer);

        /// Memory functions
        compiler.defineJsFunction('__peek32', false, 'Peek32', [this.types.Integer], this.types.Integer);
        compiler.defineJsFunction('__poke32', false, 'Poke32', [this.types.Integer, this.types.Integer]);
        compiler.defineJsFunction('__memsize', false, 'MemorySize', [], this.types.Integer);

        //compiler.defineJsFunction('TEXT', [Types.Integer, Types.Integer, Types.String], 'text');

        ////compiler.defineJsFunction('SHOWCONSOLE', [], 'showConsole');
        ////compiler.defineJsFunction('HIDECONSOLE', [], 'hideConsole');

        //// Mathematical functions
        compiler.defineJsFunction('stdlib.Math.sin', true, 'Sin', [this.types.Double], this.types.Double);
        compiler.defineJsFunction('stdlib.Math.cos', true, 'Cos', [this.types.Double], this.types.Double);
        compiler.defineJsFunction('stdlib.Math.tan', true, 'Tan', [this.types.Double], this.types.Double);
        compiler.defineJsFunction('stdlib.Math.sqrt', true, 'Sqr', [this.types.Double], this.types.Double);
        compiler.defineJsFunction('stdlib.Math.abs', true, 'Abs', [this.types.Integer], this.types.Integer);
        compiler.defineJsFunction('stdlib.Math.abs', true, 'Abs', [this.types.Double], this.types.Double);

        compiler.defineJsFunction('stdlib.Math.min', true, 'Min', [this.types.Double, this.types.Double], this.types.Double);
        compiler.defineJsFunction('stdlib.Math.min', true, 'Min', [this.types.Integer, this.types.Integer], this.types.Integer);
        compiler.defineJsFunction('stdlib.Math.max', true, 'Max', [this.types.Double, this.types.Double], this.types.Double);
        compiler.defineJsFunction('stdlib.Math.max', true, 'Max', [this.types.Integer, this.types.Integer], this.types.Integer);


        compiler.defineJsFunction('env.randInt', true, 'Rnd', [this.types.Integer, this.types.Integer], this.types.Integer);
        compiler.defineJsFunction('env.randDbl', true, 'Rnd', [], this.types.Double);

        //compiler.defineJsFunction('SQRT', [Types.Double], 'sqrt', Types.Double);

        //compiler.defineJsFunction('RANDOM', [], 'random', Types.Double);
        //compiler.defineJsFunction('RANDINT', [Types.Integer, Types.Integer], 'randint', Types.Integer);


        //// Time functions
        compiler.defineJsFunction('env.hours', true, 'Hours', [], this.types.Integer);
        compiler.defineJsFunction('env.minutes', true, 'Minutes', [], this.types.Integer);
        compiler.defineJsFunction('env.seconds', true, 'Seconds', [], this.types.Integer);
        compiler.defineJsFunction('env.milliseconds', true, 'MilliSeconds', [], this.types.Integer);

        //// Input
        compiler.defineJsFunction('env.keyDown', true, 'KeyDown', [this.types.Integer], this.types.Boolean);
        compiler.defineJsFunction('env.keyUp', true, 'KeyUp', [this.types.Integer], this.types.Boolean);
        compiler.defineJsFunction('env.keyHit', true, 'KeyHit', [this.types.Integer], this.types.Boolean);
        compiler.defineJsFunction('env.mouseX', true, 'MouseX', [], this.types.Integer);
        compiler.defineJsFunction('env.mouseY', true, 'MouseY', [], this.types.Integer);
        compiler.defineJsFunction('env.mouseDown', true, 'MouseDown', [this.types.Integer], this.types.Boolean);

        //// Output
        compiler.defineJsFunction('env.printInt', true, 'Print', [this.types.Integer]);
        compiler.defineJsFunction('env.printDbl', true, 'Print', [this.types.Double]);
        compiler.defineJsFunction('env.printStr', true, 'Print', [this.types.String]);
        //compiler.defineJsFunction('PRINT', [Types.String], 'print');
        //compiler.defineJsFunction('PRINT', [Types.Double], 'printDbl');
        //compiler.defineJsFunction('PRINT', [Types.Integer], 'printInt');

        //// Casting
        compiler.defineJsFunction('__int', false, 'Int', [this.types.Integer], this.types.Integer);
    }
}