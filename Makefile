SOURCE = src/rimu.ts \
	src/helpers.ts \
	src/options.ts \
	src/io.ts \
	src/macros.ts \
	src/lineblocks.ts \
	src/delimitedblocks.ts \
	src/lists.ts \
	src/spans.ts \
	src/quotes.ts \
	src/replacements.ts

TESTS = test/spans.js \
	test/blocks.js

all: test

lint:
	jshint $(TESTS) bin/rimuc.js
	jsonlint --quiet package.json

test_spans:
	nodeunit test/spans.js
test_blocks:
	nodeunit test/blocks.js
test: build lint test_spans test_blocks

build: bin/rimu.js doc

bin/rimu.js: $(SOURCE)
	tsc --declaration --out bin/rimu.js $(SOURCE)
	uglifyjs bin/rimu.js > bin/rimu.min.js

doc: doc/index.html doc/tips.html doc/showcase.html 

doc/index.html: README.md doc/doc-header.rmu doc/doc-footer.rmu
	node ./bin/rimuc.js --output doc/index.html \
		--prepend "{--title}='Rimu Markup'" \
		doc/doc-header.rmu \
		README.md \
		doc/doc-footer.rmu

doc/tips.html: doc/tips.rmu doc/doc-header.rmu doc/doc-footer.rmu
	node ./bin/rimuc.js --output doc/tips.html \
		--prepend "{--title}='Rimu Tips'" \
		doc/doc-header.rmu \
		doc/tips.rmu \
		doc/doc-footer.rmu

doc/showcase.html: doc/showcase.rmu doc/doc-header.rmu doc/doc-footer.rmu
	node ./bin/rimuc.js --output doc/showcase.html \
		--prepend "{--title}='Rimu Showcase'" \
		doc/doc-header.rmu \
		doc/showcase.rmu \
		doc/doc-footer.rmu

commit:
	make --always-make test    # Force rebuild and test.
	git commit -a

push:
	git push -u --tags origin master

publish: publish-npm push publish-meteor

publish-npm:
	npm publish

publish-meteor:
	mrt publish .

.PHONY: all lint test build commit doc push publish publish-npm publish-meteor
