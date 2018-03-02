var fs = require('fs')

var file_in = process.argv[2];
var file_out = process.argv[3];

var cm = require("./commonmark.min.js")

var reader = new cm.Parser();
var writer = new cm.HtmlRenderer();

var src = fs.readFileSync(file_in)

var ptree = reader.parse(src.toString())
var html = writer.render(ptree)

fs.writeFileSync(file_out,html)
