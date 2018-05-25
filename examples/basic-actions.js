const Grit = require('grit')

var xyz = Grit`
	xyz := x* y+ z? :: (...xs) => xs
	x   :~ x
	y   :~ y
	z   :~ z
`;

console.log(xyz.parse('y')) // [ [], ['y'], []]

var xyz = Grit`
	xyz := x* y+ z? 
	x   :~ x
	y   :~ y
	z   :~ z
`;

console.log(xyz.parse('y')) // [ [], [ 'y' ], [] ]
