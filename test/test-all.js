/*
	This test.js runs a regression test using a pile of examples.

	The test examples use console.log to record results.

	The results must be checked manually, there are no special test jigs.

	./test runs: node test.js > test.results, and compares that to: test.verify

	If the results are identical then the regression test is successful. If there and differences then these differences will show what has failed. This may be a false alarm if some superficial detail has changed the output (modified error messages for example). But this has not been a problem in practice.

	The examples in this test.js file have been accumulated over time. For new fetures or to fix bugs there is expected to be a new test example.js, and after this is working acceptably (by verifying it's console.log output) then the new example.js can be added into the pile of examples in this test.js to improve the regression testing.

	run: node test.js > test.verify -- to update the regression test.verify file as required.

*/

var Grit = require("../grit.js"); // .. to run in test/ of grit.js

// examples ...................................

var mdy1 = new Grit(
	"mdy :~ (%d %d?) / (%d %d?) / (%d %d %d %d) ",
	" d :~ \\d "
);

var date = mdy1.parse("2/3/2015");
console.log("date =>",date);

console.log("-- date2 ----------------");

var mdy2 = new Grit(
	"mdy   := month '/' day '/' year ",
	"month :~ \\d \\d? ",
	"day   :~ \\d \\d? ",
	"year  :~ \\d{4} "
);

var date = mdy2.parse("3/4/2015");
console.log(date);
console.log(mdy2.show(date));

console.log("-- sum show ----------------");

var sum1 = new Grit(
	"sum := num ('+' num)* ",
	"num :~ \\d+ "
);

var s1 = sum1.parse("1+2+3"); //,true);
console.log(sum1.show(s1));
console.log(s1);

// var sum = new Grit(
// 	"sum  := num plus* ",
// 	"plus :~ (%add) (%num)",
// 	"num  :~ \\d+ ",
// 	"add  :~ [+-] "
// );
//
// var s := sum.parse("1+2+3"); //,true);
// console.log(sum.show(s));

var sum = new Grit(
	"sum  := num plus*",
	"plus :~ (%add) (%num)",
	"num  :~ \\d+ ",
	"add  :~ [+-] "
);

var s = sum.parse("1+2+3"); //,true);
console.log(sum.show(s));
console.log(s);

console.log("-- & ! abba ----------------");

var andnot = new Grit(
	"abba := &ab ab !'ab' ba !('abba'/'x') ",
	"ab :~ ab ",
	"ba :~ ba "
);

var abba = andnot.parse("abba",true);
console.log(andnot.show(abba));


console.log("-- paren ----------------");

var paren = new Grit(
	"par := '(' (txt par?)* ')' ",
	"txt :~ [^()]* "
);

var p = paren.parse("(x(y)z)");
console.log(paren.show(p));

// console.log("-- define rules ----------------");
// 
// var defs = Grit("sum  := num plus*");
// 
// defs.define`
// 	plus :~ (%add) (%num)
// 	num  :~ \d+
// 	add  :~ [+-]
// `;
// 
// var ds = defs.parse("1+2-3+4");
// console.log(ds);

console.log("-- arith exp ----------------");

var exp = new Grit(
	"exp  := sum (aop sum)* ",
	"sum  := term (mop term)* ",
	"term := num / '(' exp ')' ",
	"aop  :~ [-+] ",
	"mop  :~ [*/] ",
	"num  :~ \\d+ "
);

var tree = exp.parse("1+2*3");
console.log(exp.show(tree));
console.log(tree);

console.log("-- eval arith exp ----------------");

var test = "1+2+3+4"; //"3*(2+1)";
var tree = exp.parse(test);
console.log(exp.show(tree));

var arith = function(tree) {
	if (!tree) {
		return null;
	}
	if (tree.rule === "num") {
		return Number(tree[0]); // ["123", rule:"num"]
	} else if (tree.rule === "exp" || tree.rule === "sum") {
		return reduce(tree); // sum (aop sum)*
	} else if (tree.rule === 'term' ) { // num / '(' exp ')'
		if (tree[0].rule === 'num') return arith(tree[0]);
		return arith(tree[1]); // exp
	} else if (tree.rule === "aop" || tree.rule === "mop") {
		return tree[0];
	} else {
		console.log("unknown rule:",tree.rule)
	}
}

