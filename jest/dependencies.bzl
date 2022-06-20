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
        urls = ["https://github.com/bazelbuild/bazel-skylib/releases/download/1.1.1/bazel-skylib-1.1.1.tar.gz"],
    )

    maybe(
        http_archive,
        name = "rules_nodejs",
        sha256 = "26766278d815a6e2c43d2f6c9c72fde3fec8729e84138ffa4dabee47edc7702a",
        urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/5.4.2/rules_nodejs-core-5.4.2.tar.gz"],
    )

    maybe(
        http_archive,
        name = "aspect_bazel_lib",
        sha256 = "8860aab705fe9f427fbebe388bdfacf8a6b267cb3c0d71ebeaf1dcceedd29193",
        strip_prefix = "bazel-lib-1.3.0",
        url = "https://github.com/aspect-build/bazel-lib/archive/refs/tags/v1.3.0.tar.gz",
    )

    maybe(
        http_archive,
        name = "aspect_rules_js",
        sha256 = "529a7100fd757d1fe6d39901688b0ae4cfe033b7d432e9c4cfc022f33e3ec7fc",
        strip_prefix = "rules_js-1.0.0-beta.2",
        url = "https://github.com/aspect-build/rules_js/archive/refs/tags/v1.0.0-beta.2.tar.gz",
    )
