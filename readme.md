#	ReadMe

This project is for maintenance of the `grit.js` grammar parser source code. For more information see the documents in the doc/ folder.

The `grit.js` code has no external dependencies, it is a stand alone library function.

The examples/ folder has `example.js` files together with their output `example.js.txt` files.

The examples employ: `request('grit')` which assumes the parent of this directory contains a `node_modules` directory with a copy of the `grit.js` code.

## Usage

The `grit.js` code has a wrapper to export itself for use in Node.js, but if no `module.exports` is available then `grit.js` will load itself as `Grit` in the local `this` context, or failing that into a `window` or `global` name-space.

1.	module.exports = Grit
2.	this.Grit = Grit
3.	window.Grit = Grit
4.	global.Grit = Grit

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

The test command will copy the `grit.js` file from this directory into `node_modules` folder of the parent directory to ensure the latest version is being loaded by examples that use: `request('grit')`.

To run an example:

	> node examples/example.js
	
The result should be a console.log.

To add a new example, after console.log verification, write the result into a file:

	> node examples/new-example.js > examples/new-example.js.txt

To generate HTML version of documents in folder doc/	

	> npm run doco

	