// exp := x (op y)*
var reduce = function(exp) { // [x, [[op, y], ...]]
	var x = arith(exp[0]);
	var terms = exp[1];
	for (var i=0; i<terms.length; i+=1) { // [op y]
		var t = terms[i];
		var op = arith(t[0]);
		var y = arith(t[1]);
		if      (op === '+') { x += y; }
		else if (op === '-') { x -= y; }
		else if (op === '*') { x *= y; }
		else if (op === '/') { x /= y; }
		else console.log("undefined op:",op);
	}
	return x;
}

console.log(test, arith(tree));


console.log("-- (a+/b*)* ----------------");

var ab = new Grit(
	"ab := (a / b)* ",
	"a :~ [a]+ ",
	"b :~ [b]* "
);

var s = ab.parse("abba");
console.log(ab.show(s));

console.log("-- prose Markdown notations ----------------");

var prose = new Grit(
	"prose   := (text / code / strong / em / elem)* ",
	"code    :~ (`+)\\s*([\\s\\S]*?[^`])\\s*\\1(?!`) ", // md `code`
	"strong  :~ __([\\s\\S]+?)__(?!_)|^\\*\\*([\\s\\S]+?)\\*\\*(?!\\*)  ", // md **strong**
	"em      :~ \\b_((?:__|[\\s\\S])+?)_\\b|^\\*((?:\\*\\*|[\\s\\S])+?)\\*(?!\\*) ", // md *emph*
	"text    :~ [^`_*#@!%^]+ ",
	"elem    :~ ([_*#@!%^]*) (\\w*) "
);

var s = prose.parse("this *or* that, `and the` other thing.");
console.log(prose.show(s));
var s = prose.parse("this _or that, __and__ the_ other thing.");
console.log(prose.show(s));

var prose = new Grit(
	"prose   := (text / elem)* ",
	"elem    :~ %code|%strong|%em|%sigil ",
	"code    :~ (`+)\\s*([\\s\\S]*?[^`])\\s*\\1(?!`) ", // md `code`
	"strong  :~ __([\\s\\S]+?)__(?!_)|^\\*\\*([\\s\\S]+?)\\*\\*(?!\\*)  ", // md **strong**
	"em      :~ \\b_((?:__|[\\s\\S])+?)_\\b|^\\*((?:\\*\\*|[\\s\\S])+?)\\*(?!\\*) ", // md *emph*
	"sigil   :~ ([`_*#@!%^]*) (\\w*) ",
	"text    :~ [^`_*#@!%^]+ "
);

var s = prose.parse("this *or* that, `and the` other thing.");
console.log(prose.show(s));
var s = prose.parse("this _or that, __and__ the_ other thing.");
console.log(prose.show(s));

var doc = new Grit(
	"doc     := chunk* ",
	"chunk   :~ %blank* %block",
	"blank   :~ (?:[ \\t]* %nl)",
	"block   :~ (%text) (?:%nl? (%content))? %nl?",
	"content :~ \\t %line (?:%nl \\t %line)*",
	"text    :~ [^\\t\\n\\r]*",
	"line    :~ [^\\n\\r]*",
	"ws      :~ [ \\t]*",
	"nl      :~ (?:\\r \\n? | \\n)"
);

var blks = doc.parse("\n##\tHello World\n\nSomething or other...\nbook\n\ttitle\tGood Cooking\n\tisbn\t123456789\nLast line..");
console.log("doc=>",doc.show(blks));


console.log("-- foil firstword blocks with semantic actions----------------");

var foil = Grit(
	"foil    := init chunk* ",
	"chunk   :~ (?: (%blank) | (%defn) | (%verse) ) :: chunk ",
	"blank   :~ (?: [ \\t]* %nl)+ ",
	"defn    :~ [ ]{0,3} & %line ",
	"verse   :~ (?:%label) (%content)  ",
	"label   :~ ([ ]{0,3}) (\\S*) ([ \\t]* %nl %inset)? [ \\t]* ",
	"content :~ %line (?: %nl+ %inset %line)* %nl? ",
	"line    :~ [^\\n\\r]*",
	"inset   :~ (?: [ \\t]+) ",
	"nl      :~ (?:\\r \\n? | \\n)",
	"init    :: () => { this.defns={}; return ({blank:''}); } "
);

var BLANK = 1, DEFN = 2, VERSE = 3, MARGIN=4, LABEL = 5, INDENT = 6, CONTENT = 7; // parser tree node fields

foil.defns = {};

