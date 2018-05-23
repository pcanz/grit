
#	Grit Grammar Parser

Grit is a grammar language parser that can transform an input string into any data type that an application program requires.

A Grit grammar can contain both PEG (Parser Expression Grammar) rules, and RegExp (Regular Expression) rules. The rules can include optional action functions (or semantic actions) to translate the rule results.

This note will discuss Grit as used in JavaScript, so some of the details will be specific to JavaScript, but the PEG rules, and the way that the Grit grammar language operates should be the same in any other host programming language.

##	Overview Example

The first example shows a complete JavaScript program that can evaluate simple arithmetic expressions -- which is the "Hello World" example for grammar languages. Don't worry about the details, they will be explained later, but if you are familiar with regular expressions and the general idea of BNF grammar rules then you will probably follow how it all works.

In a Grit grammar the PEG grammar rules are introduced with a `:=` symbol, and the RegExp rules are introduced with a `:~`.

``` eg
	const Grit = require('grit')

	var expr = Grit`
		expr := mul (('+'/'-') mul)*
		mul  := num (('*'/'/') num)*
		num  :~ \d+
	`;

	var s = "1+2*3"
	var e = expr.parse(s)
	console.log(s,'=>', JSON.stringify(e))

	// 1+2*3 => ["1",["+",["2",["*","3"]]]]
```
JavaScript 2015 ES6 has tag template strings that can be used to embed DSLs (Domain Specific Languages), and this works well for Grit grammar rules. In particular the backslash characters in regular expressions do not need to be double escaped. Using earlier versions of JavaScript is not quite as neat.

The Grit grammar rules may be extended with an `::` to introduce an action function, or semantic action, that can translate the grammar rule parse results. An action function can be thought of as a type-translator that transforms the parser rule result into some desired data-type.

The next example extends the first example with action functions that evaluate an arithmetic expression into a numeric value. The grammar has also been extended to accept white space, and allow sub expressions in parentheses.

``` eg
	const Grit = require('grit')

	var expr = Grit`
		expr := mul (("+"/"-") mul)*   :: arith
		mul  := term (("*"/"/") term)* :: arith
		term := par / num              :: (t) => t
		par  := "(" expr ")"           :: (_,e) => e
		num  :~ \s* (\d+)              :: (_,n) => Number(n)
	`;

	expr.arith = (n, ns) => ns.reduce((x,[[op],m]) => expr[op.trim()](x,m), n)

	expr['+'] = (x,m) => x+m
	expr['*'] = (x,m) => x*m
	expr['-'] = (x,m) => x-m
	expr['/'] = (x,m) => x/m

	// for example...

	var s = " 2 * (3+4) "
	var e = expr.parse(s)
	console.log(s,'=>', e) //  2 * (3+4)  => 14
```

This example demonstrates many of the Grit grammar features, now to explained all that we will start with much simpler examples.


##	RegExp Rules

Lets start with a Grit grammar parser to match dates expressed in a `month/day/year` format, such as: `3/4/2015`. This grammar is just a single RegExp rule to match the `mdy` date format:

``` eg
	const Grit = require('grit')

	var mdy = Grit`
		mdy :~ \d\d? / \d\d? / \d{4}
	`;

	var date = mdy.parse("2/3/2015")
	console.log("m/d/y => ", date) // m/d/y =>  2/3/2015
```

A RegExp rule can contain any regular expression (as documented for the host programming language). The RegExp rules may contain extra white-space to make them more readable, but all white-space is removed from the rule body (except inside square brackets) before it is given to the RegExp engine as a pattern to match. A space character can only be matched if it is inside square brackets.

The date RegExp is simple enough, but larger regular expressions can become quite difficult to work with. To further help readability the Grit grammar allows a regular expression to be broken out into component parts like this:

``` eg
	const Grit = require('grit')

	var mdy = Grit`
		mdy   :~ %month / %day / %year
		month :~ \d \d?
		day   :~ \d \d?
		year  :~ \d{4}
	`;

	var date = mdy.parse("2/3/2015")
	console.log("m/d/y => ", date) // m/d/y =>  2/3/2015
```
The `%rule` is a placeholder that is replaced by the body of the named RegExp rule.

