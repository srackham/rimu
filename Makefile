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

doc: doc/showcase.html doc/index.html

doc/showcase.html: doc/showcase.rmu
	node ./bin/rimuc.js --output doc/showcase.html \
		doc/bootstrap-header.html \
		doc/showcase.rmu \
		doc/footer.html


doc/index.html: doc/index.rmu
	node ./bin/rimuc.js --output doc/index.html doc/index.rmu

commit:
	make --always-make test    # Force rebuild and test.
	git commit -a

push:
	git push -u --tags origin master

.PHONY: all lint test build commit doc push
