"Runtime starlark dependencies"

load("//jest/private:maybe.bzl", http_archive = "maybe_http_archive")

def rules_jest_dependencies():
    http_archive(
        name = "bazel_skylib",
        sha256 = "74d544d96f4a5bb630d465ca8bbcfe231e3594e5aae57e1edbf17a6eb3ca2506",
        urls = ["https://github.com/bazelbuild/bazel-skylib/releases/download/1.3.0/bazel-skylib-1.3.0.tar.gz"],
    )

    http_archive(
        name = "aspect_bazel_lib",
        sha256 = "a7bfc7aed7b86a4caaba382116e0214ebbaa623f393a9e716d87a3e1bab29d78",
        strip_prefix = "bazel-lib-1.19.0",
        url = "https://github.com/aspect-build/bazel-lib/archive/refs/tags/v1.19.0.tar.gz",
    )

    http_archive(
        name = "aspect_rules_js",
        sha256 = "eea90eb89681338758a66c8c835224c97745ae5e3d0e1126d51cd09b953e1392",
        strip_prefix = "rules_js-1.13.2",
        url = "https://github.com/aspect-build/rules_js/archive/refs/tags/v1.13.2.tar.gz",
    )

    http_archive(
        name = "rules_nodejs",
        sha256 = "08337d4fffc78f7fe648a93be12ea2fc4e8eb9795a4e6aa48595b66b34555626",
        urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/5.8.0/rules_nodejs-core-5.8.0.tar.gz"],
    )
