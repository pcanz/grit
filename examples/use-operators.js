const Grit = require('grit')

Grit.use({foo:(s)=>'foo:'+s})

var usefoo = Grit`
	xxx :~ \w+ :: foo
`;

console.log(usefoo.parse('xxx'))


// ---

const opex = require('../lib/operators.js')

Grit.use(opex) // operators, expression

var expr = Grit`
	expr  := token*            :: expression
	token :~ [-+*/]+ | [0-9]+
`;

expr.operators`
	xfy    **
	yfx    * /
	yfx    + -
`;

// print parens....

var ps = function (src) {
	// console.log(src, '==>', expr.parse(src));
	console.log(src, '==>', expr.parens(expr.parse(src)));
}

// example..........................

ps(`1+2*3**4+1`)
