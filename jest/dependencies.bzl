"Runtime starlark dependencies"

load("//jest/private:maybe.bzl", http_archive = "maybe_http_archive")

def rules_jest_dependencies():
    http_archive(
        name = "bazel_skylib",
        sha256 = "b8a1527901774180afc798aeb28c4634bdccf19c4d98e7bdd1ce79d1fe9aaad7",
        urls = ["https://github.com/bazelbuild/bazel-skylib/releases/download/1.4.1/bazel-skylib-1.4.1.tar.gz"],
    )

    http_archive(
        name = "aspect_bazel_lib",
        sha256 = "97fa63d95cc9af006c4c7b2123ddd2a91fb8d273012f17648e6423bae2c69470",
        strip_prefix = "bazel-lib-1.30.2",
        url = "https://github.com/aspect-build/bazel-lib/releases/download/v1.30.2/bazel-lib-v1.30.2.tar.gz",
    )

    http_archive(
        name = "aspect_rules_js",
        sha256 = "dcd1567d4a93a8634ec0b888b371a60b93c18d980f77dace02eb176531a71fcf",
        strip_prefix = "rules_js-1.26.0",
        url = "https://github.com/aspect-build/rules_js/releases/download/v1.26.0/rules_js-v1.26.0.tar.gz",
    )

    http_archive(
        name = "rules_nodejs",
        sha256 = "764a3b3757bb8c3c6a02ba3344731a3d71e558220adcb0cf7e43c9bba2c37ba8",
        urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/5.8.2/rules_nodejs-core-5.8.2.tar.gz"],
    )
