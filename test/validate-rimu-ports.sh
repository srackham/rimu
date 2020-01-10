#!/bin/bash
#
# USAGE
#    validate-rimu-ports.sh [--update-fixtures]
#
# This script is used to verify all Rimu ports are congruent.
# If any discrepencies are detected it exits immediately.
# Run this script before publishing a new Rimu release.
#
# NOTE: Assumes the JS port contains the latest versions of common test fixture
#       and resource files. If Go or Kotlin ports contain latest versions they
#       should be copied to the JS project before running this script.
#
# - If invoked with --update-fixtures argument it copies common test fixtures and resource
#   files from JS project to Go and Kotlin projects.
# - Tests and builds all three Rimu ports.
# - Compiles the Rimu documentation with all three ports and checks they are identical.
#

set -eu
# set -x

# Project directories.
GO=$HOME/local/projects/go-rimu
JS=$HOME/local/projects/rimu
KT=$HOME/local/projects/rimu-kt
DART=$HOME/local/projects/rimu-dart
PY=$HOME/local/projects/rimu-py

# Copy test fixtures, resources and example rimurc file.
if [ "${1:-}" = "--update-fixtures" ]; then
    cp $JS/test/rimu-tests.json $GO/rimu/testdata/rimu-tests.json
    cp $JS/test/rimuc-tests.json $GO/rimugo/testdata/rimuc-tests.json
    cp $JS/src/examples/example-rimurc.rmu $GO/rimugo/testdata/example-rimurc.rmu

    cp $JS/test/rimu-tests.json $KT/src/test/resources/rimu-tests.json
    cp $JS/test/rimuc-tests.json $KT/src/test/resources/rimuc-tests.json
    cp $JS/src/examples/example-rimurc.rmu $KT/src/test/fixtures/example-rimurc.rmu

    cp $JS/test/rimu-tests.json $DART/test/rimu-tests.json
    cp $JS/test/rimuc-tests.json $DART/test/rimuc-tests.json
    cp $JS/src/examples/example-rimurc.rmu $DART/test/fixtures/example-rimurc.rmu

    cp $JS/test/rimu-tests.json $PY/tests/rimu-tests.json
    cp $JS/test/rimuc-tests.json $PY/tests/rimuc-tests.json
    cp $JS/src/examples/example-rimurc.rmu $PY/tests/fixtures/example-rimurc.rmu

    cd $JS/src/rimuc/resources
    for f in *; do
        cp $f $GO/rimugo/resources/$f
        cp $f $KT/src/main/resources/org/rimumarkup/$f
        cp $f $DART/lib/resources/$f
        cp $f $PY/src/rimuc/resources/$f
    done
fi

# Proceed only if all test fixtures and resource files are identical.
err=0
diff $JS/test/rimu-tests.json $GO/rimu/testdata/rimu-tests.json || err=1
diff $JS/test/rimuc-tests.json $GO/rimugo/testdata/rimuc-tests.json || err=1
diff $JS/src/examples/example-rimurc.rmu $GO/rimugo/testdata/example-rimurc.rmu || err=1

diff $JS/test/rimu-tests.json $KT/src/test/resources/rimu-tests.json || err=1
diff $JS/test/rimuc-tests.json $KT/src/test/resources/rimuc-tests.json || err=1
diff $JS/src/examples/example-rimurc.rmu $KT/src/test/fixtures/example-rimurc.rmu || err=1

diff $JS/test/rimu-tests.json $DART/test/rimu-tests.json || err=1
diff $JS/test/rimuc-tests.json $DART/test/rimuc-tests.json || err=1
diff $JS/src/examples/example-rimurc.rmu $DART/test/fixtures/example-rimurc.rmu || err=1

diff $JS/test/rimu-tests.json $PY/tests/rimu-tests.json || err=1
diff $JS/test/rimuc-tests.json $PY/tests/rimuc-tests.json || err=1
diff $JS/src/examples/example-rimurc.rmu $PY/tests/fixtures/example-rimurc.rmu || err=1

cd $JS/src/rimuc/resources
for f in *; do
    diff $f $GO/rimugo/resources/$f || err=1
    diff $f $KT/src/main/resources/org/rimumarkup/$f || err=1
    diff $f $DART/lib/resources/$f || err=1
    diff $f $PY/src/rimuc/resources/$f || err=1
done

if [ $err = 1 ]; then
    exit 1
fi

# Build and test all ports.
cd $JS
jake test

cd $GO
make

cd $KT
./gradlew --console plain test installDist

cd $DART
make

cd $PY
source .venv/bin/activate
make clean build install

# Compile Rimu documentation with all ports and compare.
function start() {
    START_TIME=$(date +%s.%N)
}

function duration() {
    echo $(echo "$(date +%s.%N) - $START_TIME + ${1:-0}" | bc)
}

function seconds() {
    echo $(printf "%.2f seconds" $1)
}

JS_TIME=0
GO_TIME=0
KT_TIME=0
DART_TIME=0
PY_TIME=0

DOC_LINES=$(cat $JS/docs/{reference,tips,changelog}.rmu | wc -l)

for doc in reference tips changelog; do
    ARGS='--no-rimurc --theme legend --custom-toc --header-links --layout sequel --lang en --title "Rimu Reference" --highlightjs --prepend "{generate-examples}='"'yes'"'"  ./src/examples/example-rimurc.rmu ./docs/doc-header.rmu'
    GO_DOC=/tmp/$doc-go.html
    JS_DOC=/tmp/$doc-js.html
    KT_DOC=/tmp/$doc-kt.html
    DART_DOC=/tmp/$doc-dart.html
    PY_DOC=/tmp/$doc-python.html

    cd $JS


    start
    eval node bin/rimuc.js --output $JS_DOC $ARGS ./docs/$doc.rmu
    JS_TIME=$(duration $JS_TIME)

    start
    eval rimugo --output $GO_DOC $ARGS ./docs/$doc.rmu
    GO_TIME=$(duration $GO_TIME)

    start
    eval $KT/build/install/rimu-kt/bin/rimukt --output $KT_DOC $ARGS ./docs/$doc.rmu
    KT_TIME=$(duration $KT_TIME)

    start
    eval $DART/build/rimuc --output $DART_DOC $ARGS ./docs/$doc.rmu
    DART_TIME=$(duration $DART_TIME)

    start
    eval rimupy --output $PY_DOC $ARGS ./docs/$doc.rmu
    PY_TIME=$(duration $PY_TIME)

    diff $JS_DOC $GO_DOC
    diff $JS_DOC $KT_DOC
    diff $JS_DOC $DART_DOC
    diff $JS_DOC $PY_DOC
done

set +x
echo
echo "DOCUMENTATION GENERATION EXECUTION TIMES ($DOC_LINES lines of Rimu markup)"
echo "JavaScript: $(seconds $JS_TIME)"
echo "Go:         $(seconds $GO_TIME)"
echo "Kotlin:     $(seconds $KT_TIME)"
echo "Dart:       $(seconds $DART_TIME)"
echo "Python:     $(seconds $PY_TIME)"