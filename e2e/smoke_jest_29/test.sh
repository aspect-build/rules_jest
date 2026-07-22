#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# Coverage regression test for jest <30 (rules_js #2901): the jest >=30 coverage
# fix must not regress jest 29, which never had the symlink/rootDir problem.
cd "$(dirname "$0")"

bazel coverage //:coverage --instrument_test_targets

COVERAGE_FILE="bazel-testlogs/coverage/coverage.dat"

if [ ! -s "$COVERAGE_FILE" ]; then
	echo "Missing or empty coverage file $COVERAGE_FILE"
	exit 1
fi

if ! grep -q "FNDA:1,foobar" "$COVERAGE_FILE"; then
	echo "Coverage file does not contain coverage for foobar function"
	exit 1
fi
