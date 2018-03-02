
#	Grit Grammar Parser

Grit is a grammar language that can transform an input string into any data type that an application program requires.

A Grit grammar can contain both PEG (Parser Expression Grammar) rules, and RegExp (Regular Expression) rules. The rules can include optional semantic actions to translate the rule results.

This note will discuss Grit as used in JavaScript, so some of the details will be specific to JavaScript, but the PEG rules, and the way that the Grit grammar language operates should be the same in any other host programming language.

##	Overview Example

The first example shows a complete JavaScript program that can evaluate simple arithmetic expressions -- which is the "Hello World" example for grammar languages. Don't worry about the details, they will be explained shortly, but if you are familiar with regular expressions and the general idea of grammar rules then you will probably follow how it all works.

In a Grit grammar the PEG grammar rules are introduced with a `:=` symbol, and the RegExp rules are introduced with a `:~`. The optional `::` introduces a semantic action to translate the rule result.

``` eg
	var Grit = require("./grit.js");

	// The JavaScript ES6 tag`...` syntax is used to define the grammar rules:

	var arith = Grit`
		exp    := sum (addop sum)*       :: reduce
		sum    := term (mulop term)*     :: reduce
		term   := num / "(" exp ')'      :: term
		addop  :~ \s*([-+])              :: string
		mulop  :~ \s*([*/])              :: string
		num    :~ \s*([0-9]+)\s*         :: number
	`;

	// Semantic action functions, defined using JavaScript ES6 => arrow function notation:

	arith.string = (_, str) => str

	arith.number = (_, num) => Number(num)

	arith.term = (a, b, c) => b || a

	arith.reduce = (x, ops) => ops.reduce((z,[op,y]) => arith[op](z,y), x)

	arith['+'] = (n,m) => n+m;
	arith['-'] = (n,m) => n-m;
	arith['*'] = (n,m) => n*m;
	arith['/'] = (n,m) => n/m;

	// Now use the grammar to evaluate a string and return a numeric value:

	var x = arith.parse("1+2*(3+4)-5");
	console.log(x); // 10
```

JavaScript 2015 ES6 has tag template strings that can be used to embed DSLs (Domain Specific Languages), and this works well for Grit. Earlier versions of JavaScript are not quite as neat.

The semantic action following the :: symbol is the name of a function to translate the rule result. A semantic action can be thought of as a type translator that transforms the parser rule result into the desired data type.

The result of a parse using the `arith` grammar is a numeric value. A different grammar may use different semantic actions to translate an input string into an ouput string, or some other application data type. If there are no semantic actions then the rules will build a parse tree of JavaScript Array elements, which an application program may process in any way it wants.


##	RegExp Rules

Lets start with a Grit grammar parser to match dates expressed in a `month/day/year` format, such as: `3/4/2015`. This grammar is just a single RegExp rule:

``` eg
	var date = Grit`
		mdy :~ (\d\d?)/(\d\d?)/(\d{4})
	`;

	var d = date.parse("3/4/2015");

	// d = ["3/4/2015", "3", "4", "2015", rule: 'mdy']
```

A RegExp rule can contain any regular expression (as documented for the host programming language). The result is an array of string values, first the overall match, then any bracket sub-group matches (three in this example), plus a rule name property with the name of the rule that produced this result.

The RegExp rules may contain extra white-space to make them more readable, but all white-space is removed from the rule body (except inside square brackets) before it is given to the RegExp engine as a pattern to match. A space character can only be matched if it is inside square brackets.

The date RegExp is simple enough, but larger regular expressions can become quite difficult to work with. To further help readability the Grit grammar allows a regular expression to be broken out into component parts like this:

``` eg
	var mdy = Grit`
		mdy   :~ (%month) / (%day) / (%year)
		month :~ \d \d?
		day   :~ \d \d?
		year  :~ \d{4}
	`;
```

The `%rule` is a placeholder that is replaced by the body of the named rule (which must be defined after the placeholder). This grammar has four rules, but after the placeholders are resolved the `mdy` rule is the only rule needed to match the complete date format. This grammar and the previous single rule grammar will parse the input with exactly the same RegExp expression, so they will have identical performance, and generate the same result.

