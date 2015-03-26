//==================================================================================================
/* Code Generator information:
 * 	Makes use of a Recursive Descent Tree Walker
 * 		Embedded Heterogeneous Tree Walker pattern
 * 	Generates opcodes for the code store
 * 
 */

//==================================================================================================
/* PROGRAM SETUP 
 * 
 * AST = JSON string representing the program - generated by parser
 * thisSketch = object made by converting AST JSON to actual Object.
 */
 
//const AST = '{"type":"test", "arguments":[{"type":"test", "arguments":[12, 8]}, 7]}';
const AST = '{}';
console.log(AST);

function Sketch (syntaxTree) {
    this.type = "program";
   	this.arguments = JSON.parse(syntaxTree);
}

var treeDepth = 0;

//TODO - scope tree, {symbol, label} table, constant pool

var thisSketch = new Sketch (AST);

var codeStore = [];

//==================================================================================================
/* Now we simply walk the tree */

walk (thisSketch);

//==================================================================================================
/* debug functions */

function depthString() {
	return treeDepth + " ";
}

function branchString(symbol) {
	// symbol must be one character only
	return ("--" + symbol.charAt(0) + "--");
}

function printNode(obj) {
	printToConsole(obj);
	printToDocument(obj);
}

function printToConsole(obj) {

	if (typeof obj == 'undefined')
		console.log(depthString() + "undefined node")
	else if (obj.hasOwnProperty("type"))
		console.log(depthString() + obj.type + " node");
	else
		console.log(depthString() + "leaf node");
	
	if (typeof obj != 'undefined' && obj.hasOwnProperty("arguments"))		// if node not undefined or leaf node
		console.log(depthString() + obj.arguments);
		
	console.log(obj);	
}

function printToDocument(obj) {

	// format is as follows:
	//	[treeDepth] + ({--[appropriate symbol]--} * treeDepth) + [node type] (+ node arguments if present)

	document.write(depthString());
	
	for (var i = 1; i < treeDepth; i++) {
		document.write(branchString("'"));		// symbol = '
	}
	
	if (treeDepth != 0) {
		if (typeof obj == 'undefined' || obj.type == "unknown") {
			document.write(branchString("*"));	// symbol = *
		} else {
			document.write(branchString("|"));	// symbol = |
		}
	}	
	
	if (typeof obj == 'undefined')
		document.write("undefined leaf");
	else if (obj.hasOwnProperty("type"))
		document.write(" " + obj.type);
	else
		
	if (typeof obj != 'undefined' && obj.hasOwnProperty("arguments"))		// if node not undefined or leaf node
		document.write(" - " + obj.arguments);		
	document.write("<br>");
}

//==================================================================================================
/* Misc functions */

function push (opcodes) {

	// opcodes are to be sent to abstract machine, along with refrences to label table and constant pool.
	codeStore.concat(opcodes);
	// abstractMachine.run(codeStore, labelTable, constantPool);	// TODO: get syntax for interacting with abstract machine
}

//==================================================================================================
/* Walkers for all different types of node */

// TESTING PURPOSES ONLY - TODO: remove test node-------------------------------

function walkTest(obj) {
	
	for (arg in arguments) {
		if (typeof arg == "number") {
			console.log(arg);
		} else {
			walk (arg);
		}
	}
}

// program root ----------------------------------------------------------------

function walkProgram(obj) {
	
	var programTree = obj.arguments;
	
	walk (programTree);
	
}

// assignment ------------------------------------------------------------------

function walkAssign (obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x = 2
	 * left = x
	 * right = 2
	 */
	var left = obj.arguments[0];
	var right = obj.arguments[1];
	
	// find left in symbol table/scope tree, warn about undeclared if not there.
	// evaluate (walk) right.
	
}

// declarations (inner and outer) ----------------------------------------------

function walkFunction(obj){
	/* 
	 * example:
	 * 	 Function Foo(int x) -> int{
	 * 		int y = x + 1;
	 * 		return y;
	 * 	 }
	 * declarator = "Foo"
	 * declarationList = ["int", "x"]
	 * returnType = "int"
	 *  functionBody would consist of a decl list and a statement list for what is contained in the body
	 */
 	var declarator = obj.arguments[0];			// name of function
	var declarationList = obj.arguments[1];		// list of parameters
	var returnType = obj.arguments[2];			// return type of function
	var functionBody = obj.arguments[3];		// optional decl/statement_lists
	
	// add function name/return type to symbol table
	// walk list of parameters (which implies adding them to symbol table also)
	// walk body
}

