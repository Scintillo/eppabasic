define(['./parseError', 'compiler/frontend/lexer/tokens'], function (parseError, tokens) {
    "use strict";

    var ParseError = parseError.ParseError;

    /**
     * Astract base class for all nodes
     * 
     * @class
     * @abstract
     * @private
     * @memberOf module:compiler/frontend/parser
     */
    function Node() {
        this.childNodes = [];
    }

    /**
     * Set of first tokens the node can begin with
     * 
     * @type {Set<module:compiler/frontend/lexer/tokens.Token>}
     * @memberOf module:compiler/frontend/parser.Node
     */
    Node.prototype.first = new Set();
    /**
     * Something else
     */
    Node.prototype.canBeEmpty = false;

    /**
     * Consumes one or more tokens from the tokens and creates a new node
     * Moves something from somewhere to somewhere
     * 
     * TODO Expand explanation
     * @abstract
     * @memberOf module:compiler/frontend/parser.Node
     */
    Node.prototype.doMove = function doMove(tokens) {
        throw new Error("Must be implemented");
    }

    /**
     * Creates a new TerminalNode class
     * 
     * @param {Class<module:compiler/frontend/lexer/tokens.Token>} token - Class of token to expand 
     * @returns {Class<module:compiler/frontend/parser.Node>} Constructor for a new terminal node
     * 
     * @private
     * @static
     * @memberOf module:compiler/frontend/parser
     */
    function makeTerminalNode(token) {
        // Create a new TerminalNode class extended from Node
        function TerminalNode() {
            Node.call(this);
        }
        Object.setPrototypeOf(TerminalNode, Node);
        TerminalNode.prototype = Object.create(Node.prototype, { constructor: { value: TerminalNode } });

        // Create set of first tokens
        TerminalNode.prototype.first = new Set();
        TerminalNode.prototype.first.add(token);

        // Replace the doMove-function
        TerminalNode.prototype.doMove = function doMove(tokens) {
            // Check that the first token in the list is right type
            if (tokens[0] instanceof token) {
                this.token = tokens.shift();
            } else {
                // If not, throw an error
                throw new ParseError();
            }
        }

        return TerminalNode;
    }

    /**
     * Combines the first sets of the alternative nodes
     * 
     * @param {Array<module:compiler/frontend/parser.Node>} alternatives - Alternatives whose first sets to combine
     * @returns {Set<module:compiler/frontend/lexer/tokens.Token>} Combined first set
     * 
     * @private
     * @static
     * @memberOf module:compiler/frontend/parser
     */
    function combineFirstSets() { }
    function getAlternativeFirst(alternative) {
        // Create the return set
        var first = new Set();

        // Go through alternatives
        alternative.forEach(function (alternative) {
            // Copy every element to the result
            alternative.first.forEach(function (token) {
                first.add(token);
            });
        });

        // TODO: ORIGINAL
        for (var i = 0; i < alternative.length; i++) {
            for (var f in alternative[i].first) {
                first[f] = true;
            }

            if (!alternative[i].canBeEmpty)
                break;
        }

        return first;
    }

    function getAlternativeFirsts(alternatives) {
        return alternatives.map(getAlternativeFirst);
    }

    function addSetToSet(from, to) {
        for (var f in from) {
            to[f] = true;
        }
    }

    function addSetsToSet(sets, set) {
        for (var i = 0; i < sets.length; i++) {
            addSetToSet(sets[i], set);
        }
    }

    /**
     * Creates a new GeneralNode class
     * 
     * General nodes combine multiple node type lists to one node type
     * 
     * @param {Array<Array<Class<module:compiler/frontend/parser.Node>>>} alternatives - Array of node combinations
     * @returns {Class<module:compiler/frontend/parser.Node>} Constructor for a new general node
     * 
     * @private
     * @static
     * @memberOf module:compiler/frontend/parser
     */
    function makeGeneralNode(alternatives) {
        // Create a new GeneralNode class extended from Node
        function GeneralNode() {
            Token.call(this);
        }
        Object.setPrototypeOf(GeneralNode, Node);
        GeneralNode.prototype = Object.create(Node.prototype, { constructor: { value: GeneralNode } });

        // Combine alternative first sets
        var alternativeFirsts = getAlternativeFirsts(alternatives);
        // TODO: Append alternative first set with general nodes empty first set?!
        addSetsToSet(alternativeFirsts, GeneralNode.prototype.first);

        for (var i = 0; i < alternatives.length; i++) {
            var canAlternativeBeEmpty = true;

            for (var j = 0; j < alternatives[i].length; j++) {
                if (!alternatives[i][j].canBeEmpty) {
                    canAlternativeBeEmpty = false;
                    break;
                }
            }

            if (canAlternativeBeEmpty) {
                GeneralNode.prototype.canBeEmpty = true;
                break;
            }
        }

        // Replace the doMove-function
        GeneralNode.prototype.doMove = function doMove(tokens) {
            // Go through all alternatives
            for (var i = 0; i < alternatives.length; i++) {
                for (var f in alternativeFirsts[i]) {
                    if (tokens[0] instanceof f) {
                        for (var j = 0; j < alternatives[i].length; j++) {
                            this.childNodes.push(new alternatives[i][j]);
                        }

                        return this.childNodes;
                    }
                }
            }

            if (this.canBeEmpty) {
                return this.childNodes;
            }

            throw new ParseError();
        }

        return GeneralNode;
    }

    function makeNodeWithRepeat(alternatives, repeatAlternatives) {
        GeneralNode = makeGeneralNode(alternatives);

        function RepeatNode() {
            GeneralNode.call(this);
        }

        function PossibleRepeatNode(parent) {
            GeneralNode.call(this);

            this.parent = parent;
        }

        RepeatNode.prototype = Object.create(GeneralNode.prototype);
        PossibleRepeatNode.prototype = Object.create(GeneralNode.prototype);

        var repeatAlternativeFirsts = getAlternativeFirsts(repeatAlternatives);

        if (GeneralNode.prototype.canBeEmpty) {
            addSetsToSet(repeatAlternativeFirsts, RepeatNode.prototype.first);
        }

        addSetsToSet(repeatAlternativeFirsts, PossibleRepeatNode.prototype.first);

        RepeatNode.prototype.doMove = function doMove(tokens) {
            return GeneralNode.prototype.doMove.call(this, tokens).concat([new PossibleRepeatNode(this)]);
        }

        PossibleRepeatNode.prototype.doMove = function doMove(tokens) {
            for (var i = 0; i < repeatAlternatives.length; i++) {
                for (var f in repeatAlternativeFirsts[i]) {
                    if (tokens[0] instanceof f) {
                        var child = new RepeatNode();
                        child.childNodes = this.parent.childNodes;
                        this.parent.childNodes = [child];

                        for (var j = 0; j < repeatAlternatives[i].length; j++) {
                            this.parent.childNodes.push(new repeatAlternatives[i][j]);
                        }

                        return this.parent.childNodes.slice(1);
                    }
                }
            }

            return [];
        }

        return RepeatNode;
    }

    function makeDummyNode(first, canBeEmpty) {
        function DummyNode() {

        }

        DummyNode.prototype.first = first;
        DummyNode.prototype.canBeEmpty = canBeEmpty;

        return DummyNode;
    }



    // --- BNF ---
    var NumberNode = makeTerminalNode(tokens.NumberToken);
    var StringNode = makeTerminalNode(tokens.StringToken);
    var IdentifierNode = makeTerminalNode(tokens.IdentifierToken);
    var LeftBracketNode = makeTerminalNode(tokens.LeftBracketToken);
    var RightBracketNode = makeTerminalNode(tokens.RightBracketToken);
    var LeftParenthesisNode = makeTerminalNode(tokens.LeftParenthesisToken);
    var RightParenthesisNode = makeTerminalNode(tokens.RightParenthesisToken);
    var CommaNode = makeTerminalNode(tokens.CommaToken);
    var NotNode = makeTerminalNode(tokens.NotToken);
    var PowNode = makeTerminalNode(tokens.PowToken);
    var MultiplicationNode = makeTerminalNode(tokens.MultiplicationToken);
    var DivisionNode = makeTerminalNode(tokens.DivisionToken);
    var IntegerDivisionNode = makeTerminalNode(tokens.IntegerDivisionToken);
    var ModNode = makeTerminalNode(tokens.ModToken);
    var PlusNode = makeTerminalNode(tokens.PlusToken);
    var MinusNode = makeTerminalNode(tokens.MinusToken);
    var EqualNode = makeTerminalNode(tokens.EqualToken);
    var NotEqualNode = makeTerminalNode(tokens.NotEqualToken);
    var LessThanNode = makeTerminalNode(tokens.LessThanToken);
    var LessThanOrEqualNode = makeTerminalNode(tokens.LessThanOrEqualToken);
    var GreaterThanNode = makeTerminalNode(tokens.GreaterThanToken);
    var GreaterThanOrEqualNode = makeTerminalNode(tokens.GreaterThanOrEqualToken);


    var ExpressionNode = makeDummyNode([tokens.LeftParenthesisToken, tokens.NotToken, tokens.NumberToken, tokens.StringToken, tokens.IdentifierToken, tokens.minusToken], false);
    var Expression7Node = makeDummyNode([tokens.LeftParenthesisToken, tokens.NotToken, tokens.NumberToken, tokens.StringToken, tokens.IdentifierToken, tokens.minusToken], false);
    var TypeNode = makeDummyNode([tokens.IdentifierToken, tokens.LeftParenthesisToken], false);

    var ConstantNode = makeGeneralNode([
        [NumberNode],
        [StringNode]
    ]);

    var VariableReferenceNode = makeNodeWithRepeat(
        [
            [IdentifierNode]
        ],
        [
            [LeftBracketNode, NumberNode, RightBracketNode]
        ]
    );

    var NonEmptyParameterList = makeNodeWithRepeat(
        [
            [ExpressionNode]
        ],
        [
            [CommaNode, ExpressionNode]
        ]
    );

    var ParameterListNode = makeGeneralNode([
        [NonEmptyParameterList],
        []
    ]);

    var FunctionCallNode = makeGeneralNode([
        [VariableReferenceNode, LeftParenthesisNode, ParameterListNode, RightParenthesisNode]
    ]);

    Expression7Node.prototype = makeGeneralNode([
        [LeftParenthesisNode, ExpressionNode, RightParenthesisNode],
        [NotNode, Expression7Node],
        [MinusNode, Expression7Node],
        [ConstantNode],
        [FunctionCallNode],
        [IdentifierNode]
    ]).prototype;

    var Expression6Node = makeNodeWithRepeat(
        [
            [Expression7Node]
        ],
        [
            [PowNode, Expression7Node]
        ]
    );

    var Expression5Node = makeNodeWithRepeat(
        [
            [Expression6Node]
        ],
        [
            [MultiplicationNode, Expression6Node],
            [DivisionNode, Expression6Node],
            [IntegerDivisionNode, Expression6Node],
            [ModNode, Expression6Node]
        ]
    );

    var Expression4Node = makeNodeWithRepeat(
        [
            [Expression5Node]
        ],
        [
            [PlusNode, Expression5Node],
            [MinusNode, Expression5Node]
        ]
    );

    var Expression3Node = makeNodeWithRepeat(
        [
            [Expression4Node]
        ],
        [
            [ConcatNode, Expression4Node]
        ]
    );

    var Expression2Node = makeNodeWithRepeat(
        [
            [Expression3Node]
        ],
        [
            [EqualNode, Expression3Node],
            [NotEqualNode, Expression3Node],
            [LessThanNode, Expression3Node],
            [LessThanOrEqualNode, Expression3Node],
            [GreaterThanNode, Expression3Node],
            [GreaterThanEqualNode, Expression3Node]
        ]
    );

    var Expression1Node = makeNodeWithRepeat(
        [
            [Expression2Node]
        ],
        [
            [OrNode, Expression2Node],
            [AndNode, Expression2Node],
            [XorNode, Expression2Node]
        ]
    );

    ExpressionNode.prototype = makeGeneralNode([[Expression1Node]]).prototype;

    var NonEmptyTypeListNode = makeNodeWithRepeat(
        [
            [TypeNode]
        ],
        [
            [CommaNode, TypeNode]
        ]
    );

    var TypeListNode = makeGeneralNode([
        [NonEmptyTypeListNode],
        []
    ]);

    var TypeNode = makeNodeWithRepeat(
        [
            [IdentifierNode],
            [LeftParenthesisNode, TypeListNode, RightParenthesisNode]
        ],
        [
            [LeftBracketNode, NumberNode, RightBracketNode],
            [LeftParenthesisNode, TypeListNode, RightParenthesisNode]
        ]
    );

    var TypeSpecifierNode = makeGeneralNode([
        [AsNode, TypeNode]
    ]);

    var InitializerNode = makeGeneralNode([
        [EqualNode, ExpressionNode]
    ]);

    var VariableDefinitionNode;
    var VariableAssignmentNode;
    var BaseFunctionCallNode;
    var ReturnStatementNode;

    // TODO: more
    var StatementNode = makeGeneralNode([
        [ FunctionCallNode ]
    ]);

    // TODO: more
    var BlockStatementNode = makeGeneralNode([
        [ StatementNode ]
    ]);

    var BlockNode = makeNodeWithRepeat(
        [
            [ BlockStatementNode ]
        ],
        [
            []
        ]
    );

    // TODO: more
    var BaseLevelStatement = makeGeneralNode([
        [ BlockStatementNode ]
    ]);

    var BaseLevelBlockNode = makeNodeWithRepeat(
        [
            [ BlockStatementNode ]
        ],
        [
            []
        ]
    );

    return {
        BaseLevelBlockNode: BaseLevelBlockNode
    };
});