The JavaScript regular expression engine is very fast, and it can express quite complex pattern matching rules. It is usually a good idea to match as much as possible with Regexp rules. On the other hand PEG rules make a better specification that is portable across host programming languages.


##	PEG Rules

The PEG rules can express sequences and choices.

An example of a sequence rule:

``` eg
	s := p q r
```

The s rule will match an input string that matches the p rule, followed by a q rule, and then an r rule, or it will fail to match the input.

The result of this rule (without a semantic action) will be a list with three terms:

``` eg
	[p, q, r]
```

Of course these terms are also rule results, so they will also return list structures:

``` eg
	[[p...], [q...], [r...]]
```

An example of a choice rule:

``` eg
	e := p / q / r
```

The e rule will match either: p, or q, or r, or fail. The choice is the first to match and it is exclusive, so the q rule can match if and only if the p rule fails to match.

The result of a rule is always a list, in this case it will contain a single term, the result of the first choice that matched:

``` eg
	[p], or [q], or [r], or e fails
```

The PEG rules allow an expression to employ the usual suffix repeat operators:

``` eg
	r := x? y+ z*
```

The x? will match x once, or not at all (and never fail). The y+ will match y one or more times (or fail). The z* will match z any number of times (and never fail).

The repeat operators generate a list of results that may contain zero or more items. The r rule will always generate a list of three items. The x? or z* results may be empty lists, for example:

``` eg
	[[], [y, ...], [z, ...]]
```

The PEG rules also allow an expression to employ the PEG prefix operators:

``` eg
	t := !x &y
```

The `!x` ensures that there is not an `x` at this point in the input. The `&y` ensures that there is a `y` that will match, but it does not consume the `y`. If the `t` rule matches then the result will be a list containing two empty lists: `[[], []]`.

Brackets can be used to group sub expressions:

``` eg
	g = p (x y)*
```

The result will be a list that always contains two items: first a `p` result then a list containing zero or more lists of `x` and `y` results:

``` eg
	[ p, [[x, y], [x, y], ... ] ]
```

A Grit PEG rule can refer to other PEG rules and to RegExp rules. Without RegExp terms (implicit or explicit) the PEG rules themselves do not have the ability to match input characters, they always use a RegExp rule to actually match any input.

In summary:

``` eg
	x y z  => [x, y, z]

	x*     => [x, ...]

	(x y)  => [x, y]

	(x y)* => [[x, y], ...]
```

##  PEG And RegExp Rules

To see why we need PEG rules in addition to RegExp rules let's try to match an iterative expression with a RegExp rule. For example, to parse a list of numbers that are added together, such as: "1+2-3+4". We could try this:

``` eg
	var sum = Grit`
		sum  :~ %num (%add %num)*
		add  :~ [+-]
		num  :~ [0-9]+
	`;
```

This RegExp will match the input correctly, but only the last match of the repeated expression is returned by the RegExp engine. Parsing "1+2-3+4" will generate a result like this:

``` eg
	["1+2-3+4", "1", "+4", rule: 'sum']
```

Of course we could write a longer RegExp match with more bracket groups, but that only works if the number of repeated terms is small and has a known maximum.

In general we need a PEG rule:

``` eg
	var sum = Grit`
		sum  := num (add num)*
		add  :~ [+-]
		num  :~ [0-9]+
	`;
```

The parse tree result for "1+2-3+4" will now contain all the matched terms:

``` eg
	[ [ '1', index: 0, input: '1+2...', rule: 'num', lastIndex: 1 ],
		[ [ [Array], [Array] ],
		[ [Array], [Array] ],
		[ [Array], [Array] ] ],
	  rule: 'sum',
	  index: 0,
	  lastIndex: 7 ]
```

The `sum` rule returns a match that is a sequence of rule matches as an array of results. The result starts with a `num` rule match, followed by any number of `add plus` rule matches.

To extend the example grammar to accept parentheses requires PEG rules to use recursion (RegExp rules can not):

