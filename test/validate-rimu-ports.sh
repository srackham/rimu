#!/bin/bash
#
# This script is used to verify all 3 Rimu ports (JS, Go, Kotlin) are congruent.
# If any discrepencies are detetected it exits immediately.
# Run this script before publishing a new Rimu release.
#
# - Tests and builds all three Rimu ports.
# - Checks that common test files are in sync.
# - Checks that common resource files are in sync.
# - Compiles the Rimu documentation with all three ports and checks they are identical.
#

set -eux

# Project directories.
GO=$HOME/local/projects/go/src/github.com/srackham/go-rimu
JS=$HOME/local/projects/rimu
KT=$HOME/local/projects/rimu-kt

# Check that common test files are in sync.
diff $GO/rimu/testdata/rimu-tests.json $JS/test/rimu-tests.json
diff $GO/rimugo/testdata/rimuc-tests.json $JS/test/rimuc-tests.json

diff $GO/rimu/testdata/rimu-tests.json $KT/src/test/resources/rimu-tests.json
diff $GO/rimugo/testdata/rimuc-tests.json $KT/src/test/resources/rimuc-tests.json

diff $JS/src/examples/example-rimurc.rmu $GO/rimugo/testdata/example-rimurc.rmu
diff $JS/src/examples/example-rimurc.rmu $KT/src/test/fixtures/example-rimurc.rmu

# Check that common resource files are in sync.
cd $JS/src/rimuc/resources
for f in *; do
    diff $f $GO/rimugo/resources/$f
    diff $f $KT/src/main/resources/org/rimumarkup/$f
done

# Build and test all ports.
cd $JS
jake test
cd $GO
make
cd $KT
./gradlew --console plain test installDist

# Compile Rimu documentation with all ports and compare.
for doc in reference tips changelog; do
    ARGS='--no-rimurc --theme legend --custom-toc --header-links --layout sequel --lang en --title "Rimu Reference" --highlightjs --prepend "{generate-examples}='"'yes'"'"  ./src/examples/example-rimurc.rmu ./doc/doc-header.rmu'
    GO_DOC=/tmp/$doc-go.html
    JS_DOC=/tmp/$doc-js.html
    KT_DOC=/tmp/$doc-kt.html

    cd $JS
    eval node bin/rimuc.js --output $JS_DOC $ARGS ./doc/$doc.rmu
    eval rimugo --output $GO_DOC $ARGS ./doc/$doc.rmu
    eval $KT/build/install/rimu-kt/bin/rimukt --output $KT_DOC $ARGS ./doc/$doc.rmu

    diff $JS_DOC $GO_DOC
    diff $JS_DOC $KT_DOC
done