function walkVariableDeclAssign(obj){
	/* 
	 * example:
	 * 	int x = 1
	 * type = int
	 * declarator = x
	 * exp = 1
	 */	 
	var type = obj.arguments[0];
	var declarator = obj.arguments[1];
	var exp = obj.arguments[2];
	
	// walkVariableDecl ([type, declarator])
	// walkAssign ([type, arguments]) ?
}

function walkVariableDecl(obj){
	/* 
	 * example:
	 * 	int x;
	 * type = int
	 * declarator = x
	 */	 
	var type = obj.arguments[0];
	var declarator = obj.arguments[1];		// name of variable
	
	// add varable type/declarator to symbol table
}

// control structures ----------------------------------------------------------

function walkIf(obj){
	/* example:
	 * 	if(x ?= 1) {*do some code"}
	 * expression = x ?=1
	 * statements = *do some code*
	 */
	var expression = obj.arguments[0];
	var statements = obj.arguments[1];
	
	// evaluate expression?
	// walk statements if true
}

function walkIfElse(obj){
	/* example:
	 * 	if(x ?= 1) {*do some code*} else {*do some other code*}
	 * exp = x ?= 1
	 * statements = *do some code*
	 * elseStatements = *do some other code*
	 */
	var exp = obj.arguments[0];
	var statements = obj.arguments[1];
	var elseStatements= obj.arguments[2];
	
	// walkIf ([expression, statements])
	// for statment in statements: walk(Statement)
}

function walkWhile(obj){
	/* example:
	 * 	while(b ?= true){...}
	 * exp = b?= true
	 * body = ...
	 */
	var exp = obj.arguments[0];
	var body = obj.arguments[1];
	
	// evaluate exp to see whether we should walk body
}

function walkDoWhile(obj){
	/* example:
	 * 	Do{...}while(b = true)
	 * exp = b = true
	 * body = ...
	 */
	var exp = obj.arguments[0];
	var body = obj.arguments[1];
	
	// walk body
	// evaluate exp to see whether we should walk body again
}

function walkFor(obj){
	/* example:
	 * 	for (int i = 0; i ?< 5; i++) {...}
	 * decl = int i = 0
	 * condition = i ?< 5
	 * update = i++
	 * body = ...
	 */
	var decl = obj.arguments[0];
	var condition = obj.arguments[1];
	var update = obj.arguments[2];
	var body = obj.arguments[3];
	
	// walk declaration, add stuff to symbol table		// NB: this necessitates a new variable be declared every time, meaning we can't use previously defined ones
	// evaluate condition to see if we should walk body
	// walk body
	// walk update clause and return to beginning.
}

// mathematical operations -----------------------------------------------------

function walkAddition(obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x + y
	 * left = x
	 * right = y
	 */
	var left = obj.arguments[0];
	var right = obj.arguments[1];
	
	// if int, opcodes to push left and right to stack
	// if float, opcodes to push left and right to constant pool
	// other types, not sure what to do here. operator overloading?
	// after things pushed to their appropriate places, send opcodes for addition.
}

function walkMinus(obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x - y
	 * left = x
	 * right = y
	 */
	var left = obj.arguments[0];
	var right = obj.arguments[1];
	
	// if int, opcodes to push left and right to stack
	// if float, opcodes to push left and right to constant pool
	// other types, not sure what to do here. operator overloading?
	// after things pushed to their appropriate places, send opcodes for subtraction.
}

function walkMultiplication(obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x * y
	 * left = x
	 * right = y
	 */
	var left = obj.arguments[0];
	var right = obj.arguments[1];
	
	// if int, opcodes to push left and right to stack
	// if float, opcodes to push left and right to constant pool
	// other types, not sure what to do here. operator overloading?
	// after things pushed to their appropriate places, send opcodes for multiplition.
}

function walkDivision(obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x / y
	 * left = x
	 * right = y
	 */
	var left = obj.arguments[0];
	var right = obj.arguments[1];
	
	// if int, opcodes to push left and right to stack
	// if float, opcodes to push left and right to constant pool
	// other types, not sure what to do here. operator overloading?
	// after things pushed to their appropriate places, send opcodes for division.
}

function walkModulo(obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x % y
	 * left = x
	 * right = y
	 */
	var left = obj.arguments[0];
	var right = obj.arguments[1];
	
	// if int, opcodes to push left and right to stack
	// if float, opcodes to push left and right to constant pool
	// other types, not sure what to do here. operator overloading?
	// after things pushed to their appropriate places, send opcodes for modulo arithetic.
}