``` eg
	var arith = Grit`
		exp    := term (op term)*
		term   := num / open exp close
		op     :~ [-+]
		num    :~ [0-9]+
		open   :~ [(]
		close  :~ [)]
	`;
```

The parse tree result for `1+2-(3+4)` is:

``` eg
	[ [ [ '1', index: 0, input: '1+2...', rule: 'num', lastIndex: 1 ],
	    rule: 'term',
	    index: 0,
	    lastIndex: 1 ],
	  [ [ [Array], [Array] ], [ [Array], [Array] ] ],
	  rule: 'exp',
	  index: 0,
	  lastIndex: 9 ]
```

##	White-space

Many traditional grammar parsers use a separate lexical parse to skip white-space and recognize symbols, words, and numbers as tokens. PEG grammar rules integrate this into the grammar rules, so white-space must be dealt with explicitly.

Here is the previous example enhanced to accept white-space:

``` eg
	var sum = Grit`
		exp   := term (op term)*
		term  := num / open exp close
		op    :~ \s* ([+-])
		num   :~ \s* ([0-9]+)
		open  :~ \s* [(]
		close :~ \s* [)]
	`;
```

In a PEG rule any literal text quoted with single-quote characters `'...'` will match the text inside the quote marks. Double-quotes `"..."` are slightly different, they will match any number of white-space characters before the quoted literal text.

This allows the previous example to be written as:

``` eg
	var sum = Grit`
		exp   := term (op term)*
		term  := num / "(" exp ")"
		op    :~ \s* ([+-])
		num   :~ \s* ([0-9]+)
	`;
```

##	The Parse Tree

The result of a rule match is always a JavaScript Array. The first rule in the grammar is the start rule and it will return an array with nested sub-rule array results. This is the parse tree.

For regular expression rules the result is a standard RegExp Array result (as documented for JavaScript), plus an extra property for the rule name that generated this match.

The PEG rules are an Array containing the match results of the sub-rules that matched, plus the same extra property to record the rule name.

An application program can access components of the parse tree. The next example illustrates this:

``` eg
	var sum = Grit`
		sum  := num plus*
		plus :~ %add %num
		num  :~ [0-9]+
		add  :~ [+-]
	`;

	var total = sum.parse("1+2-3+4");

	// total = [ ["1", rule:'num'], [["+2", rule:'plus'], ["-3", ...] ... ], rule:'sum']

	var num  = total[0];           // num = ["1", rule:'num']
	var n    = Number(num[0]);     // n = 1
	var ps   = total[1];           // ps = [plus, ...]
	var p    = ps[1]               // p = ["-3", rule:'plus']
	var name = p.rule              // name = 'plus'
	var op   = p[1];               // op = '-'
```

##	Semantic Actions

A rule may be have an optional semantic action appended after a "::" symbol. The action can name a function to translate a rule match result. A rule match result is an Array by default, but a semantic action can be used as a type translator to transform that into any result type the application requires.

For example, the `number` type translator is defined as a function that takes a RegExp match result and returns a numeric value:

``` eg
	var integer = Grit`
		int :~ \s* ([0-9]+) :: number
	`;

	integer.number = (_, digits) => Number(digits);

	var n = integer.parse("42"); // => n = 42
```

The calling convention is: `number(...result)`, where `result` is the Array result from the RegExp rule, with its terms "spread" into argument values (the ... is the spread operator in JavaScript ES6). In this case it is the first bracket field that is translated into a numeric value.

The next example translates the date format: m/d/y into a: y-m-d format:

``` eg
	var mdy = Grit`
		mdy :~ (\d\d?)/(\d\d?)/(\d{4}) :: ymd
	`;

	mdy.ymd = (_, m, d, y) => `${y}-${m}-${d}`;

	var d = mdy.parse("3/4/2015"); // => "2015-3-4"
```

The first argument will be the full RegExp match, but that is not required for this example. The other arguments supply the RegExp bracket group match result fields, which the `ymd` function has named `m, d, y`.

In the next example the type translator returns a JavaScript Date object:

