const Grit = require('grit')

// The syntax for simple arithmetic:

var expr = Grit`
	expr := mul (('+'/'-') mul)*
	mul  := num (('*'/'/') num)*
	num  :~ \d+
`;

// the mult operations have higher priority than additions:

var s = "1+2*3"
var e = expr.parse(s)
console.log(s,'=>', JSON.stringify(e)) // 1+2*3 => ["1",["+",["2",["*","3"]]]]

var s = "2*3+1"
var e = expr.parse(s)
console.log(s,'=>', JSON.stringify(e)) // 2*3+1 => [["2",["*","3"]],["+","1"]]

var s = "1+2*3+4"
var e = expr.parse(s)
console.log(s,'=>', JSON.stringify(e)) // 1+2*3+4 => ["1",[["+",["2",["*","3"]]],["+","4"]]]

// Syntax looks ok, so now with arith semantic actions...

var expr = Grit`
	expr := mul (('+'/'-') mul)* :: arith
	mul  := num (('*'/'/') num)* :: arith
	num  :~ \d+                  :: (n) => Number(n)
`;

// expr.arith = (n, ns) => ns.reduce((x,[[op],m]) => expr[op](x,m), n)

expr.arith = function (n, ns) {
	var ans = n // [n, [[[op],n1], [[op],n2], ...]]
	for (var i=0; i<ns.length; i+=1) {
		var op = ns[i][0][0] // ns[i] = [[op], ni]
		var ni = ns[i][1]
		ans = expr[op](ans, ni)
	}
	return ans
}
expr['+'] = (x,m) => x+m
expr['*'] = (x,m) => x*m
expr['-'] = (x,m) => x-m
expr['/'] = (x,m) => x/m

// for example...

var s = "1+2*3"
var e = expr.parse(s)
console.log(s,'=>', e) // 1+2*3 => 7

var s = "2*3+1"
var e = expr.parse(s)
console.log(s,'=>', e) // 2*3+1 => 7

var s = "1+2*3+4"
var e = expr.parse(s)
console.log(s,'=>', e) // 1+2*3+4 => 11

// Add parenthesis, and allow white space...

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
