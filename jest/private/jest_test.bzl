"Implementation details for jest_test rule"

load("@aspect_rules_js//js:defs.bzl", "js_binary_lib")
load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_files_to_bin_actions")
load("@bazel_skylib//lib:dicts.bzl", "dicts")

_attrs = dicts.add(js_binary_lib.attrs, {
    "entry_point": attr.label(
        mandatory = True,
    ),
    "config": attr.label(
        doc = "jest config file, see TODO",
        allow_single_file = [".js"],
        mandatory = True,
    ),
})

def _impl(ctx):
    fixed_args = [
        # https://jestjs.io/docs/cli#--cache. Whether to use the cache. Defaults to true. Disable
        # the cache using --no-cache. Caching is Bazel's job, we don't want non-hermeticity
        "--no-cache",
        # https://jestjs.io/docs/cli#--watchman. Whether to use watchman for file crawling. Defaults
        # to true. Disable using --no-watchman. Watching is ibazel's job
        "--no-watchman",
        # https://jestjs.io/docs/cli#--ci. When this option is provided, Jest will assume it is
        # running in a CI environment. This changes the behavior when a new snapshot is encountered.
        # Instead of the regular behavior of storing a new snapshot automatically, it will fail the
        # test and require Jest to be run with --updateSnapshot.
        "--ci",
        # Needed for Jest to walk the filesystem to find inputs.
        # See https://github.com/facebook/jest/pull/9351
        "--haste",
        "{\\\"enableSymlinks\\\":\\ true}",
        # https://jestjs.io/docs/cli#--configpath. The path to a Jest config file specifying how to
        # find and execute tests.
        "--config",
        ctx.file.config.short_path,
    ]
    launcher = js_binary_lib.create_launcher(
        ctx,
        log_prefix_rule_set = "aspect_rules_jest",
        log_prefix_rule = "jest_test",
        fixed_args = fixed_args,
    )
    runfiles = launcher.runfiles.merge(ctx.runfiles(
        files = copy_files_to_bin_actions(ctx, [ctx.file.config] + ctx.files.data),
    ))
    return [
        DefaultInfo(
            executable = launcher.executable,
            runfiles = runfiles,
        ),
    ]

lib = struct(
    attrs = _attrs,
    implementation = _impl,
)
