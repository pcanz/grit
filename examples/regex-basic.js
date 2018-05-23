var Grit = require('grit')

// %ref rules names...

var mdy = Grit`
	mdy   :~ (%month) / (%day) / (%year)
	day   :~ \d{1,2}
	month :~ \d{1,2}
	year  :~ \d{4}
`;

var date = mdy.parse("2/3/2015")
console.log("m/d/y => ", date) // m/d/y =>  2/3/2015

// any order %refs.....

var mdy = Grit`
	mdy   :~ (%month) / (%day) / (%year)
	d4    :~ \d{4}
	d2    :~ \d{1,2}
	month :~ %d2
	day   :~ %month
	year  :~ %d4
`;

var date = mdy.parse("2/3/2015")
console.log("m/d/y => ", date) // m/d/y =>  2/3/2015
