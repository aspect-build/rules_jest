"Implementation details for jest_test rule"

load("@aspect_rules_js//js:libs.bzl", "js_binary_lib", "js_lib_helpers")
load("@aspect_bazel_lib//lib:paths.bzl", "to_manifest_path", "to_workspace_path")
load("@bazel_skylib//lib:dicts.bzl", "dicts")

_attrs = dicts.add(js_binary_lib.attrs, {
    "auto_configure_reporters": attr.bool(
        doc = """Let jest_test configure reporters for Bazel test and xml test logs.
The `default` reporter is used for the standard test log and jest-junit is used
for the xml log.

Set this to False to use the reporters configured in the jest config file.

jest_test always sets the `JEST_JUNIT_OUTPUT_FILE` env var to point to where Bazel
expects jest to write the xml test log, so if you set `auto_configure_reporters` to False and
configure jest-junit in the jest config file, it will output the junit xml file where Bazel
expects by default.""",
        default = True,
    ),
    "entry_point": attr.label(
        mandatory = True,
    ),
    "config": attr.label(
        doc = "jest config file, see TODO",
        # Supported config file types: https://jestjs.io/docs/configuration
        allow_single_file = [".js", ".cjs", ".mjs", ".json", ".ts"],
        mandatory = True,
    ),
    "jest_repository": attr.string(
        doc = "Name of the repository created with jest_repositories().",
        default = "jest",
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
        _relative_file(ctx, ctx.file.config, ctx.file.sequencer),
    ]

    fixed_env = {}

    if ctx.attr.auto_configure_reporters:
        fixed_args.extend([
            # Use default repoter to write to bazel test log
            "--reporters",
            "default",
            # Add a junit xml reporter for bazel xml test log
            "--reporters",
            _jest_junit_reporter_path(ctx),
        ])

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
    files.append(ctx.file.sequencer)
    files.append(ctx.file.config)

    runfiles = ctx.runfiles(
        files = files,
        transitive_files = js_lib_helpers.gather_files_from_js_providers(
            targets = ctx.attr.data,
            include_transitive_sources = ctx.attr.include_transitive_sources,
            include_declarations = ctx.attr.include_declarations,
            include_npm_linked_packages = ctx.attr.include_npm_linked_packages,
        ),
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

# TODO: relative_file from bazel-lib breaks because it can't tell the difference
# between the package name 'jest' in this repo, and the external repository with
# internal deps names 'jest'. Upstream fix to bazel-lib?
def _relative_file(ctx, from_file, to_file):
    workspace_path = to_workspace_path(from_file)
    path_to_runfiles = "/".join([".."] * len(workspace_path.split("/")))
    return path_to_runfiles + "/" + to_manifest_path(ctx, to_file)

def _jest_junit_reporter_path(ctx):
    # Get the reporter path for jest-junit. Jest resolves reporters relative to the
    # user config file, so we need the relative path from the config to the runfiles
    # location of our internal dep on jest-junit.

    workspace_path = to_workspace_path(ctx.file.config)
    path_to_runfiles_root_from_config = "/".join([".."] * len(workspace_path.split("/")))

    return "{path_to_runfiles_root_from_config}/{jest_repository}/node_modules/jest-junit/index.js".format(
        path_to_runfiles_root_from_config = path_to_runfiles_root_from_config,
        jest_repository = ctx.attr.jest_repository,
    )
