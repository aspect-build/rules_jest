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
#
# cov_jest_lib asserts function-level coverage (FNDA) of a js_library dependency,
# and cov_jest_no_config asserts coverage for a jest_test with no `config` attr.

cd "$(dirname "$0")"

# assert_covered <target> <src> [fn]
# Verifies the lcov report is non-empty, records the instrumented source, and
# has at least one executed line. If <fn> is given, also asserts that named
# function was executed (FNDA:1,<fn>).
assert_covered() {
	target="$1"
	src="$2"
	fn="${3:-}"
	dat="bazel-testlogs/${target}/coverage.dat"

	if [ ! -s "$dat" ]; then
		echo "FAIL [$target]: $dat is missing or empty (rules_js #2901)"
		exit 1
	fi
	if ! grep -q "SF:$src" "$dat"; then
		echo "FAIL [$target]: $dat has no coverage record for $src"
		exit 1
	fi
	if ! grep -qE "^DA:[0-9]+,[1-9]" "$dat"; then
		echo "FAIL [$target]: $dat records no executed lines for $src"
		exit 1
	fi
	if [ -n "$fn" ] && ! grep -q "FNDA:1,$fn" "$dat"; then
		echo "FAIL [$target]: $dat records no coverage for function $fn"
		exit 1
	fi
	echo "OK [$target]: $dat"
}

# Each entry is "<target> <src> [fn]".
targets=(
	"cov_jest foo.js"
	"cov_jest_custom_resolver foo.js"
	"cov_jest_pkg_resolver foo.js"
	"cov_jest_cachedir foo.js"
	"cov_jest_subdir_config foo.js"
	"cov_jest_lib bar.js foobar"
	"cov_jest_no_config bar.js"
)

for mode in "inline" "split"; do
	split_flags=""
	if [ "$mode" = "split" ]; then
		split_flags="--experimental_split_coverage_postprocessing --experimental_fetch_all_coverage_outputs"
	fi

	for entry in "${targets[@]}"; do
		# shellcheck disable=SC2086
		set -- $entry
		target="$1"
		echo "----- coverage: $target ($mode post-processing) -----"
		# shellcheck disable=SC2086
		bazel coverage "//:$target" \
			--instrument_test_targets \
			--nocache_test_results \
			$split_flags
		assert_covered "$@"
	done
done
