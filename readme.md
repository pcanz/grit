#	ReadMe

This project is for maintenance of the `grit.js` grammar parser source code.

The `grit.js` code is in: `node_modules/grit.js` so that tests and examples can use it with: `request('grit')`.

The `grit.js` code has no external dependencies, it is a stand alone library function.

The `grit.js` code does have a wrapper to export itself for use in Node.js, but if no `module.exports` is available then `grit.js` will load itself as `Grit` in the local `this` context, or failing that into a `window` or `global` name-space.

1.	module.exports = Grit
2.	this.Grit = Grit
3.	window.Grit = Grit
4.	global.Grit = Grit

## Usage

### Node.js Use

	npm instal @pcanz/grit

	const Grit = require('grit')

###	Browser Use

	<script src='../path/grit.js'></script>
	
	// => window.Grit

### Application Use

	var mygrit = Grit`
		myRules := ...
		... Grit grammar using PEG and RegExp rules ...
	`;

	var parseTree = mygrit.parse('some example string...')


##	Developer Conventions

To run all the examples as a regression test, checking against their file results:

	> npm test

To run an example:

	> node examples/example.js
	
The result should be a console.log.

To add a new example, after console.log verification, write the result into a file:

	> node examples/new-example.js > examples/new-example.js.txt

To generate HTML version of documents in folder doc/	

	> npm run doco

	