// shorthand operations --------------------------------------------------------
// ---assignment - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function walkAddAssign(obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x += y
	 * left = x
	 * right = y
	 */
	var left = obj.arguments[0];
	var right = obj.arguments[1];
	
	// operation x += y expands to x = x + y
	// this means we need to add x and y, then assign result to x
	// so, walkAssign(x, walkAdd(x,y))
}

function walkSubAssign(obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x -= y
	 * left = x
	 * right = y
	 */
	var left = obj.arguments[0];
	var right = obj.arguments[1];
	
	// operation x -= y expands to x = x - y
	// this means we need to subtract y from x, then assign the result to x
	// so, walkAssign(x, walkSubtract(x,y))
}

function walkMultiAssign(obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x * = y
	 * left = x
	 * right = y
	 */
	var left = obj.arguments[0];
	var right = obj.arguments[1];
	
	// operation x *= expands to x = x * y
	// this means we need to multiply x by y, then assign to x
	// so, walkAssign(x, walkMultiply(x,y))
}

function walkDivAssign(obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x /= y
	 * left = x
	 * right = y
	 */
	var left = obj.arguments[0];
	var right = obj.arguments[1];
	
	// operation x /= yexpands to x = x / y
	// this means we need to divide x by y, then assign to x
	// so, walkAssign(x, walkDivide(x,y))
}

function walkModAssign(obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x %= y
	 * left = x
	 * right = y
	 */
	var left = obj.arguments[0];
	var right = obj.arguments[1];
	
	// operation x %= y expands to x = x % y
	// this means we need to get x % y, then assign to x
	// so, walkAssign(x, walkModulo(x+y))
}

// ---increment/decrement	 - - - - - - - - - - - - - - - - - - - - - - - - - -

function walkIncrement(obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x++
	 * name = x
	 */
	var name = obj.arguments[0];
	
	// x++ expands to x = x + 1
	// so, walkAssign(walkAdd(x,1))
}

function walkDecrement (obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x--
	 * name = x
	 */
	var name = obj.arguments[0];
	
	// x-- expands to x = x - 1
	// so, walkAssign(walkSubtract(x,1))
	// or, walkAssign(walkAdd(x,-1))
}

// boolean logic ---------------------------------------------------------------
// TODO: evaluation function for boolean logic

function walkAnd (obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x && 2
	 * left = x
	 * right = 2
	 */
	var left = obj.arguments[0];
	var right = obj.arguments[1];
	
	// TODO: make evaluate function
	// check both evaluate to true.
	// Evaluate(left)
	// Evaluate(right)
}

function walkOr (obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x || 2
	 * left = x
	 * right = 2
	 */
	var left = obj.arguments[0];
	var right = obj.arguments[1];
	
	// check if either evaluates to true.
	// Evaluate(left)
	// Evaluate(right)
}

// comparison operations -------------------------------------------------------

function walkNotEqual (obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	!= 2
	 * left = x
	 * right = 2
	 */
	var left = obj.arguments[0];
	var right = obj.arguments[1];
}

function walkLessThanOrEqual (obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x <= 2
	 * left = x
	 * right = 2
	 */
	var left = obj.arguments[0];
	var right = obj.arguments[1];
}

function walkLessThan (obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x < 2
	 * left = x
	 * right = 2
	 */
	var left = obj.arguments[0];
	var right = obj.arguments[1];
}

function walkLargerThan (obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x > 2
	 * left = x
	 * right = 2
	 */
	var left = obj.arguments[0];
	var right = obj.arguments[1];
}

function walkGreaterThanOrEqual (obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x >= 2
	 * left = x
	 * right = 2
	 */
	var left = obj.arguments[0];
	var right = obj.arguments[1];
}

function walkEquality (obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x ?= 2
	 * left = x
	 * right = 2
	 */
	var left = obj.arguments[0];
	var right = obj.arguments[1];
}

// bitwise operations ----------------------------------------------------------

// TODO check with Darren about bitwise operator opcodes.

function walkBitAND (obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x & 2
	 * left = x
	 * right = 2
	 */
	var left = obj.arguments[0];
	var right = obj.arguments[1];
}

function walkZeroFillRightShift (obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x >>> 2
	 * left = x
	 * right = 2
	 */
	var left = obj.arguments[0];
	var right = obj.arguments[1];
}

function walkBitOR (obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x | 2
	 * left = x
	 * right = 2
	 */
	var left = obj.arguments[0];
	var right = obj.arguments[1];
}
function walkBitRightShift (obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x >> 2
	 * left = x
	 * right = 2
	 */
	var left = obj.arguments[0];
	var right = obj.arguments[1];
}