This grammar has four rules, but after the placeholders are resolved the `mdy` rule is the only rule needed to match the complete date format. This grammar and the previous single rule grammar will parse the input with exactly the same RegExp expression, so they will have identical performance, and generate the same result.

By default the result of a RegExp rule is a matched string. But there may be sub-string values matched for capture group parentheses in the regular expression. An action function will be given all of the RegExp match results as arguments.

An action function can be any JavaScript function after the `::` symbol:
``` eg
	const Grit = require('grit')

	var mdy = Grit`
		mdy :~ (\d \d?) / (\d \d?) / (\d{4})  :: (...xs) => xs
	`;

	var date = mdy.parse("2/3/2015")
	console.log("m/d/y => ", date) // m/d/y =>  [ '2/3/2015', '2', '3', '2015' ]
```
An action function can translate a RegExp result into whatever parse result is desired, for example:
``` eg
	const Grit = require('grit')

	// as a simple object ....

	var mdy = Grit`
		mdy :~ (\d \d?) / (\d \d?) / (\d{4}) :: (_,m,d,y) => ({m,d,y})
	`;

	var date = mdy.parse("2/3/2015")
	console.log("m/d/y => ", date) // m/d/y =>  { m: '2', d: '3', y: '2015' }

	// or as an Date object:

	var mdy = Grit`
		mdy :~ (\d \d?) / (\d \d?) / (\d{4}) :: (_,m,d,y) => new Date(y,m,d)
	`;

	var date = mdy.parse("2/3/2015")
	console.log("m/d/y => ", date) // m/d/y =>  2015-03-03T05:00:00.000Z

	// or as an HTML datetime element:

	var mdy = Grit`
		mdy :~ (\d \d?) / (\d \d?) / (\d{4}) :: ${ (mdy, m, d, y) =>
				`<time datetime='${y}-${m}-${d}'>${mdy}</time>` }
	`;

	var date = mdy.parse("2/3/2015")
	console.log("m/d/y =>", date) // m/d/y => <time datetime='2015-2-3'>2/3/2015</time>
```

The JavaScript regular expression engine is very fast, and it can express quite complex pattern matching rules. For this reason you may want to match as much as possible with large Regexp rules. On the other hand PEG rules make a better grammar specification that is portable across host programming languages.


##	PEG Rules

The PEG rules do not usually match the input string directly, they can express sequences and choices of string match results from RegExp rules.

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

To see why we need PEG rules in addition to RegExp rules let's try to match an iterative expression with a RegExp rule. For example, to parse a list of numbers that are added together, such as: "1+2+3+4". We could try this regular expression:

``` eg
	const Grit = require('grit')

	var sum = Grit`
		sum :~ %num ([+] %num)*  :: (...xs) => xs
		num :~ \d+
	`;

	var s = "1+2+3+4"
	var xs = sum.parse(s)
	console.log(s, '=>', xs) // 1+2+3+4 => [ '1+2+3+4', '+4' ]
```

This RegExp will match the input correctly, but only the last match of the repeated expression is returned by the RegExp engine.

Of course we could write a longer RegExp match with more bracket groups, but that only works if the number of repeated terms is small and has a known maximum.

In general we need a PEG rule:

``` eg
	const Grit = require('grit')

	var sum = Grit`
		sum := num ('+' num)*
		num :~ \d+
	`;

	var s = "1+2+3+4"
	var n = sum.parse(s)
	console.log(s, '=>', n) // 1+2+3+4 => ['1',[['+','2'],['+','3'],['+','4']]]
```
The parse result for "1+2+3+4" now contains *all* the matched terms. The literal `'+'` in single quotes is a shorthand equivalent to a reference to a RegExp rule that will match the quoted text.

The parse tree has a simple default format where the regular expression rules match input strings, and the PEG rules build a list structure. This is a good start, and may be sufficient for some applications. An application can "walk" the parse tree to generate code, or to translate the result into a data structure or a string with a different format.

An action function can be a JavaScript function after the `::` symbol, or it can be the name of an action function. Usually a named function will be defined as a property of the grammar object, but Grit library functions can also be used.

