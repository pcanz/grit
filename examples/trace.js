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

var test = Grit`
	test  := one two three :: (...xs) => xs
	one   :~ [1]+
	two   :~ [2]+
	three :~ [3]+
`;

console.log(test.parse('1111222333')) // [ '1111', '222', '333' ]

// ---

var test = Grit`
	test  := one two three :: (...xs) => xs
	one   :~ [1]+
	two   :~ [2]+          :: function (s) {console.log(s); return s}
	three :~ [3]+
`;

console.log(test.parse('1111222333'))
// 222
// [ '1111', '222', '333' ]
