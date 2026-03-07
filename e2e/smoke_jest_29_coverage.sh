#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# Generate a coverage report with jest 29
cd e2e/smoke_jest_29
bazel coverage //:coverage --instrument_test_targets

COVERAGE_FILE="bazel-testlogs/coverage/coverage.dat"

if [ ! -f "$COVERAGE_FILE" ]; then
	echo "Missing coverage file $COVERAGE_FILE"
	exit 1
fi

if ! grep -q "FNDA:1,foobar" "$COVERAGE_FILE"; then
	echo "Coverage file does not contain coverage for foobar function"
	exit 1
fi