``` eg
	var mdy = Grit`
		mdy :~ (\d\d?)/(\d\d?)/(\d{4}) :: date
	`;

	mdy.date = (_, m, d, y) =>  new Date(Number(y), Number(m), Number(d));

	var d = mdy.parse("3/4/2015"); // => Sat Apr 04 2015 00:00:00 GMT-0400 (EDT)
```

If the type translator is specific to an individual rule then it may be written as an anonoymous function directly in that rule. Here is the same exmple again, this time written as an anyonymous function:

``` eg
	var mdy = Grit`
		mdy :~ (\d\d?)/(\d\d?)/(\d{4}) :: (_, m, d, y) => new Date(Number(y), Number(m), Number(d))
	`;

	var d = mdy.parse("3/4/2015"); // => Sat Apr 04 2015 00:00:00 GMT-0400 (EDT)
```

The next example translates the input string into an HTML time element (a string value).

``` eg
	var mdy = Grit`
		mdy :~ (\d\d?)/(\d\d?)/(\d{4}) :: (mdy, m, d, y) =>
				"<time datetime='"+y+"-"+m+"-"+d+"'>"+mdy+"</time>"
	`;

	var d = mdy.parse("3/4/2015"); // => "<time datetime='2015-3-4'>3/4/2015</time>"
```

A JavaScript template string `(`...`)` can interpolate any JavaScript expressions enclosed in `${ ... }`, so the function definition may contain a nested template string with it's own interpolation:

``` eg
	var mdy = Grit`
		mdy :~ (\d\d?)/(\d\d?)/(\d{4}) :: ${ (mdy, m, d, y) =>
				`<time datetime='${y}-${m}-${d}'>${mdy}</time>`
		}
	`;
```

A type translator works in much the same way on PEG grammar rules. In this case the PEG rule result terms are supplied as arguments to the type translator rather than the RegExp fields:

``` eg
	var expr = Grit`
		sum  := num op num    :: calc
		num  :~ \s* ([0-9]+)  :: number
		op   :~ \s* ([+-])    :: string
	`;

	expr.string = (_, str) => str;
	expr.number = (_, digits) => Number(digits);
	expr.calc   = (n, op, m) => op === '+'? n+m : n-m;

	var x = expr.parse("12 + 30"); // x = 42
```

The custom function `calc` takes the result of the sum rule and calculates a numeric value from the component parts.

The pattern in the `sum` rule is in the form of a binary infix operator, and a generic infix function can be defined to handle this pattern with helper functions for the required operators:

``` eg
	var expr = Grit`
		sum  := num op num    :: infix
		num  :~ \s* ([0-9]+)  :: number
		op   :~ \s* ([+-])    :: string
	`;

	exp.infix = (n, op, m) => exp[op](n,m);

	expr['+'] = (n, m) => n+m;
	expr['-'] = (n, m) => n-m;
```

The `infix` function uses the value of the `op` to select a custom function to perform the required operation. The infix function can be used with different application types and any number of operators can be defined.

Now consider a more general grammar that can match a list of infix operators:

``` eg
	var expr = Grit`
		sum  := num (op num)* :: reduce
		num  :~ \s* ([0-9]+)  :: number
		op   :~ \s* ([+-])    :: string
	`;

	expr.reduce = (x, ops) => // x (op y)* => z
		ops.reduce((z,[op,y]) => arith[op](z,y), x)

	expr['+'] = (n, m) => n+m;
	expr['-'] = (n, m) => n-m;

	console.log( expr.parse("1+2-3+4") ); // => 4
```

The `reduce` function works with left assciative operators, a similar `reduceRight` function can be defined for right associative operators.


##	Left Recursion

Traditional grammar rules use left recursion to parse a left associative tree, and right recursion for right association. PEG grammar rules typically use iteration to generate a flat list.

For example, the string "a•b•c•d" may be parsed with three different grammar rules:

``` eg
	exp := exp op x   =>  (((a•b)•c)•d)      left associate -- but no left recursion in Grit

	exp := x op exp   =>  (a•(b•(c•d)))      right associate

	exp := x (op x)*  =>  (a((•b)(•c)(•d)))  flat list -- idiomatic Grit PEG form
```

