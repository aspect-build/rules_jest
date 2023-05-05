#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# Case 12: generate a coverage report with split coverage postprocessing
bazel coverage //jest/tests:case12 --instrument_test_targets --experimental_split_coverage_postprocessing --experimental_fetch_all_coverage_outputs

COVERAGE_FILE="bazel-testlogs/jest/tests/case12/coverage.dat"

if [ ! -f "$COVERAGE_FILE" ]; then
    echo "Missing coverage file $COVERAGE_FILE"
    exit 1
fi

if ! grep -q "foobar" "$COVERAGE_FILE"; then
    echo "Coverage file does not contain coverage for foobar function"
    exit 1
fi
