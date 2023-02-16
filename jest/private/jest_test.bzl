"Implementation details for jest_test rule"

load("@aspect_rules_js//js:libs.bzl", "js_binary_lib", "js_lib_helpers")
load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_file_to_bin_action")
load("@bazel_skylib//lib:dicts.bzl", "dicts")
load("@bazel_skylib//lib:paths.bzl", "paths")

_attrs = dicts.add(js_binary_lib.attrs, {
    "config": attr.label(allow_single_file = [".js", ".cjs", ".mjs", ".json"]),
    "auto_configure_reporters": attr.bool(default = True),
    "auto_configure_test_sequencer": attr.bool(default = True),
    "jest_repository": attr.string(default = "jest"),
    "run_in_band": attr.bool(default = True),
    "colors": attr.bool(default = True),
    "update_snapshots_mode": attr.string(
        values = ["directory", "files"],
        doc = "Internal use only",
    ),
    "entry_point": attr.label(
        doc = "Internal use only",
        mandatory = True,
    ),
    # Set from jest_test macro in //jest:defs.bzl. Bazel sequencer has to be sourced from the
    # @jest_repository since it depends on :node_modules/@jest/test-sequencer.
    "bazel_sequencer": attr.label(
        doc = "Internal use only",
        allow_single_file = True,
        mandatory = True,
    ),
    # Set from jest_test macro in //jest:defs.bzl for consistency with sequencer & resolver and so that
    # a copy of the Bazel snapshot reporter doesn't have to be made with ctx.actions.expand_template.
    "bazel_snapshot_reporter": attr.label(
        doc = "Internal use only",
        allow_single_file = True,
        mandatory = True,
    ),
    # Set from jest_test macro in //jest:defs.bzl. Bazel snapshot resolver has to be sourced from the
    # @jest_repository since it depends on :node_modules/jest-snapshot.
    "bazel_snapshot_resolver": attr.label(
        doc = "Internal use only",
        allow_single_file = True,
        mandatory = True,
    ),
    "_jest_config_template": attr.label(
        doc = "Internal use only",
        allow_single_file = True,
        default = Label("//jest/private:jest_config_template.mjs"),
    ),
    # Earlier versions of Bazel expect this attribute to be present.
    # https://github.com/bazelbuild/bazel/issues/13978
    # We use a no-op because jest itself generates the coverage.
    "_lcov_merger": attr.label(
        executable = True,
        default = Label("//jest/private:noop"),
        cfg = "exec",
    ),
})

