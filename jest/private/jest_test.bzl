"Implementation details for jest_test rule"

load("@aspect_rules_js//js:libs.bzl", "js_binary_lib", "js_lib_helpers")
load("@aspect_bazel_lib//lib:paths.bzl", "relative_file")
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
    "sequencer": attr.label(
        allow_single_file = True,
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
        "--testSequencer",
        relative_file(ctx.file.sequencer.short_path, ctx.file.config.short_path),
    ]

    launcher = js_binary_lib.create_launcher(
        ctx,
        log_prefix_rule_set = "aspect_rules_jest",
        log_prefix_rule = "jest_test",
        fixed_args = fixed_args,
    )

    files = js_lib_helpers.gather_files_from_js_providers(
        targets = ctx.attr.data,
        include_transitive_sources = ctx.attr.include_transitive_sources,
        include_declarations = ctx.attr.include_declarations,
        include_npm_linked_packages = ctx.attr.include_npm_linked_packages,
    )
    files.extend(ctx.files.data)
    files.append(ctx.file.sequencer)
    files.append(ctx.file.config)

    runfiles = ctx.runfiles(
        files = files,
    ).merge(launcher.runfiles).merge_all([
        target[DefaultInfo].default_runfiles
        for target in ctx.attr.data
    ])

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
