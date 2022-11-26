#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

bazel test //:test

echo "failing snapshot" > __snapshots__/link.test.js.snap

if bazel test //:test; then
  echo "ERROR: expected snapshot test to fail!"
  exit 1
fi

diff="$(git diff __snapshots__/link.test.js.snap)"
if [ -z "$diff" ]; then
  echo "ERROR: expected 'git diff __snapshots__/link.test.js.snap' to not be empty"
  exit 1
fi

bazel run //:test_update_snapshots

diff="$(git diff __snapshots__/link.test.js.snap)"
if [ "$diff" ]; then
  echo "ERROR: expected 'git diff __snapshots__/link.test.js.snap' to be empty"
  exit 1
fi

bazel test //:test

echo "All tests passed"