def _impl(ctx):
    providers = []
    generated_config = ctx.actions.declare_file("%s__jest.config.mjs" % ctx.label.name)
    user_config = copy_file_to_bin_action(ctx, ctx.file.config) if ctx.attr.config else None

    ctx.actions.expand_template(
        template = ctx.file._jest_config_template,
        output = generated_config,
        substitutions = {
            "{{AUTO_CONF_REPORTERS}}": "1" if ctx.attr.auto_configure_reporters else "",
            "{{AUTO_CONF_TEST_SEQUENCER}}": "1" if ctx.attr.auto_configure_test_sequencer else "",
            "{{BAZEL_SEQUENCER_SHORT_PATH}}": ctx.file.bazel_sequencer.short_path,
            "{{BAZEL_SNAPSHOT_REPORTER_SHORT_PATH}}": ctx.file.bazel_snapshot_reporter.short_path,
            "{{BAZEL_SNAPSHOT_RESOLVER_SHORT_PATH}}": ctx.file.bazel_snapshot_resolver.short_path,
            "{{COVERAGE_ENABLED}}": "1" if ctx.coverage_instrumented() else "",
            "{{GENERATED_CONFIG_SHORT_PATH}}": generated_config.short_path,
            "{{JUNIT_REPORTER_SHORT_PATH}}": "../{jest_repository}/node_modules/jest-junit/index.js".format(jest_repository = ctx.attr.jest_repository),
            "{{USER_CONFIG_SHORT_PATH}}": user_config.short_path if user_config else "",
            "{{USER_CONFIG_PATH}}": user_config.path if user_config else "",
        },
    )

    # Unwind the chdir argument to adapt the path arguments
    unwind_chdir_prefix = ""
    if ctx.attr.chdir:
        unwind_chdir_prefix = "/".join([".."] * len(ctx.attr.chdir.split("/"))) + "/"

    fixed_args = [
        # https://jestjs.io/docs/cli#--cache. Whether to use the cache. Defaults to true. Disable
        # the cache using --no-cache. Caching is Bazel's job, we don't want non-hermeticity
        "--no-cache",
        # https://jestjs.io/docs/cli#--ci. When this option is provided, Jest will assume it is
        # running in a CI environment. This changes the behavior when a new snapshot is encountered.
        # Instead of the regular behavior of storing a new snapshot automatically, it will fail the
        # test and require Jest to be run with --updateSnapshot.
        "--ci",
        # https://jestjs.io/docs/cli#--configpath. The path to a Jest config file specifying how to
        # find and execute tests.
        "--config",
        paths.join(unwind_chdir_prefix, generated_config.short_path),
    ]
    if ctx.attr.log_level == "debug":
        fixed_args.append("--debug")
    if ctx.attr.colors:
        fixed_args.append("--colors")
    if ctx.attr.run_in_band:
        fixed_args.append("--runInBand")
    if ctx.attr.update_snapshots_mode:
        fixed_args.append("--updateSnapshot")

    fixed_env = {}
    if ctx.attr.update_snapshots_mode:
        fixed_env["JEST_TEST__UPDATE_SNAPSHOTS_MODE"] = ctx.attr.update_snapshots_mode
    else:
        # jest-junit lets you declare the output file in the env var JEST_JUNIT_OUTPUT_FILE
        # as an alternative to declaring it in the jest config file.
        # (see https://github.com/jest-community/jest-junit#configuration)
        # Always set this even if auto_configure_reporters is False because it could be
        # useful if the user configures jest-junit themselves.
        fixed_env["JEST_JUNIT_OUTPUT_FILE"] = "$$XML_OUTPUT_FILE"

    launcher = js_binary_lib.create_launcher(
        ctx,
        log_prefix_rule_set = "aspect_rules_jest",
        log_prefix_rule = "jest_test",
        fixed_args = fixed_args,
        fixed_env = fixed_env,
    )

    files = ctx.files.data[:]
    if user_config:
        files.append(user_config)
    files.append(generated_config)
    files.append(ctx.file.bazel_sequencer)
    files.append(ctx.file.bazel_snapshot_reporter)
    files.append(ctx.file.bazel_snapshot_resolver)

    runfiles = ctx.runfiles(
        files = files,
        transitive_files = js_lib_helpers.gather_files_from_js_providers(
            targets = ctx.attr.data + [ctx.attr.config] if ctx.attr.config else [],
            include_transitive_sources = ctx.attr.include_transitive_sources,
            include_declarations = ctx.attr.include_declarations,
            include_npm_linked_packages = ctx.attr.include_npm_linked_packages,
        ),
    ).merge(launcher.runfiles).merge_all([
        target[DefaultInfo].default_runfiles
        for target in ctx.attr.data
    ])

    if ctx.attr.config and ctx.attr.config[DefaultInfo]:
        runfiles = runfiles.merge(ctx.attr.config[DefaultInfo].default_runfiles)

    if ctx.configuration.coverage_enabled:
        providers.append(
            coverage_common.instrumented_files_info(
                ctx,
                source_attributes = ["data"],
                extensions = [
                    "cjs",
                    "cjx",
                    "cts",
                    "ctx",
                    "js",
                    "jsx",
                    "mjs",
                    "mjx",
                    "mts",
                    "mtx",
                    "ts",
                    "tsx",
                ],
            ),
        )

    providers.append(
        DefaultInfo(
            executable = launcher.executable,
            runfiles = runfiles,
        ),
    )

    return providers

lib = struct(
    attrs = _attrs,
    implementation = _impl,
)
