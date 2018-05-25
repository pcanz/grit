const Grit = require('grit')

var tst = Grit`
	tst := x_z z / xyz
	x_z := x !y &z
	x   :~ x
	y   :~ y
	z   :~ z
	xyz :~ [xyz]*
`;

console.log(tst.parse('xz')) // [ 'x', 'z' ]
console.log(tst.parse('xy')) // xy
