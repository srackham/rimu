SOURCE = src/rimu.ts \
	src/helpers.ts \
	src/options.ts \
	src/io.ts \
	src/variables.ts \
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

test: build lint
	nodeunit $(TESTS)

build: bin/rimu.js doc

bin/rimu.js: $(SOURCE)
	tsc --declaration --out bin/rimu.js $(SOURCE)
	uglifyjs bin/rimu.js > bin/rimu.min.js

doc: doc/index.html doc/tips.html doc/showcase.html 

doc/index.html: README.md doc/doc-header.rmu doc/footer.rmu
	node ./bin/rimuc.js --output doc/index.html \
		doc/doc-header.rmu \
		README.md \
		doc/footer.rmu

doc/tips.html: doc/tips.rmu doc/doc-header.rmu doc/footer.rmu
	node ./bin/rimuc.js --output doc/tips.html \
		doc/doc-header.rmu \
		doc/tips.rmu \
		doc/footer.rmu

doc/showcase.html: doc/showcase.rmu doc/bootstrap-header.rmu doc/footer.rmu
	node ./bin/rimuc.js --output doc/showcase.html \
		doc/bootstrap-header.rmu \
		doc/showcase.rmu \
		doc/footer.rmu


commit:
	make --always-make test    # Force rebuild and test.
	git commit -a

publish:
	npm publish

push:
	git push -u --tags origin master

.PHONY: all lint test build commit doc push