All three grammar rules recognise the same input language, it is only the parse tree structures that differ. The Grit grammar does not support left recursion, but the same effect can be achieved by matching the input as a flat list, and then using a function to translate that into left associative list as required.

The `reduce` function can be used to evaulate left (or right) associate operators:

``` eg
	reduce       (a((•b)(•c)(•d)))  => (((a•b)•c)•d)

	reduceRight  (a((•b)(•c)(•d)))  => (a•(b•(c•d)))
```

The `reduce` function takes an application function to evaluates each (x•y) binary expression in order to reduce a flat list to a single value.


## Result Types

A semantic action may return almost any type except for a special value that is reserved to mean that the rule has failed. In JavaScript the `null` or `undefined` types will cause the rule to fail, any other value may be returned.

The ability for a type translator to cause a rule to fail is important in some applications. For example, let's assume that the grammar has a set of key words or symbols to match. A simple way to do that is with a RegExp rule:

``` eg
	var symbol = Grit`
		sym :~ \s* (alpha|beta|gamma|....)
	`;
```

This approach is very fast, but it is a linear search, so for a very large symbol table there are other algorithms that will run faster. In addition to matching the input an application will often want to use a type translator to map the input match into a symbol value:

``` eg
	var symbol = Grit`
		sym :~ \s* (alpha|beta|gamma|....)  :: lookup
	`;

	symbol.lookup = (_, sym) => symbol.symbolMap[sym];

	symbol.symbolMap = {
		"alpha" : "&#x3b1;",
		"beta"  : "&#x3b2;",
		...
	}
```

In this case the keys of the symbolMap are repeated in the RegExp. To avoid that, the type translator may simply lookup any key word token and return a null value to fail the rule if is there is no such key. A type translator can thus eliminate the need to repeat the key values in the RegExp. A token for any potental key word can be matched:

``` eg
	var symbol = Grit`
		sym :~ \s* (\w+) :: lookup
	`;

	symbol.lookup = (_, sym) => symbol.symbolMap[sym];

	var x = symbol.parse('dot'); // x = '•'
```

This rule is fast and efficient and it returns the value from the symbolMap lookup (or the rule fails). The symbol table may be managed in the application outside the grammar.

This use of a lookup function to check a token in a map is very flexible and general purpose, but there is an extreme case that it can't quite handle. This is when the length of the keys in the map are many different lengths, and the grammar requires the longest token match. This can be approximated with a separate map for each key length, and then matching for the longest key length token first, and if that fails then try the next longest key length, and so on. If that approach is not good enough then the semantic action can be made to act as a parser function, as explained in the next section.


##	Parser Functions

There are some context sensitive grammars that can not be expressed with a PEG grammar (or in any other Context Free grammar language). These problems can be solved by allowing a semantic action to take over and act as a parser. A semantic action can save data for context sensitive parsing, and it may examine the input at the current position and advance the position to generate a match, or fail.

Since this technique can use the host programming language to do anything you like it is the ultimate escape hatch for difficult grammars, or for performance enhancements. The down side is that it allows the grammar to degenerate into an ad-hoc programming language solution that may be quite difficult to define in a specification that is fully portable to other implementations.

A simple example of a context sensitive grammar is the use of indentation for nesting, where the indentation must be matched with a previous indentation inset. The standard way to avoid this problem in the grammar is to use a lexer that generates an INDENT token when the start of an indented block is found, and one or more DEDENT tokens at the end of indentation(s). Standard grammar rules can then use these tokens exactly like nested brackets are used. For example as a {...} block in a programming language grammar, or the parenthesis (...) in S-expressions grammar.

Here is an example of a lexer that generates token objects for each line of input with its line number and indentation level. It also generates a failure if there is an error in the indentation. The indentation can be spaces or tabs, but it is an error if they are not consistent, the indentation of each line in each indented block must have exactly the same inset margin. The semantic action called `line` compares the inset of the current line with the current inset margin and maintains a stack of indentation levels.

