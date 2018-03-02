#	ReadMe

This project is for maintenance of the `grit.js` grammar parser code.


##	Developer Conventions

A `makefile` will run a regression test and update HTML documentation files as necessary (run: $ make ).

The `test/test-all.js` script contains a collection of examples and test cases, the `console.log` results from running this are in `test/check.txt`, which should match a previously verified version stored in `verify.txt`. A newly verified `test/check.txt` can be accepted by running: $ make verified.
