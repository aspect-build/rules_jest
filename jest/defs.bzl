"""# Public API for Jest rules
"""

load("@aspect_bazel_lib//lib:write_source_files.bzl", _write_source_files = "write_source_files")
load("@aspect_bazel_lib//lib:utils.bzl", "to_label")
load("@aspect_rules_js//js:defs.bzl", _js_run_binary = "js_run_binary")
load("@aspect_rules_js//js:libs.bzl", "js_binary_lib")
load("//jest/private:jest_test.bzl", "lib")

_jest_test = rule(
    attrs = lib.attrs,
    implementation = lib.implementation,
    test = True,
    toolchains = js_binary_lib.toolchains,
)

_jest_update_snapshots = rule(
    attrs = lib.attrs,
    implementation = lib.implementation,
    executable = True,
    toolchains = js_binary_lib.toolchains,
)

GENERATED_SNAPSHOT_SUFFIX = "-generated"

def _jest_rule_with_repository_args(jest_rule, jest_repository, **kwargs):
    jest_rule(
        enable_runfiles = select({
            "@aspect_rules_js//js/private:enable_runfiles": True,
            "//conditions:default": False,
        }),
        entry_point = "@{}//:jest_entrypoint".format(jest_repository),
        bazel_sequencer = "@{}//:bazel_sequencer".format(jest_repository),
        bazel_snapshot_reporter = "@{}//:bazel_snapshot_reporter".format(jest_repository),
        bazel_snapshot_resolver = "@{}//:bazel_snapshot_resolver".format(jest_repository),
        data = kwargs.pop("data", []) + [
            "@{}//:node_modules/@jest/test-sequencer".format(jest_repository),
            "@{}//:node_modules/jest-cli".format(jest_repository),
            "@{}//:node_modules/jest-junit".format(jest_repository),
            "@{}//:node_modules/jest-snapshot".format(jest_repository),
        ],
        jest_repository = jest_repository,
        **kwargs
    )

