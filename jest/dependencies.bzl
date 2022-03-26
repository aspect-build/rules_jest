"Runtime starlark dependencies"

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")
load("@bazel_tools//tools/build_defs/repo:utils.bzl", "maybe")

# WARNING: any changes in this function may be BREAKING CHANGES for users
# because we'll fetch a dependency which may be different from one that
# they were previously fetching later in their WORKSPACE setup, and now
# ours took precedence. Such breakages are challenging for users, so any
# changes in this function should be marked as BREAKING in the commit message
# and released only in semver majors.
def rules_jest_dependencies():
    # The minimal version of bazel_skylib we require
    maybe(
        http_archive,
        name = "bazel_skylib",
        sha256 = "c6966ec828da198c5d9adbaa94c05e3a1c7f21bd012a0b29ba8ddbccb2c93b0d",
        urls = [
            "https://github.com/bazelbuild/bazel-skylib/releases/download/1.1.1/bazel-skylib-1.1.1.tar.gz",
            "https://mirror.bazel.build/github.com/bazelbuild/bazel-skylib/releases/download/1.1.1/bazel-skylib-1.1.1.tar.gz",
        ],
    )

    maybe(
        http_archive,
        name = "rules_nodejs",
        sha256 = "03b542b22a95c4b6591630f3f6b176294033e190e08e044bdb23883693702b6b",
        urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/5.1.0/rules_nodejs-core-5.1.0.tar.gz"],
    )

    maybe(
        http_archive,
        name = "aspect_bazel_lib",
        sha256 = "ca5ae17c88cf7235e720ac97b2f5b0509a02eacfc43f6f6dd4c831dacbe197c6",
        strip_prefix = "bazel-lib-0.4.3",
        url = "https://github.com/aspect-build/bazel-lib/archive/refs/tags/v0.4.3.tar.gz",
    )

    maybe(
        http_archive,
        name = "aspect_rules_js",
        # Using HEAD to pick up https://github.com/aspect-build/rules_js/pull/22
        sha256 = "33d5164c2555e629ff594beaae10dc714876c85a1e0907671cadaa63e22c8486",
        strip_prefix = "rules_js-cbbbd46572f7210d5cf8d13794e3acca5bec3da1",
        url = "https://github.com/aspect-build/rules_js/archive/cbbbd46572f7210d5cf8d13794e3acca5bec3da1.tar.gz",
    )