foil.chunk = function(_, blank, defn, verse, margin, label, indent, content) {
	if (blank) return { blank:blank };
	if (defn) { //chunk[DEFN]) {
		var defln = defn.match(/^\s*&(\S*)\s*(.*)/); // chunk[DEFN]
		var key = defln[1];
		if (foil.defns[key]) {
			console.log('multiple label definition overwrite: '+key);
		}
		foil.defns[key] = defln[2];
		return { defn:defn };
	}
	return { label:label, verse:verse, margin:margin, indent:indent, content:content };
}

var src = `
##	Hello World

A paragraph of preose...

eg
	This and that..

	a code blk of

	indented lines...


&eg: pre class='eg'

`;


var blks = foil.parse(src); //, true);
// context = new Ctx(blks, foil.defns, context);
// console.log(blks);
console.log('defns=',foil.defns);


console.log("-- arith exp with semantic actions----------------");

var exp = new Grit(
	"exp  := sum (aop sum)* :: exp ",
	"sum  := term (mop term)* :: sum ",
	"term := num / '(' exp ')' :: term ",
	"aop  :~ \\s*([-+])\\s* :: string ",
	"mop  :~ \\s*([*/])\\s* :: string ",
	"num  :~ \\s*(\\d+)\\s* :: number "
);

// semantic actions......

exp.exp = function(sum, ops) { // exp  = sum (aop sum)*
	return exp.reduce(exp.sum(sum), ops);
}
exp.sum = function(term, ops) { // sum  = term (mop term)*
	return exp.reduce(exp.term(term), ops); //Left(sum, this.arith);
}
exp.term = function(num, expn) { // term = num / '(' exp ')'
	return expn? exp.exp(expn) : num;
}
exp.number = (_, num) => Number(num)
exp.string = (_, s) => s

exp.arith = function(n, op, m) {
	if (op === '+') return n+m;
	if (op === '-') return n-m;
	if (op === '*') return n*m;
	if (op === '/') return n/m;
}

// generic helper function......

exp.reduce = function(x, ops) { // ops = [[op, y], ...]
	if (!ops) return x;
	for (var i=0; i<ops.length; i+=1) {
		var t = ops[i];
		var op = t[0];
		var y = t[1];
		x = exp.arith(x, op, y);
	}
	return x;
}

console.log(exp.parse("1+2*3"));
console.log(exp.parse("1+2*(3+4)-5"));

console.log(exp.parse("1+2 * (3 + 4)-5"));


console.log("-- parsing with semantic actions----------------");

var moMap = {};
moMap['+'] = '++++';
moMap['-'] = '-';
moMap['*'] = '*';

var moexp = new Grit(
	"exp := num sym num",
	"num :~ [0-9]+ ",
	"sym :~ \\s* ([^0-9]+) \\s* :: sym "
);

moexp.sym = function(_,sym) {
	var val = moMap[sym]; // sym :~ \\s* (\\S+) \\s*
	// console.log('sym=',sym, 'val=', val, this.pos, this.input);
	if (!val) console.log('sym=',sym,'undefined..');
	return val||'?';
}

console.log(moexp.show(moexp.parse("1+2")));
console.log(moexp.parse("1+2"));
console.log(moexp.parse("1%2")); // undefined..


console.log("-- ES6 parsing with semantic actions----------------");
//	TypeError: Cannot read property '+' of undefined
// -- ES6 => function do not have "this" defined....
// var moexp1 = Grit`
// 	exp := num sym num
// 	num :~ [0-9]+
// 	sym :~ \s* ([^0-9]+) \s* :: (_, sym) => this.moMap[sym]
// `;

var moexp1 = Grit`
	exp := num sym num
	num :~ [0-9]+
	sym :~ \s* ([^0-9]+) \s* :: sym
`;
moexp1.moMap = moMap;

// moexp1.sym = (_, sym) => this.grit.moMap[sym]  // this will fail...

moexp1.sym = function (_, sym) { return this.grit.moMap[sym] }

console.log(moexp1.parse("1+2"));


console.log("-- datetime ----------------");

var mdy = Grit`
	mdy :~ (\d\d?)/(\d\d?)/(\d{4}) :: ${ (mdy, m, d, y) =>
			`<time datetime='${y}-${m}-${d}'>${mdy}</time>` }
`;

var d = mdy.parse("3/4/2015"); // => "<time datetime='2015-3-4'>3/4/2015</time>"

console.log(d);

console.log("-- expr ----------------");

var expr = Grit`
	sum  := num op num    :: calc
	num  :~ \s* ([0-9]+)  :: number
	op   :~ \s* ([+-])    :: string
`;
expr.calc = (n, op, m) => op==='+'? n+m : n-m;
expr.number = (_, num) => Number(num)
expr.string = (_, s) => s