def jest_test(
        name,
        config = None,
        data = [],
        snapshots = [],
        run_in_band = True,
        colors = True,
        auto_configure_reporters = True,
        auto_configure_test_sequencer = True,
        snapshot_ext = ".snap",
        jest_repository = "jest",
        **kwargs):
    """jest_test rule

    Supports Bazel sharding. See https://docs.bazel.build/versions/main/test-encyclopedia.html#test-sharding.

    Supports updating snapshots with `bazel run {name}_update_snapshots` if `snapshots` are specified.

    Args:
        name: A unique name for this target.

        config: "Optional Jest config file. See https://jestjs.io/docs/configuration.

            Supported config file types are ".js", ".cjs", ".mjs", ".json" which come from https://jestjs.io/docs/configuration
            minus TypeScript since we this rule extends from the configuration. TypeScript jest configs should be transpiled
            before being passed to jest_test with [rules_ts](https://github.com/aspect-build/rules_ts).

        data: Runtime dependencies of the Jest test.

            This should include all test files, configuration files & files under test.

        snapshots: A list of snapshot files expected to be generated and checked by this jest_test target. Must be source files.

            If snapshots are specified, a `{name}_update_snapshots` binary target is generated that will update the snapshots
            when `bazel run`. This is the equivalent to running `jest -u` or `jest --updateSnapshot` outside of Bazel.

        run_in_band: When True, the `--runInBand` argument is passed to the Jest CLI so that all tests are run serially
            in the current process, rather than creating a worker pool of child processes that run tests. See
            https://jestjs.io/docs/cli#--runinband for more info.

            This is the desired default behavior under Bazel since Bazel expect each test process to use up one CPU core.
            To parallelize a single jest_test across many cores, use `shard_count` instead which is supported by `jest_test`.
            See https://docs.bazel.build/versions/main/test-encyclopedia.html#test-sharding.

        colors: When True, the `--colors` argument is passed to the Jest CLI. See https://jestjs.io/docs/cli#--colors.

        auto_configure_reporters: Let jest_test configure reporters for Bazel test and xml test logs.

            The `default` reporter is used for the standard test log and `jest-junit` is used for the xml log.
            These reporters are appended to the list of reporters from the user Jest `config` only if they are
            not already set.

            The `JEST_JUNIT_OUTPUT_FILE` environment variable is always set to where Bazel expects a test runner
            to write its xml test log so that if `jest-junit` is configured in the user Jest `config` it will output
            the junit xml file where Bazel expects by default.

        auto_configure_test_sequencer: Let jest_test configure a custom test sequencer for Bazel test that support Bazel sharding.

            Any custom testSequencer value in a user Jest `config` will be overridden.

            See https://jestjs.io/docs/configuration#testsequencer-string for more information on Jest testSequencer config option.

        snapshot_ext: The expected extensions for snapshot files. Defaults to `.snap`, the Jest default.

        jest_repository: Name of the repository created with jest_repositories().

        **kwargs: All other args from `js_test`. See https://github.com/aspect-build/rules_js/blob/main/docs/js_binary.md#js_test
    """
    tags = kwargs.pop("tags", [])

    # This is the primary {name} jest_test test target
    _jest_rule_with_repository_args(
        jest_rule = _jest_test,
        jest_repository = jest_repository,
        name = name,
        config = config,
        data = data + snapshots,
        run_in_band = run_in_band,
        colors = colors,
        auto_configure_reporters = auto_configure_reporters,
        auto_configure_test_sequencer = auto_configure_test_sequencer,
        tags = tags,
        **kwargs
    )

    if len(snapshots) > 0:
        gen_snapshots_bin = "{}_gen_snapshots_bin".format(name)

        # This is the generated reference snapshot generator binary target that is used as the
        # `tool` in the `js_run_binary` target below to output the reference snapshots.
        _jest_rule_with_repository_args(
            jest_rule = _jest_update_snapshots,
            jest_repository = jest_repository,
            name = gen_snapshots_bin,
            config = config,
            data = data,
            run_in_band = run_in_band,
            colors = colors,
            auto_configure_reporters = auto_configure_reporters,
            auto_configure_test_sequencer = auto_configure_test_sequencer,
            update_snapshots = True,
            # Tagged manual so it is not built unless the {name}_update_snapshot target is run
            tags = tags + ["manual"],
            **kwargs
        )

        generated_snapshots = []
        update_snapshots_files = {}
        for snapshot in snapshots:
            snapshot_label = to_label(snapshot)
            if snapshot_label.package != native.package_name():
                msg = "Expected jest_test '{target}' snapshots to be in test target package '{jest_test_package}' but got '{snapshot}' in package '{snapshot_package}'".format(
                    jest_test_package = native.package_name(),
                    snapshot = snapshot_label,
                    snapshot_package = snapshot_label.package,
                    target = to_label(name),
                )
                fail(msg)
            if not snapshot_label.name.endswith(snapshot_ext):
                msg = "Expected jest_test '{target}' snapshots to be labels to source files ending with extension '{snapshot_ext}' but got '{snapshot}'".format(
                    snapshot = snapshot_label,
                    snapshot_ext = snapshot_ext,
                    target = to_label(name),
                )
                fail(msg)

            generated_snapshot = "{}{}".format(snapshot, GENERATED_SNAPSHOT_SUFFIX)
            generated_snapshots = generated_snapshot
            update_snapshots_files[snapshot] = generated_snapshot

        # This is build target that builds reference snapshots for the write_source_files snapshot
        # updater target below. Generated reference snapshots have a GENERATED_SNAPSHOT_SUFFIX
        # suffix so they the write_source_files target below is able to specify both the source file
        # snapshots (in `snapshots`) and the generated reference snapshots by label.
        _js_run_binary(
            name = "{}_gen_snapshots".format(name),
            outs = [generated_snapshots],
            tool = gen_snapshots_bin,
            # Tagged manual so it is not built unless the {name}_update_snapshot target is run
            tags = tags + ["manual"],
        )

        # This creates the snapshot update binary target: {name}_update_snapshots
        _write_source_files(
            name = "{}_update_snapshots".format(name),
            files = update_snapshots_files,
            # jest will already do a diff test on the snapshots; we just use write_source_files
            # for the update script
            diff_test = False,
            # Tagged manual so it is not built unless run
            tags = tags + ["manual"],
        )
