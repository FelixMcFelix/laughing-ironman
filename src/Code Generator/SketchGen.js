/* global MVM */
/*jshint sub: true */
var Sketch = Sketch || {};

/**
 * @classdesc Creates an instance of the SketchGen module. SketchGen takes a JSON tree output by the default Jison generated parser and outputs MVM bytecode used to drive computations and canvas operations.
 * @class Sketch.SketchGen
 * @public
 * @author FelixMcFelix (Kyle S.)
 */

Sketch.SketchGen = function(){
	var outBuffer = [];
	var programCounter = 0;
	var scopeStack = [];
	var stackPtr = 0;
	var functionStack = [];

	var DEBUG = true;

	var instructions = Sketch.bindInstructions(this);

	/**
	 * Write a value to the next available code word.
	 * @method Sketch.SketchGen#emit
	 * @param {*} code - the code word or data value to be written into the next slot.
	 * @returns {number} - the address which was just written to.
	 * @public
	 */
	this.emit = function(code){
		outBuffer.push(code);
		return programCounter++;
	};

	/**
	 * Replace a code value at a given address.
	 * @method Sketch.SketchGen#patch
	 * @param {number} addr - the code address to be replaced.
	 * @param {*} code - the value to write to the code store.
	 * @returns void
	 * @public
	 */
	this.patch = function(addr, code){
		outBuffer[addr] = code;
	};

	/**
	 * Return the current program counter value.
	 * @method Sketch.SketchGen#pc
	 * @returns {number} - the current program counter value.
	 * @public
	 */
	this.pc = function(){
		return programCounter;
	};

	/**
	 * Interpret an AST node using the current code generator.
	 * @method Sketch.SketchGen#interpretNode
	 * @param {{type: number, arguments: *}} node - the AST node to be processed in the production of the current code store.
	 * @param {*} opt - an optional parameter to be passed to the individual node handler function.
	 * @returns {{type: string}}
	 * @public
	 */
	this.interpretNode = function(node, opt){
		if(Array.isArray(node)){
			node.forEach(this.interpretNode.bind(this));
		} else if(node === ""){
			return;
		} else{
			if(DEBUG){
				console.log("{\n"+Sketch.SketchGenNodes._rev[node.type]+",");
				console.log(node.arguments);
				console.log("}");
			}
			return instructions[node.type](node.arguments, opt);
		}
	};

	/**
	 * Push a new program scope frame.
	 * @method Sketch.SketchGen#scopePush
	 * @param {boolean} [noEmit=false] - specifies whether push and pop commands should not be written to the program as a side effect. This should be true for function definitions.
	 * @returns void
	 * @public
	 */
	this.scopePush = function(noEmit){
		scopeStack.push(new Sketch.SketchGen.ScopeStackFrame());
		stackPtr++;
		if(noEmit){
			return;
		}
		this.emit(MVM.opCodes.PUSHSC);
	};

	/**
	 * Pop off the current program scope frame.
	 * @method Sketch.SketchGen#scopePop
	 * @param {boolean} [noEmit=false] - specifies whether push and pop commands should not be written to the program as a side effect. This should be true for function definitions.
	 * @returns void
	 * @public
	 */
	this.scopePop = function(noEmit){
		scopeStack.pop();
		stackPtr--;
		if(noEmit){
			return;
		}
		this.emit(MVM.opCodes.POPSC);

		// TODO: Patch missed function calls (equivalent to hoisting).
		// TODO: Handle missed variable lookups in a different manner.
	};

	/**
	 * Register a label in the current scope frame.
	 * @method Sketch.SketchGen#scopeRegister
	 * @param {string} label - the variable name to register.
	 * @param {string} type - the data type that the variable will be declared with.
	 * @param {object=} extra - any extra data that could be required when handling this label (for example, function definitions).
	 * @returns void
	 * @public
	 */
	this.scopeRegister = function(label, type, extra){
		var curFrame = scopeStack[stackPtr];

		if (!curFrame.labelTable[label]){
			var destAddr = (type === "function") ? programCounter : curFrame.nextData++;
			curFrame.labelTable[label] = new Sketch.SketchGen.Label(destAddr, type, extra);
		} else {
			throw "Illegal attempt to redefine variable "+label+".";
		}
	};

	/**
	 * Search for a reference to a label (a variable) within the program scope.
	 * @method Sketch.SketchGen#scopeLookup
	 * @param {string} label - the variable name to lookup.
	 * @returns {{entry: Sketch.SketchGen.Label, stack: number}} - an object detailing the height of the referenced label, its address and its type as well as any extra data.
	 * @public
	 */

	this.scopeLookup = function(label){
		var stack = 0;
		var out = null;

		for(null; stackPtr-stack>=0; stack++){
			var frame = scopeStack[stackPtr-stack];
			var entry = frame.labelTable[label];
			if (entry){
				out = {entry: entry, stack: stack};
				break;
			}
		}

		if (out === null){
			throw "BAD LOOKUP.";
		}

		return out;
	};

	/**
	 * Compile a Sketch program.
	 * @method Sketch.SketchGen#interpret
	 * @param {Object} program - an AST object generated by the Jison parser.
	 * @returns number[] - an array of opcodes and literals to be parsed by MVM.
	 * @public
	 */
	this.interpret = function(program){
		this.cleanState();

		this.interpretNode({type: Sketch.SketchGenNodes["program"], arguments: program});

		var iaddr = null, raddr = null;

		try{
			var t = this.scopeLookup("init");
			if(t.entry.type === "function"){
				iaddr = t.entry.address;
			}
		} catch(e){}
		try{
			var d = this.scopeLookup("render");
			if(d.entry.type === "function"){
				raddr = d.entry.address;
			}
		} catch(e){}

		return {code: outBuffer, initAddr: iaddr, renderAddr: raddr};
	};

	/**
	 * Reset the internal object state to allow onject reuse when compiling a new program.
	 * @method Sketch.SketchGen#cleanSlate
	 * @returns void
	 * @public
	 */
	this.cleanState = function(){
		outBuffer = [];
		programCounter = 0;
		scopeStack = [];
		scopeStack.push(new Sketch.SketchGen.ScopeStackFrame());
		stackPtr = 0;
		functionStack = [];
	};

	/**
	 * Tell the generator that we are beginning a function definition, so that we can ensure that returns have the right type.
	 * @method Sketch.SketchGen#beginFunction
	 * @param {string} type - the return type of the function we are working on.
	 * @returns void
	 * @public
	 */
	this.beginFunction = function(type){
		functionStack.push(type);
	};

	/**
	 * Tell the generator that we are ending a function definition.
	 * @method Sketch.SketchGen#endFunction
	 * @returns void
	 * @public
	 */
	this.endFunction = function(){
		functionStack.pop();
	};

	/**
	 * Request the type of the current function definition.
	 * @method Sketch.SketchGen#currentFunctionType
	 * @returns {string}
	 * @public
	 */
	this.currentFunctionType = function(){
		if(functionStack.length === 0){
			throw "Not currently defining a function, can't find its type!"
		}
		return functionStack[functionStack.length-1];
	};
}

/**
 * @classdesc Simple semantic class for use in the {@link Sketch.SketchGen} scope stack.
 * @class Sketch.SketchGen.ScopeStackFrame
 * @public
 * @author FelixMcFelix (Kyle S.)
 */
Sketch.SketchGen.ScopeStackFrame = function(){
	this.labelTable = {};
	this.nextData = 0;
};

/**
 * @classdesc Simple semantic class for use in the {@link Sketch.SketchGen.ScopeStackFrame} label table.
 * @class Sketch.SketchGen.Label
 * @public
 * @param {Number} addr - the address the label references within its data frame.
 * @param {String} type - the type of the variable represented by the label.
 * @param {Object} [extra] - any extra data (function parameters etc.) that must be known about the label.
 * @author FelixMcFelix (Kyle S.)
 */
Sketch.SketchGen.Label = function(addr, type, extra){
	this.address = addr;
	this.type = type;
	if(extra){
		this.extra = extra;
	}
};