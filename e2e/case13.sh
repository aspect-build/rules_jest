#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# Jest default is os.tmpdir()/jest_<uid>
TEST_TMPDIR=$(mktemp -d)/jest_test_tmpdir

# Case 13: jest_test uses TEST_TMPDIR
rm -rf $TEST_TMPDIR
bazel test //jest/tests:case13 --nocache_test_results --test_tmpdir=$TEST_TMPDIR

# Check if TEST_TMPDIR was utilized by the test action
if [ ! -d "$TEST_TMPDIR" ] || [ -z "$(ls -A "$TEST_TMPDIR")" ]; then
  echo "Error: test_tmpdir '$TEST_TMPDIR' does not exist or is empty"
  exit 1
fi
