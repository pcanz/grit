
doc_mds = $(wildcard doc/*.md)
doc_htmls = $(doc_mds:.md=.html)

.PHONY: all verified
all: test/check.txt $(doc_htmls)

test/check.txt: grit.js
	node test/test-all.js > test/check.txt
	diff test/check.txt test/verify.txt

verified:
	cp test/check.txt test/verify.txt

%.html: %.md
	node bin/markdown.js $^ $@
	
