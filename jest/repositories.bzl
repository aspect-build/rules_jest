"""Declare runtime dependencies

These are needed for local dev, and users must install them as well.
See https://docs.bazel.build/versions/main/skylark/deploying.html#dependencies
"""

load("//jest/private:versions.bzl", "TOOL_VERSIONS")
load("@aspect_rules_js//npm:npm_import.bzl", _npm_translate_lock = "npm_translate_lock")

LATEST_VERSION = TOOL_VERSIONS[0]

def jest_repositories(name, jest_version = LATEST_VERSION):
    """
    Fetch external tools needed for jest

    Args:
        name: Unique name for this jest tools repository
        jest_version: The jest version to fetch.

            See /jest/private/versions.bzl for available versions.
    """
    if jest_version not in TOOL_VERSIONS:
        fail("""\
jest version {} is not currently mirrored into rules_jest.
Please instead choose one of these available versions: {}
Or, make a PR to the repo running /scripts/mirror_release.sh to add the newest version.
If you need custom versions, please file an issue.""".format(jest_version, TOOL_VERSIONS))

    _npm_translate_lock(
        name = name,
        pnpm_lock = "@aspect_rules_jest//jest/private:{version}/pnpm-lock.yaml".format(version = jest_version),
        public_hoist_packages = {
            # Hoist @jest/test-sequencer out of the transitive closure of jest-cli to node_modules/@jest/test-sequencer
            # so it can be required from sequencer.js
            "@jest/test-sequencer": [""],
        },
        # We'll be linking in the @foo repository and not the repository where the pnpm-lock file is located
        link_workspace = name,
        # Override the Bazel package where pnpm-lock.yaml is located and link to the specified package instead
        root_package = "",
        defs_bzl_filename = "npm_link_all_packages.bzl",
        repositories_bzl_filename = "npm_repositories.bzl",
        additional_file_contents = {
            "BUILD.bazel": [
                """load("@aspect_bazel_lib//lib:copy_file.bzl", "copy_file")""",
                """load("@aspect_bazel_lib//lib:directory_path.bzl", "directory_path")""",
                """load("//:npm_link_all_packages.bzl", "npm_link_all_packages")""",
                """npm_link_all_packages(name = "node_modules")""",
                """directory_path(
    name = "jest_entrypoint",
    directory = ":node_modules/jest-cli/dir",
    path = "bin/jest.js",
    visibility = ["//visibility:public"],
)""",
                """copy_file(
    name = "sequencer",
    src = "@aspect_rules_jest//jest/private:sequencer.js",
    out = "sequencer.js",
    visibility = ["//visibility:public"],
)""",
            ],
            "defs.bzl": [
                """load("@aspect_rules_jest//jest:defs.bzl", _jest_test = "jest_test")""",
                """def jest_test(**kwargs):
    _jest_test(jest_repository="{name}", **kwargs)""".format(name = name),
            ],
        },
    )