``` eg
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

	var txt = `
		## Hello World

		A para..

		eg
			indented..

		Another para ...
	`;

	var tokens = lines.parse(txt);
	console.log(tokens);
```

The data for the line numbering and the stack of margin indentations are saved in the context of the parse (as `this.lnum`, and `this.margins`). The input and the current position are also available in this context, but they are not needed for this particular example. This example could be used as a lexer to feed tokens into another grammar, or it could be embedded into a larger Grit grammar.



##	Trace Reporting

It is easy to get grammar rules wrong, and hard to sort them out when you do. To help with this a trace report can be generated for any grammar rule by inserting a `$` before the semantic action. To show how this works we can use our first example again:

``` eg
	var arith = Grit`
		exp    := sum (addop sum)*       :: reduce
		sum    := term (mulop term)*     :: $ reduce
		term   := num / "(" exp ')'      :: term
		addop  :~ \s*([-+])              :: string
		mulop  :~ \s*([*/])              :: string
		num    :~ \s*([0-9]+)\s*         :: number
	`;

	arith.string = (_, str) => str
	arith.number = (_, num) => Number(num)
	arith.term   = (a, b, c) => b || a
	arith.reduce = (x, ops) => ops.reduce((z,[op,y])=>arith[op](z,y),x)

	arith['+'] = (n,m) => n+m;
	arith['-'] = (n,m) => n-m;
	arith['*'] = (n,m) => n*m;
	arith['/'] = (n,m) => n/m;

	var x = arith.parse("1+2*3")
```

A trace report will be generated for the `sum` rule that has a `$` prefix before the semantic action (any number of rules may have a `$` prefix). For this example the `sum` rule will match twice:

``` eg
	1+2*3
	^^ 0..1 exp sum mulop !
	[ 1, [], rule: 'sum', index: 0, lastIndex: 1 ]
	=> 1

	1+2*3
	  ^  ^ 2..5 exp sum mulop !
	[ 2, [ [ '*', 3 ] ], rule: 'sum', index: 2, lastIndex: 5 ]
	=> 6
```

*	The first line of the trace record shows the input string around the match result.

*	The second line shows the cursor positions `^` for the index range that was matched. Then the numeric values of the index range, followed by a list of all the rule calls that lead to this result. An `!` in this list indicates that the previous rule in the list failed.

*	The third line shows the Array result generated by the rule match. This will contain the input arguments to the semantic action.

*	The final line starts with a `=>` and shows the value returned by the semantic action (if there is one).


##  Appendix: Grit In Grit

The grammar for the Grit grammar rules can be defined in Grit. The interpretation of the regular expression syntax and the semantic action syntax depends on the host programming language.

``` eg
	var grit = Grit`
		grit  := ws (rule ws)+ :: rules
		rule  := id ws body ('::' act)? :: rule
		body  := ':=' peg / ':~' rex / '::' act
		peg   := seq ('/' seq)*
		seq   := sp (pre? term rep? sp (!next ws)? )+
		term  := id / quote / '(' peg ')'
		rex   := sp (reg (!'::' !next ws)?)*
		act   := (line (!next ws)?)*
		reg   :~ (?: [^:\n\r]* (?: :[^:])?)*
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

	grit.rules = (ws, rules) => rules.map((rule)=>rule[0])

	grit.rule = function (name, body, actn) {
		var type = body[0][1]; // :=|:~|::
		var body = grit.flatten(body[1]);
		var act = actn[0]? grit.flatten(actn[0][1]) : "";
		if (type === '::') {act = body.trim(); body = "";}
		var term = {name:name[0], type, body, act};
		return term;
	}
	
	grit.flatten = function (list) {
		return list.reduce(function (a, b) {
			return a.concat(Array.isArray(b) ? grit.flatten(b) : b);
		}, []);
	}
```

<style type="text/css">
	body {
		font-family: 'Helvetica Neue', Helvetica, Arial, serif;
		font-size: 1em;
		line-height: 1.5;
		color: #505050;
	}
	code.language-eg { display:block; background:whitesmoke; margin:0pt 10pt;}
</style>