var Grit = require('grit')

// simple RegExp string match for m/d/y date format..

var mdy = Grit`
	mdy :~ \d\d? / \d\d? / \d{4}
`;

var date = mdy.parse("2/3/2015")
console.log("m/d/y => ", date) // m/d/y =>  2/3/2015

// more useful to see the RegExp result with the matched parts...

var mdy = Grit`
	mdy :~ (\d \d?) / (\d \d?) / (\d{4}) :: (...xs) => xs 
`;

var date = mdy.parse("2/3/2015")
console.log("m/d/y => ", date) // m/d/y =>  [ '2/3/2015', '2', '3', '2015' ]

// or as an object:

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
