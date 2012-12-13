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

build: bin/rimu.js samples

bin/rimu.js: $(SOURCE)
	tsc --declaration --out bin/rimu.js $(SOURCE)
	uglifyjs bin/rimu.js > bin/rimu.min.js

samples: samples/showcase.html samples/index.html

samples/showcase.html: samples/showcase.rmu
	cat samples/bootstrap-header.html \
		samples/showcase.rmu \
		samples/footer.html \
		| node ./bin/rimuc.js > samples/showcase.html

samples/index.html: samples/index.rmu
	node ./bin/rimuc.js samples/index.rmu > samples/index.html

commit:
	make --always-make test    # Force rebuild and test.
	git commit -a

push:
	git push -u --tags origin master

.PHONY: all lint test build commit samples push
