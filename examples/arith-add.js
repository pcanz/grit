const Grit = require('grit')

// First the syntax for: 1+2+3+4+...

// Try with a RegExp...

var sum = Grit`
	sum :~ %num ([+] %num)*  :: (...xs) => xs
	num :~ \d+
`;

var s = "1+2+3+4"
var xs = sum.parse(s)
console.log(s, '=>', xs) // 1+2+3+4 => [ '1+2+3+4', '+4' ]

// A PEG rule is needed to return a full list of results..

var sum = Grit`
	sum := num ('+' num)*
	num :~ \d+
`;

var s = "1+2+3+4"
var n = sum.parse(s)
console.log(s, '=>', n)
// 1+2+3+4 => [ '1', [ [ '+', '2' ], [ '+', '3' ], [ '+', '4' ] ] ]

// OK for the syntax, now lets add up the numbers ...

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

// Now using list.reduce() and JavaScript destructuring (structure pattern matching)...

var sum = Grit`
	sum := num ('+' num)* :: (n, ns) => ns.reduce((x,[_,m]) => x+m, n)
	num :~ \d+            :: (n) => Number(n)
`;

var s = "4+5+6"
var n = sum.parse(s)
console.log(s, '=>', n) // 4+5+6 => 15
