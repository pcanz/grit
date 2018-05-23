// run with: npm test

// -- runs all examples and checks if the results differ from their previous file results

process.argv.slice(2).map((x)=>test(x))

function test(x) {
	const { exec } = require('child_process');
	exec(`node ${x} | diff ${x}.txt -`, (error, stdout, stderr) => {
	  if (error) {
	    console.error(`**** failed: ${x}`);
	    return;
	  }
	  if (stdout) console.log(stdout);
	  if (stderr) console.log(stderr);
	});
}
