#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# Regression test for rules_js #2901 on jest_test coverage.
#
# `bazel coverage` must produce a non-empty lcov report for a jest_test, both in
# the default (inline) mode and when the lcov merger runs as a *separate action*
# (`--experimental_split_coverage_postprocessing`, or remote execution). On jest
# 30 the report came back empty because jest's resolver moved instrumented
# sources outside its rootDir (the runfiles tree).
#
# cov_jest_custom_resolver additionally covers the case where the user supplies
# their own jest `resolver`, which rules_jest must compose the fix on top of.

cd "$(dirname "$0")"

assert_covered() {
	target="$1"
	dat="bazel-testlogs/${target}/coverage.dat"

	if [ ! -s "$dat" ]; then
		echo "FAIL [$target]: $dat is missing or empty (rules_js #2901)"
		exit 1
	fi
	if ! grep -q "SF:foo.js" "$dat"; then
		echo "FAIL [$target]: $dat has no coverage record for foo.js"
		exit 1
	fi
	if ! grep -q "DA:1,1" "$dat"; then
		echo "FAIL [$target]: $dat records no executed lines for foo.js"
		exit 1
	fi
	echo "OK [$target]: $dat"
}

for mode in "inline" "split"; do
	split_flag=""
	if [ "$mode" = "split" ]; then
		split_flag="--experimental_split_coverage_postprocessing"
	fi

	for target in cov_jest cov_jest_custom_resolver cov_jest_pkg_resolver cov_jest_cachedir; do
		echo "----- coverage: $target ($mode post-processing) -----"
		bazel coverage "//:$target" \
			--instrument_test_targets \
			--nocache_test_results \
			$split_flag
		assert_covered "$target"
	done
done
