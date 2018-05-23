const Grit = require('grit')

var symbol = Grit`
	symbol :~ \w+  :: (s) => this.symbolMap[s]
`;

symbol.symbolMap = {
	"alpha" : "&#x3b1;",
	"beta"  : "&#x3b2;",
	"etc_"  : "&etc;"
}

console.log(symbol.parse('beta')) // &#x3b2;

var xx = Grit`
	xx := x '=' x     :: (x1,_,x2) => (x1===x2)? true : false
	x  :~ \w+
`;

console.log(xx.parse('xx=xx')) // true
console.log(xx.parse('xy=yx')) // false