var x = expr.parse("12 + 30"); // x = 42

console.log(x);

console.log("-- exprn ----------------");
// TODO Error: Rule sum :: semantic action failed:
// 	TypeError: this.calc is not a function

// var exprn = Grit`
// 	sum  := num op num    :: (n, op, m) => { console.log(n,op,m); return this.calc(n,op,m); }
// 	num  :~ \s* ([0-9]+)  :: number
// 	op   :~ \s* ([+-])    :: string
// `;
// exprn.calc = (n, op, m) => op==='+'? n+m : n-m;
//
// var x = exprn.parse("12 + 30"); // x = 42
//
// console.log(x);

console.log("-- The arith example from documentation ----------------");

// The JavaScript ES6 tag`...` syntax is used to define the grammar rules:

var arith = Grit`
	exp    := sum (addop sum)*       :: reduce
	sum    := term (mulop term)*     :: reduce
	term   := num / '(' exp ')'      :: trim
	addop  :~ \s*([-+])              :: string
	mulop  :~ \s*([*/])              :: string
	num    :~ \s*([0-9]+)\s*         :: number
`;

// Semantic action functions, defined using JavaScript ES6 => arrow function notation:

arith.string = (_, s) => s

arith.number = (_, num) => Number(num)

arith.trim = (a, b, c) => b || a

arith.reduce = (x, ops) => {
	for (var i=0; i<ops.length; i+=1) {
		var op = ops[i][0], y = ops[i][1];
		x = arith[op](x, y)
	}
	return x;
}

arith['+'] = (n,m) => n+m;
arith['-'] = (n,m) => n-m;
arith['*'] = (n,m) => n*m;
arith['/'] = (n,m) => n/m;

// The grammar can now be used to evaluate a string and return a numeric value:

// var x = arith.parse("1+2*(3+4)-5");  // x = 10
var x = arith.parse("1+2");
console.log(x);

var mdy = Grit`
	mdy :~ (\d\d?)/(\d\d?)/(\d{4}) :: ymd
`;

mdy.ymd = (_, m, d, y) => `${y}-${m}-${d}`;

var d = mdy.parse("3/4/2015"); // => "2015-3-4"

console.log(d);

console.log("-- semantic action using an external symbol table ---------");

var symbolMap = {
	"alpha" :"&#x3b1;",
	"beta"  :"&#x3b2;"
}

var symbol = Grit`
	sym :~ \s*(\S+)  :: symb
`;

symbol.symb = (_, match) => symbolMap[match]

var x = symbol.parse('beta');
console.log(x);

console.log("-- Grit in Grit ---------");

// 2018-02 updated with explicit white-space in peg rules..

var grit = Grit`
	grit  := ws (rule ws)+ :: rules
	rule  := id ws body ('::' act)? :: rule
	body  := ':=' peg / ':~' rex / '::' act
	peg   := seq ('/' seq)*
	seq   := sp (pre? term rep? sp (!next ws)? )+
	term  := id / quote / '(' peg ')'
	rex   := sp (reg (!'::' !next ws)?)*
	act   := (line (!next ws)?)*
	reg   :~ (?:[^:\n\r]|:[^:])*
	line  :~ [^\n\r]*
	next  :~ [\n\r]+ [ \t]* %id \s* :[=~:]
	id    :~ %name | %quote
	name  :~ [a-zA-Z]\w*
	quote :~ '[^']*' | "[^"]*"
	pre   :~ [&!]
	rep   :~ [*+?]
	sp    :~ [ \t]*
	ws    :~ \s*
`;

grit.rules = function(ws, rules) {
	return rules.map(function(rule){return rule[0];});
}

grit.rule = function (id, ws, body, actn) {
	var type = body[0][0]; // :=|:~|::
	var body = grit.flatten(body[1]);
	var act = actn[0]? grit.flatten(actn[0][1]) : "";
	if (type === '::') {act = body; body = "";}
	var term = {id:id[0], type, body, act};
	return term;
}

grit.flatten = function (arr) {
	var that = this;
	if (Array.isArray(arr)) {
		return arr.reduce(function (flat, toFlatten) {
			return flat.concat(that.flatten(toFlatten));
		}, []);
	} else {
		return arr;
	}
}

var test = `
	foo := bar bax bar
	bar :~ \s* (\w+)
	bax :~ \s* (\d)+
`;

var test1 = `
	foo := bar bax   :: boo
	bar :~ \s* (\w+) :: string
	baz :~ \s* (\d)+ :: number
	bax :: foobar
`;

