#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# Jest default is os.tmpdir()/jest_<uid>
TEST_TMPDIR=$(mktemp -d)/jest_test_tmpdir

# Case 13: jest_test uses TEST_TMPDIR
rm -rf "$TEST_TMPDIR"
bazel test //jest/tests:case13 --nocache_test_results --test_tmpdir=$TEST_TMPDIR

# Locate the cache folder under TEST_TMPDIR
JEST_CACHE_NAME="jest_cache"
JEST_CACHE_DIR=$(find "$TEST_TMPDIR" -type d -name "$JEST_CACHE_NAME" -print -quit)

# Check that the cache folder exists
if [ -z "$JEST_CACHE_DIR" ]; then
  echo "Error: '$JEST_CACHE_NAME' folder not found below '$TEST_TMPDIR'"
  exit 1
fi

# Check that the folder was used for the cache
if [ -z "$(ls -A "$JEST_CACHE_DIR")" ]; then
  echo "Error: '$JEST_CACHE_NAME' folder at '$JEST_CACHE_DIR' is empty"
  exit 1
fi