We can use an action function to add up the numbers like this:

``` eg
	const Grit = require('grit')

	var sum = Grit`
		sum := num ('+' num)* :: add
		num :~ \d+            :: (n) => Number(n)
	`;

	sum.add = function (n0, adds) {
		var sum = n0; // [n0, [[+,n1],[+,n2],[+,n3],...]]
		for (var i=0; i<adds.length; i+=1) {
			sum += adds[i][1]
		}
		return sum;
	}

	var s = "2+3+4"
	var n = sum.parse(s)
	console.log(s, '=>', n) // 2+3+4 => 9

	// Or using list.reduce() with JavaScript destructuring..

	var sum = Grit`
		sum := num ('+' num)* :: (n, ns) => ns.reduce((x,[_,m]) => x+m, n)
		num :~ \d+            :: (n) => Number(n)
	`;

	var s = "4+5+6"
	var n = sum.parse(s)
	console.log(s, '=>', n) // 4+5+6 => 15
```
Many traditional grammar parsers use a separate lexical scanner to skip white-space and recognize symbols, words, and numbers as tokens. PEG grammar rules integrate this into the grammar rules, so white-space must be dealt with explicitly.

In a PEG rule quotes provide a quick way to match a literal string without the need for an explicit RegExpr rule. Double quotes do the same thing as single quotes, but they will also skip any white-space before the literal match.

PEG rules can use recursion to handle nested sub expressions, as in the next example:

``` eg
	const Grit = require('grit')

	var expr = Grit`
		expr := mul (("+"/"-") mul)*   :: arith
		mul  := term (("*"/"/") term)* :: arith
		term := par / num              :: (t) => t
		par  := "(" expr ")"           :: (_,e) => e
		num  :~ \s* (\d+)              :: (_,n) => Number(n)
	`;

	expr.arith = (n, ns) => ns.reduce((x,[[op],m]) => expr[op](x,m), n)

	expr['+'] = (x,m) => x+m
	expr['*'] = (x,m) => x*m
	expr['-'] = (x,m) => x-m
	expr['/'] = (x,m) => x/m

	// for example...

	var s = "2*(3+4)"
	var e = expr.parse(s)
	console.log(s,'=>', e) // 2*(3+4) => 14

	var s = " 2 * (3+4) "
	var e = expr.parse(s)
	console.log(s,'=>', e) //  2 * (3+4)  => 14
```
Action functions enable a grammar parser to generate any data values. In the previous example the input expression is evaluated to a numerical value. In general a Grit grammar parser can be used as a string to string translator, or to translate a string into any other data structure.

Action functions can be used to build a parse tree with a data structure that best suits the application.


##	Left Recursion

Traditional grammar rules use left recursion to parse a left associative tree, and right recursion for right association. PEG grammar rules typically use iteration to generate a flat list.

For example, the string "a•b•c•d" may be parsed with three different grammar rules:

``` eg
	exp := exp op x   =>  (((a•b)•c)•d)      left associate -- but not in Grit

	exp := x op exp   =>  (a•(b•(c•d)))      right associate -- used in Grit

	exp := x (op x)*  =>  (a((•b)(•c)(•d)))  flat list -- idiomatic Grit PEG form
```

All three grammar rules recognize the same input language, it is only the parse tree structures that differ. The Grit grammar does not support left recursion, but the same effect can be achieved by matching the input as a flat list, and then using a function to translate that into left or right associative list as required.

The `reduce` function can be used to evaluate left (or right) associate operators:

``` eg
	reduce       (a((•b)(•c)(•d)))  => (((a•b)•c)•d)

	reduceRight  (a((•b)(•c)(•d)))  => (a•(b•(c•d)))
```


## Result Types

Without action functions the grammar rule parser will generate a parse tree of nested lists (JavaScript Arrays) and input string matched values. By default the list structure will be simplified to remove redundant nesting in order to make the parse tree results a little easier to read.

This allows you to quickly check that your grammar rules are matching input strings as you expect, before adding any action functions.

Action functions are given the rule result as argument values, so the full rule results may be preserved without any simplification by using an action function such as:

