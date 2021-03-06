/*
	#	Grit Grammar Extension -- Operator Expression Module

	Parser driven by table of operator precedence and associativity.

	Based on Pratt parser binding powers, and Prolog operator definition concepts.

	References:.  TODO....

*/

;(function(Grit) { // name-space wrapper -- imports and exports at the end of this file...

var Grit = (typeof require !== 'undefined')? require('grit') : this.Grit

var exports = {}

// operators ------------------------------------------------------------------------

// operators`
//    yfx  * /
//    yfx  + -
//    ...etc...
// `;
// Ordered from higher to lower operator precedence.

exports.operators = function (txts) {
	if (txts.length !== 1)
		throw new Error('Bad format: expecting template literal without ${} interpolation..')
	this.operators = specs.parse(txts[0]); // this = grit
}

// specs translates operator precedence and associativity into data structures for
// left and right binding powers: lbp, rbp on prefix, infix, and suffix, operators.
// Note: binding powers used here are inverse of precedence

var specs = Grit`
	specs   := init (blank spec)*         :: result
	spec    := sp fix (sp op)*
	fix     :~ \S+                        :: fix
	op      :~ \S+                        :: op
	blank   :~ (%sp %nl)*
	sp      :~ [ \t]*
	nl      :~ \n | \r \n?
`;
specs.init = function () {
	specs._ops = {
		prefix: {lbp:{}, rbp:{}},
		infix:  {lbp:{}, rbp:{}},
		suffix: {lbp:{}, rbp:{}}
	}
	specs._fix = { bp:0, xfix:'xfx', lbp:0, rbp:0 }
	return true;
}
specs.result = function () {
	specs._ops.max = specs._fix.bp+10;
	return specs._ops;
}
specs.fix = function (x) {
	var fix = specs._fix;
	fix.bp += 10;
	if (x === 'fy') {
		fix.xfix = 'prefix';
		fix.lbp = 0;
		fix.rbp = fix.bp;
	} else if (x === 'yf') {
		fix.xfix = 'suffix';
		fix.lbp = fix.bp;
		fix.rbp = 0;
	} else if (x === 'yfx' || x === 'xfy') {
		fix.xfix = 'infix';
		fix.lbp = fix.rbp = fix.bp;
		if (x === 'yfx') fix.lbp += 1;
		else if (x === 'xfy') fix.rbp += 1;
	} else throw new Error('Invalid op spec: '+x+
		" use: yfx, xfy, fy, yf");
	return x;
}
specs.op = function (op) {
	var affix = specs._fix.xfix;
	var opfix = specs._ops[affix];
	if (opfix.lbp[op]!==undefined)
		throw new Error('Duplicate '+affix+' '+op);
	if ((affix=='infix' && specs._ops.suffix.lbp[op]!==undefined)||
		(affix=='suffix' && specs._ops.infix.lbp[op]!==undefined))
		throw new Error('Confilicting infix & suffix: '+op);
	opfix.lbp[op] = specs._fix.lbp;
	opfix.rbp[op] = specs._fix.rbp;
	return op;
}

// express ------------------------------------------------------------------------

var gop; // module global instance of grit.operators specs for convenience

// parse tree node operator constructor...

const op = (affix, id) => {
	if (id.match(/^[a-zA-Z0-9]+$/)) {
		if (affix==='prefix') id += ' ';
		else if (affix==='suffix') id = ' '+id;
	}
	return ({id, lbp: gop[affix].lbp[id], rbp: gop[affix].rbp[id]})
}

// insert op into tree...

const tree = (x, op, y) =>
	(!x.op || x.op.rbp < op.lbp)? {op, left:x, right:y}
	: {op: x.op, left: x.left, right: tree(x.right,op,y)}

// insert operand or prefix into tree...

const tree_fill = function (tree, arg) {
	if (!tree) return arg; // empty tree
	var t = tree;
	while (t.right && t.right.op) t = t.right;
	if (t.right) throw new Error('tree-fill bad tree..',arg,tree)
	t.right = arg;
	return tree;
}

// action function to translate list of token terms into a parse tree...

exports.expression = function (terms) {
	gop = this.grit.operators; // this = parser
	if (!gop) throw new Error('No operators have been defined...');
	terms = this.flatten(terms); // accept expr := (x/y/..)*
	var ptree = this._express(terms, gop.max);
	if (ptree.op) { ptree.op.rbp = 0; ptree.op.lbp = 0 } // (express) sealed
	return ptree;
}

exports._express = function _express(terms, bp) {
	var ptree = null; // parse tree...
	while (terms.length>0) { // (prefix* operand suffix* infix)*
		var t = terms.shift(); // operand or prefix
		while (gop.prefix.lbp[t]===0) { // prefix*
			t = {op: op('prefix',t), left: '', right: _express(terms, gop.prefix.rbp[t]) };
			t.op.rbp = 0; // (express)
		}
		while (gop.infix.lbp[t]) { // unexpected infix operator...
			if (gop.infix.lbp['¬']) t = terms.shift(t);
			else throw new Error('expecting operand, found infix: '+t)
		}
		ptree = tree_fill(ptree, t);  // ptree=t or fill empty ptree operand...
		t = terms.shift(); // suffix* or infix
		while (gop.suffix.rbp[t]===0) { // suffix*
			ptree = tree(ptree, op('suffix',t), '');
			if (gop.suffix.lbp[t] > bp) return ptree;
			t = terms.shift(); // suffix* or infix
		}
		if (!t) return ptree; // all done..
		if (t === '¬' && terms[0] && gop.infix.lbp[terms[0]]) {
			t = terms.shift(); // skip line-end operator
		}
		if (!gop.infix.lbp[t]) { // missing infix operator...
			if (gop.infix.lbp['·']) { // spacer infix is defined..
				terms.unshift(t);
				t = '.'; // use spacer infix
			} else throw new Error("expecting infix operator, found: "+t)
		}
		if (gop.infix.lbp[t] > bp) { terms.unshift(t); return ptree; }
		ptree = tree(ptree, op('infix',t), '');
	}
	return ptree;
}

// translate parse tree into expression with parentheses...

exports.parens = function p(t) {
	return (!t.op)? t : '('+p(t.left)+t.op.id+p(t.right)+')';
}

// == Export ==============================================================

	if (typeof module !== 'undefined') { // && typeof exports === 'object') {
		module.exports = exports;
	} else if (typeof define === 'function' && define.amd) {
		define(function() { return Grit; });
	} else if (typeof this.Grit !== 'undefined') {
		Grit = this.Grit
		Grit.use(exports)
	} else {
		this.GritExpress = exports;
	}

}).call(function() {
	return this || (typeof window !== 'undefined' ? window : global);
}()); 
