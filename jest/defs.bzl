"Public API re-exports"
load("//jest/private:jest_test.bzl", "lib")
load("@aspect_rules_js//js:nodejs_binary.bzl", nodejs_binary_lib = "lib")

_jest_test = rule(
    doc = """FIXME: add documentation""",
    attrs = lib.attrs,
    implementation = lib.implementation,
    test = True,
    toolchains = nodejs_binary_lib.toolchains,
)

def jest_test(**kwargs):
    _jest_test(
        is_windows = select({
            "@bazel_tools//src/conditions:host_windows": True,
            "//conditions:default": False,
        }),
        enable_runfiles = select({
            "@aspect_rules_js//js/private:enable_runfiles": True,
            "//conditions:default": False,
        }),
        data = kwargs.pop("data", []) + ["@jest_cli//jest-cli"],
        **kwargs
    )