``` eg
	const Grit = require('grit')
	
	var xyz = Grit`
		xyz := x* y+ z? :: (...xs) => xs
		x   :~ x
		y   :~ y
		z   :~ z
	`;
	
	console.log(xyz.parse('y')) // [ [], ['y'], []]
```
By default the result from a RegExp rule will be the full string match, regardless of any capture groups. An action function is given all the RegExp matched values as arguments, so selected capture group result(s) can be returned. 

An action function may return almost any data value result, except for a two special values. A `null` value result will cause the rule to fail, and an `undefined` result will throw an exception (the action function is broken).

The ability for a action to cause a rule to fail is important in some applications. For example, let's assume that the grammar has a set of key words or symbols to match. A simple way to do that is with a RegExp rule:

``` eg
	var symbol = Grit`
		sym :~ (alpha|beta|gamma|....)
	`;
```

This approach is very fast, but it is a linear search, so for a large symbol table another approach may be better.

In addition to matching the input an application may also want to map the input match into a symbol value. To do this an action function can be used to lookup a match in a symbol table:

``` eg
	const Grit = require('grit')

	var symbol = Grit`
		symbol :~ \w+  :: (s) => this.symbolMap[s]
	`;

	symbol.symbolMap = {
		"alpha" : "&#x3b1;",
		"beta"  : "&#x3b2;",
		"etc_"  : "&...;"
	}

	console.log(symbol.parse('beta')) // &#x3b2;
```

This rule is fast and efficient and it either returns the value from the symbolMap lookup or the rule fails. The symbol table may be managed in an application outside the grammar.


##	Action Function Parsing

There are some context sensitive grammars that can not be expressed with a PEG grammar (or in any Context Free grammar language). These problems can be solved by allowing an action function to contribute to the syntax parsing.

A simple example is the ability to match the same input token again. For example the HTML grammar requires an element's start tag to match its close tag (i.e. it is not a context free grammar). However the HTML grammar rule specifications do not enforce this, it is outside the grammar, and the parse tree processing must check that the tags match.

In a Grit grammar an action can be used to check for matching tokens:
``` eg
	const require('grit')

	var xx = Grit`
		xx := x '=' x     :: (x1,_,x2) => (x1===x2)? true : false
		x  :~ \w+
	`;

	console.log(xx.parse('xx=xx')) // true
	console.log(xx.parse('xy=yx')) // false
```

An action can be used to save data for context sensitive parsing, and it may also examine the input at the current position and advance the position to generate a match.

Since an action uses the host programming language it can do almost anything. It is the ultimate escape hatch for difficult grammars, or for performance enhancements. The down side is that the grammar can degenerate into an ad-hoc programming language solution that may be quite difficult to define in a grammar specification that is portable to other implementations.


##	Trace Reporting

It is easy to get grammar rules wrong, and hard to sort them out when you do. To help with this a trace report can be generated for any grammar rule by inserting a `$` anywhere in a PEG grammar rule.
``` eg
	const Grit = require('grit')

	var test = Grit`
		test  := one two $ three
		one   :~ [1]+
		two   :~ [2]+
		three :~ [3]+
	`;

	console.log(test.parse('1111222333'))

	// 1111222333
	//        ^ 7 test $
	// [ '1111', '222', [], '333' ]
```
The `$` trace can also be injected before an action where it will also report the result of the action:

``` eg
	const Grit = require('grit')

	var test = Grit`
		test  := one two three :: $ () => '123'
		one   :~ [1]+
		two   :~ [2]+
		three :~ [3]+
	`;

	console.log(test.parse('1111222333'))

	// 1111222333
	//           ^ 10 test
	// => 123
	// 123
```
Another simple debug aid is use an action to log the result of a rule:
``` eg
	const Grit = require('grit')

	var test = Grit`
		test  := one two three :: (...xs) => xs
		one   :~ [1]+
		two   :~ [2]+          :: function (s) {console.log(s); return s}
		three :~ [3]+
	`;

	console.log(test.parse('1111222333'))
	// 222
	// [ '1111', '222', '333' ]


```

-----

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