var s = grit.parse(test1);
console.log(s);

console.log("-- Grit and PEG in Grit ---------");

var grit = Grit`
	grit  := ws (rule ws)+ :: rules
	rule  := label body :: rule
	label :~ [ \t]* ([a-zA-Z]\w*) [ \t]* (:[=~:])
	body  := line (nl !label line)*
	line  :~ [^\n\r]*
	ws    :~ \s*
	nl    :~ \n|\r\n?
`;

grit.rules = function(ws, rules) {
	return rules.map(function(rule){return rule[0];});
}

grit.rule = function (label, body) {
	var name = label[1];
	var type = label[2];
	var bod = grit.flatten(body);
	return {name, type, bod };
}

grit.flatten = function (arr) {
	var that = this;
	if (Array.isArray(arr)) {
		return arr.reduce(function (flat, toFlatten) {
			return flat.concat(that.flatten(toFlatten));
		}, []);
	} else {
		return arr;
	}
}

var test = `
	foo := bar bax bar
	bar :~ \s* (\w+)
	bax :~ \s* (\d)+
`;

var test1 = `
	foo := bar bax :: boo
	bar :~ \s* (\w+) :: string
	baz :~ \s* (\d)+ :: number
	bax :: foobar
`;

var s = grit.parse(test1);
console.log(s);

var peg = Grit`
	peg   := seq ('/' seq)* ('::' act)?
	seq   := (pre? term rep? ws)+
	term  := name / quote / '(' peg ')'
	act   :~ [\s\S]*
	name  :~ [a-zA-Z]\w*
	quote :~ '[^']*' | "[^"]*"
	pre   :~ [&!]
	rep   :~ [*+?]
	ws    :~ \s*
`;

var p = peg.parse("bar bax :: boo");
console.log(p);

console.log("-- Trace report example... ---------");

var arith = Grit`
	exp    := sum (addop sum)*       :: $reduce
	sum    := term (mulop term)*     :: $reduce
	term   := num / '(' exp ')'      :: term
	addop  :~ \s*([-+])              :: string
	mulop  :~ \s*([*/])              :: string
	num    :~ \s*([0-9]+)\s*         :: number
`;

arith.term = (a,b) => b||a;

arith.reduce = (n, ops) => {
	for (var i=0; i<ops.length; i+=1) {
		var op = ops[i][0], m = ops[i][1];
		n = arith[op](n, m)
	}
	return n;
}
arith.number = (_, num) => Number(num)
arith.string = (_, s) => s


arith['+'] = (n,m) => n+m;
arith['-'] = (n,m) => n-m;

// var arith = Grit`
// 	exp    := sum (addop sum)*
// 	sum    := term (mulop term)*
// 	term   := num / '(' exp ')'
// 	addop  :~ \s*([-+])
// 	mulop  :~ \s*([*/])
// 	num    :~ \s*([0-9]+)\s*
// `;

var x = arith.parse("1+2"); // $reduce trace...


console.log("-- Indented blocks... ---------");

var lines = Grit(`
	lines  := line*
	line   :~ (%inset) (%ln) %nl?   :: line
	inset  :~ [ \\t]*
	ln     :~ [^\\n\\r]*
	nl     :~ \\n|\\r\\n?
`);


lines.line = (_, inset, line) => {
	var lnum = this.lnum;
	if (!lnum) {
		this.lnum = lnum = 1;
		this.margins = [''];
	}
	this.lnum += 1;

	var margins = this.margins;
	var margin = margins[margins.length-1];

	if ( line.length === 0 || inset === margin ) {
		return { lnum, indent:margins.length-1, line };
	} else if (inset.length > margin.length) {
		if (inset.indexOf(margin) === 0) { // INDENT
			margins.push(inset);
			return { lnum, indent:margins.length-1, line };
		}
	} else if (inset.length < margin.length) {
		var m = margins.length-1;
		while (m > 0 && margin.indexOf(inset) === 0) { // DEDENT
			m -= 1;
			margin = margins[m];
			if (inset === margin) {
				this.margins = margins.slice(0,m+1);
				return { lnum, indent:m, line };
			}
		}
	}

	var fault = [inset, margins];
	console.log('Bad',[inset], margins);
	this.margins = [''];
	if (inset !== '') this.margins = ['', inset];
	return { lnum, indent:this.margins.length-1, fault, line };

}

var tst = `
	## Hello World

 A para..

	eg
		indented..

	Another ...
`;
var bs = lines.parse(tst);
console.log(bs);
