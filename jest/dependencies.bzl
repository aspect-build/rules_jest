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
        sha256 = "a185ccff9c1b8589c63f66d7eb908de15c5d6bb05562be5f46336c53e7a7326a",
        strip_prefix = "bazel-lib-2.0.0-rc1",
        url = "https://github.com/aspect-build/bazel-lib/releases/download/v2.0.0-rc1/bazel-lib-v2.0.0-rc1.tar.gz",
    )

    http_archive(
        name = "aspect_rules_js",
        sha256 = "a949d56fed8fa0a8dd82a0a660acc949253a05b2b0c52a07e4034e27f11218f6",
        strip_prefix = "rules_js-1.33.1",
        url = "https://github.com/aspect-build/rules_js/releases/download/v1.33.1/rules_js-v1.33.1.tar.gz",
    )

    http_archive(
        name = "rules_nodejs",
        sha256 = "764a3b3757bb8c3c6a02ba3344731a3d71e558220adcb0cf7e43c9bba2c37ba8",
        urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/5.8.2/rules_nodejs-core-5.8.2.tar.gz"],
    )
