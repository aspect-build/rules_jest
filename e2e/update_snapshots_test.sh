#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

function update_snapshot_e2e_test {
	local snapshot_file=$1
	local test_target=$2

	bazel test "$test_target"

	echo "failing snapshot" >"$snapshot_file"

	if bazel test "$test_target"; then
		echo "ERROR: expected snapshot test to fail!"
		exit 1
	fi

	local diff="$(git diff "$snapshot_file")"
	if [ -z "$diff" ]; then
		echo "ERROR: expected 'git diff $snapshot_file' to not be empty"
		exit 1
	fi

	bazel run "${test_target}_update_snapshots"

	diff="$(git diff "$snapshot_file")"
	if [ "$diff" ]; then
		echo "ERROR: expected 'git diff $snapshot_file' to be empty"
		exit 1
	fi

	bazel test "$test_target"
}

update_snapshot_e2e_test example/snapshots/__snapshots__/link.test.js.snap //example/snapshots:test
update_snapshot_e2e_test example/snapshots_files/__snapshots__/link.test.js.snap //example/snapshots_files:test
update_snapshot_e2e_test example/custom_snapshot_resolver/__my_snapshots__/link.test.js.snap //example/custom_snapshot_resolver:test
update_snapshot_e2e_test example/custom_snapshot_resolver_files/link.test.js.snap //example/custom_snapshot_resolver_files:test
update_snapshot_e2e_test jest/tests/package_json_module/__snapshots__/link.test.js.snap //jest/tests/package_json_module:test
update_snapshot_e2e_test jest/tests/case10/__snapshots__/case10.test.js.snap //jest/tests:case10
update_snapshot_e2e_test jest/tests/case10/__snapshots__/case10.test.js.snap //jest/tests:case10a

echo "All tests passed"
