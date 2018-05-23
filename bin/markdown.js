var fs = require('fs')
var cm = require("./commonmark.min.js")

var reader = new cm.Parser();
var writer = new cm.HtmlRenderer();

var unknown = {}; // labels not found

process.argv.slice(2).map(doco)

// function doco(file_in) {
// 	var src = fs.readFileSync(file_in)
// 
// 	var ptree = reader.parse(src.toString())
// 	var html = writer.render(ptree)
// 
// 	fs.writeFileSync(file_in+'.html',html)
// }

// var fs = require('fs')
// 
// var file_in = process.argv[2]
// if (!file_in)
// 	throw new Error("usage: cme file_in file_out (deafult: file_out = file_in.html)");
// var file_out = process.argv[3] || file_in+'.html';
// 
// var cm = require("./bin/commonmark.min.js")
// 
// var reader = new cm.Parser();
// var writer = new cm.HtmlRenderer();

function doco(file_in) {
	var src = fs.readFileSync(file_in)

	var ptree = reader.parse(src.toString())

	var walker = ptree.walker();
	var event, node;
	while ((event = walker.next())) {
	  if (!event.entering) continue;
	  node = event.node;
	  if (node.type === 'code_block') {
		translate(node, node.info, node.literal);
	  } else if (node.type === 'code') {
	  }
	}

	var html = writer.render(ptree)

	var doc = `<!DOCTYPE HTML>
	<html>
	<head>
	    <meta lang=en charset="UTF-8">
	<body>
	${html}
	</body>
	</html>
	`;

	fs.writeFileSync(file_in+'.html',doc)
}

// --------------------------------------

function resolve(label) {
	if (!label) return [null, null];
	if (label.match(/^(\/|[.][.]?\/)/)) return [label, null]
	var xs = label.split(/[.]/);
	if (!xs || xs.length < 2) return [label, null]
	var fn = xs[xs.length-1]
	var mod = label.slice(0,label.length-fn.length-1)
	return [mod, fn]
}

function translate (node, label, content) {
	var result='';
	var [mod, fn] = resolve(label)
	// console.log('resolved', label, mod, fn)
	if (!mod) return 1; // err, but usually no action required
	try {
		result = transform(node, mod, fn, content)
	} catch(err) {
		var fatal = error_log(err, mod)
		if (!fatal) { // module not found...
			try { result = transform(node, 'commands', label, content)
			} catch(cmderr) { return error_log(cmderr, 'commands') }
		}		
		// 		
		// 	}
		// } else console.log(err.message)
		// try {
		// 	result = transform(node, 'commands', label, content)
		// } catch(cmderr) {
		// 	console.log(err.message, cmderr.message)
		// 	return 3; //err.message, cmderr.message;
		// }
	}
	replace(node, result)
	return 0;
}

function error_log(err, label) {
	if (err.message.match(/^Cannot find module/)) {
		if (!unknown[label]) {
			unknown[label] = true
			console.log(err.message)
		}
		return 0; // not fatal..
	}
	return 2; // fatal..
}

function transform(node, mod, fn, content) {
	var onload, result;
	var path_name = require.resolve(mod)
	var loaded = module.children.some((m)=> m.filename === path_name)
	var imported = require(mod)
	if (!loaded && imported.onload) onload = imported.onload(node)||'';
	var fx = imported[fn] || imported[mod] || imported
	if (typeof fx !== 'function') {
		throw new Error(`No function defined for: '${mod}' '${fn}'`)
	}
	var result = fx(content, fn, node) // there may be an onload() result
	if (onload && result) return (''+onload+result)
	if (typeof result === 'string') return result
	throw new Error(`No result from transform for: ${mod} ${fn}`)
}

function replace(node, html) {
	var h = new cm.Node('html_block')
	h.literal = html
	node.insertAfter(h)
	node.unlink()
}