function walkBitLeftShift (obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x << 2
	 * left = x
	 * right = 2
	 */
	var left = obj.arguments[0];
	var right = obj.arguments[1];
}

function walkbitXOR (obj){
	/* assigns variables to both sides of statement
	 * example:
	 * 	x ^ 2
	 * left = x
	 * right = 2
	 */
	var left = obj.arguments[0];
	var right = obj.arguments[1];
}

// undefined -- usually an empty node, e.g. a blank program.
function walkUndefined() {
	printNode()
}

// default - this means that something unexpected has got into the tree. ------------
function walkUnknown(obj) {

	unknown = new Object();
	unknown.type = "unknown";
	unknown.arguments = "(" + obj.toString() + ")";
	
	console.log("Unwalkable node")
	printNode(unknown);
}


//==================================================================================================
// case statement corresponds with each of the structures in the BNF.
//  (this could just as easily be implemented as a big if/else block)
function walk(obj) {

  /* preorder */
	printNode(obj);

	treeDepth += 1;

  /* inorder */	
	switch(obj.type){

	// TESTING PURPOSES ONLY - TODO: remove test node
		case "test":
			walkTest(obj);
			break
	// program root
		case "program":
			walkProgram(obj);
			break;
	// assignment
		case "assign":
			walkAssign(obj);
			break;
	// declarations (inner and outer)
		case "function":
			walkFunction(obj);
			break;
		case "variable-decl-assign":		// TODO: ensure consistency - multiword nodes: underscores or hyphens?
			walkVariableDeclAssign(obj);
			break;
		case "variable-decl":
			walkVariableDecl(obj);
			break;
	// control structures
		case "if":
			walkIf(obj);
			break;
		case "ifelse":			// TODO: ensure consistency - multiword nodes: underscores or hyphens?
			walkIfElse(obj);
			break;
		case "while":
			walkWhile(obj);
			break;
		case "do_while":		// TODO: ensure consistency - multiword nodes: underscores or hyphens?
			walkDoWhile(obj);
			break;
		case "for":
			walkFor(obj);
			break;
	// mathematical operations
		case "addition":
			walkAddition(obj);
			break;
		case "minus":
			walkMinus(obj);
			break;
		case "multiplication":
			walkMultiplication(obj);
			break;
		case "division":
			walkDivision(obj);
			break
		case "modulo":
			walkModulo(obj);
			break;
	// shorthand operations		// TODO: ensure consistency - multiword nodes: underscores or hyphens?
	// 	--assignment
		case "add_assign":
			walkAddAssign(obj);
			break;
		case "sub_assign":
			walkSubAssign(obj);
			break;
		case "multi_assign":
			walkMultiAssign(obj);
			break;
		case "div_assign":
			walkDivAssign(obj);
			break;
		case "mod_assign":
			walkModAssign(obj);
			break;
	// 	--increment/decrement
		case "increment":
			walkIncrement(obj);
			break;
		case "decrement":
			walkDecrement(obj);
			break;
	// boolean logic
		case "and":
			walkAnd(obj);
			break;
		case "or":
			walkOr(obj);
			break;
	// comparison operations		// TODO: ensure consistency - multiword nodes: underscores or hyphens?
		case "equality":
			walkEquality(obj);
			break
		case "less-than":
			walkLessThan(obj);
			break;
		case "larger-than":		// TODO : consistency - larger than OR greater than, not both.
			walkLargerThan(obj);
			break;
		case "not-equal":
			walkNotEqual(obj);
			break;
		case "less-than-or-equal":
			walkLessThanOrEqual(obj);
			break;
		case "greater-than-or-equal":
			walkGreaterThanOrEqual(obj);
			break;	
	// bitwise operations		// TODO: ensure consistency - multiword nodes: underscores or hyphens?
		case "bit-XOR":
			walkBitXOR(obj);
			break;
		case "bit-AND":
			walkBitAND(obj);
			break;
		case "bit-OR":
			walkBitOR(obj);
			break;
		case "bit-right-shift":
			walkBitRightShift(obj);
			break;
		case "bit-left-shift":
			walkBitLeftShift(obj);
			break;
		case "zero-fill-right-shift":
			walkZeroFillRightShift(obj);
			break;
	// undefined -- usually an empty node, e.g. a blank program.
		case undefined:
			walkUndefined();
			break;
	// default - this means that something unexpected has got into the tree.
		default :
			walkUnknown(obj);
			break;
	}

  /* postorder */
	treeDepth -= 1;
	
	printNode(obj);
	
}
