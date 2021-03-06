﻿
define(['./framework/compileerror', 'xregexp'], function (CompileError, XRegExp) {
    // Add horizontal whitespace token to regex
    XRegExp.addToken(
        /\\h/,
        function (match, scope) {
            var range = '\\t\\u0020\\u00A0\\u1680\\u180E\\u2000-\\u200A\\u202F\\u205F\\u3000';
            return scope === XRegExp.INSIDE_CLASS ?
                renge : '[' + range + ']';
        },
         XRegExp.INSIDE_CLASS | XRegExp.OUTSIDE_CLASS
    );

    function Lexer(input, produceUnexpectedTokens) {
        this.input = input || "";
        this.stash = [];
        this.allTokens = [];
        this.lineno = 1;
        this.produceUnexpectedTokens = produceUnexpectedTokens;
    }

    Lexer.prototype = {
        /*
         * Creates a generic token with specific type and value
         */
        tok: function tok(code, type, val) {
            return {
                code: code,
                type: type,
                line: this.lineno,
                val: val
            };
        },
        /*
         * Consumes len characters from the input
         */
        consume: function consume(len) {
            this.input = this.input.substr(len);
        },

        /*
         * Adds token to the stash
         */
        addTokenToStash: function () {
            var token = this.tok('', 'whitespace');

            while (token.type === 'whitespace') {
                token = this.next();

                if (token)
                    this.allTokens.push(token);
            }

            this.stash.push(token);
        },

        /*
         * Peeks n:th token from the input
         */
        peek: function peek(n) {
            var fetch = n - this.stash.length;
            while (fetch-- > 0) this.addTokenToStash();
            return this.stash[--n];
        },
        /*
         * Gets next token from the top of the stash if it exists
         */
        stashed: function stashed() {
            return this.stash.length
                && this.stash.shift();
        },
        /*
         * Returns and removes the next token
         */
        advance: function advance() {
            if (this.stash.length === 0)
                this.addTokenToStash();

            return this.stashed();
        },
        /*
         * Scans input for tokens specified by regex
         */
        scan: function scan(regex, type) {
            var captures;
            if (captures = regex.exec(this.input)) {
                this.consume(captures[0].length);
                return this.tok(captures[0], type, captures[1]);
            }
        },

        /*
         * Parses next token from the input
         */
        next: function next() {
            return null
                || this.eosToken()
                || this.commentToken()
                || this.opToken()
                || this.numberToken()
                || this.stringToken()
                || this.commaToken()
                || this.parenthesisToken()

                // For loops
                || this.forToken()
                || this.toToken()
                || this.stepToken()
                || this.nextToken()

                // Do loops
                || this.doToken()
                || this.loopToken()
                || this.untilToken()
                || this.whileToken()

                // If statements
                || this.ifToken()
                || this.thenToken()
                || this.elseIfToken()
                || this.elseToken()
                || this.endIfToken()

                // Variable declarations
                || this.dimToken()
                || this.asToken()

                // Function declarations
                || this.functionToken()
                || this.returnToken()
                || this.endFunctionToken()

                // Subprogram declarations
                || this.subToken()
                || this.endSubToken()

                // Arrays
                || this.bracketToken()

                // Other, unspecified tokens
                || this.identifierToken()
                || this.newlineToken()
                || this.whitespaceToken()
                || this.fail();
        },

        /*
         * Parses end-of-source token
         */
        eosToken: function eosToken() {
            if (this.input.length)
                return;
            return this.tok('', 'eos');
        },

        /*
         * Parses a comment token from the input
         */
        commentToken: function commentToken() {
            return this.scan(/^'([^\n]*)/, 'comment');
        },

        /*
         * Parses a number from the input
         */
        numberToken: function numberToken() {
            return this.scan(/^(-?\d*\.?\d+)/, 'number')
        },

        /*
         * Parses a string from the input
         */
        stringToken: function stringToken() {
            return this.scan(/^"(.*?)"/, 'string')            // TODO More sophisticated string lexer
        },

        /*
         * Parses an op (ie. =, <, >, +, -, *, /, AND, OR, XOR, MOD) token
         */
        opToken: function opToken() {
            var captures;
            if (captures = /^(<>|<=?|>=?|=|\+|-|\*|\/|\\|\^|&|MOD\b|AND\b|OR\b|XOR\b|NOT\b)/i.exec(this.input)) {
                this.consume(captures[0].length);
                var map = {
                    '<': 'lt',
                    '<=': 'lte',
                    '>': 'gt',
                    '>=': 'gte',
                    '=': 'eq',
                    '<>': 'neq',

                    'and': 'and',
                    'or': 'or',
                    'xor': 'xor',
                    'not': 'not',

                    '+': 'plus',
                    '-': 'minus',
                    '*': 'mul',
                    '/': 'div',
                    '\\': 'idiv',
                    '^': 'pow',
                    'mod': 'mod',
                    '&': 'concat',
                };
                return this.tok(captures[0], map[captures[1].toLowerCase()]);
            }
        },

        /*
         * Parses a comma from the input
         */
        commaToken: function commaToken() {
            return this.scan(/^,/, 'comma');
        },

        /*
         * Parses parenthesis (ie. '(' and  ')') from the input
         */
        parenthesisToken: function parenthesisToken() {
            if (this.input[0] == '(') {
                this.consume(1);
                return this.tok('(', 'lparen');
            } else if (this.input[0] == ')') {
                this.consume(1);
                return this.tok(')', 'rparen');
            }
        },

        /*
         * Parses for token
         */
        forToken: function forToken() {
            return this.scan(/^For\b/i, 'for');
        },

        /*
         * Parses a "TO" token from the input
         */
        toToken: function toToken() {
            return this.scan(/^To\b/i, 'to');
        },

        /*
         * Parses a "STEP" token from the input
         */
        stepToken: function stepToken() {
            return this.scan(/^Step\b/i, 'step');
        },

        /*
         * Parses a "NEXT" token from the input
         */
        nextToken: function nextToken() {
            return this.scan(/^Next\b/i, 'next');
        },

        /*
        * Parses a "DO" token from the input
        */
        doToken: function doToken() {
            return this.scan(/^Do\b/i, 'do');
        },

        /*
        * Parses a "LOOP" token from the input
        */
        loopToken: function loopToken() {
            return this.scan(/^Loop\b/i, 'loop');
        },

        /*
        * Parses a "UNTIL" token from the input
        */
        untilToken: function untilToken() {
            return this.scan(/^Until\b/i, 'until');
        },

        /*
        * Parses a "WHILE" token from the input
        */
        whileToken: function whileToken() {
            return this.scan(/^While\b/i, 'while');
        },

        /*
         * Parses a "IF" token from the input
         */
        ifToken: function ifToken() {
            return this.scan(/^If\b/i, 'if');
        },

        /*
         * Parses a "THEN" token from the input
         */
        thenToken: function thenToken() {
            return this.scan(/^Then\b/i, 'then');
        },

        /*
         * Parses a "ELSEIF" token from the input
         */
        elseIfToken: function elseIfToken() {
            return this.scan(XRegExp('^Else\\h*If\\b', 'i'), 'elseif');
        },

        /*
         * Parses a "ELSE" token from the input
         */
        elseToken: function elseToken() {
            return this.scan(/^Else\b/i, 'else');
        },

        /*
         * Parses a "ENDIF" token from the input
         */
        endIfToken: function endIfToken() {
            return this.scan(XRegExp('^End\\h*If\\b', 'i'), 'endif');
        },

        /*
         * Parses a "DIM" token from the input
         */
        dimToken: function dimToken() {
            return this.scan(/^Dim\b/i, 'dim');
        },

        /*
         * Parses a "AS" token from the input
         */
        asToken: function asToken() {
            return this.scan(/^As\b/i, 'as');
        },

        /*
         * Parses a "FUNCTION" token from the input
         */
        functionToken: function functionToken() {
            return this.scan(/^Function\b/i, 'function');
        },

        /*
         * Parses a "RETURN" token from the input
         */
        returnToken: function returnToken() {
            return this.scan(/^Return\b/i, 'return');
        },

        /*
         * Parses a "END FUNCTION" token from the input
         */
        endFunctionToken: function endFunctionToken() {
            return this.scan(XRegExp('^End\\h*Function\\b', 'i'), 'endfunction');
        },

        /*
         * Parses a "SUB" token from the input
         */
        subToken: function subToken() {
            return this.scan(/^Sub\b/i, 'sub');
        },

        /*
         * Parses a "END SUB" token from the input
         */
        endSubToken: function endSubToken() {
            return this.scan(XRegExp('^End\\h*Sub\\b', 'i'), 'endsub');
        },

        /*
         * Parses brackets ("[" and "]") from the input
         */
        bracketToken: function bracketToken() {
            if (this.input[0] == '[') {
                this.consume(1);
                return this.tok('[', 'lbracket');
            } else if (this.input[0] == ']') {
                this.consume(1);
                return this.tok(']', 'rbracket');
            }
        },

        /*
         * Parses a identifier (ie. variable names) token
         */
        identifierToken: function ideintifierToken() {
            return this.scan(XRegExp('^([_\\p{L}][_\\p{L}\\p{N}]*)'), 'identifier');
        },

        /*
         * Parses a newline from the input
         */
        newlineToken: function newlineToken() {
            var res = this.scan(XRegExp('^\\h*?\\r?\\n'), 'newline');
            if (res) {
                ++this.lineno;
                return res;
            }
        },

        /*
         * Parses whitespace token
         */
        whitespaceToken: function whitespaceToken() {
            return this.scan(XRegExp('^\\h+'), 'whitespace');
        },

        /*
         * Indicates failure in the lexer
         */
        fail: function fail() {
            if (this.produceUnexpectedTokens) {
                return this.scan(/^./i, 'unexpected');
            } else {
                throw new CompileError(this.lineno, 'errors.lexer-unexpexted-text', { text: this.input.substr(0, 10) });
            }
        }
    };

    return Lexer;
});
