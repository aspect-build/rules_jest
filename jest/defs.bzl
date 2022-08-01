"Public API re-exports"

load("//jest/private:jest_test.bzl", "lib")
load("@aspect_rules_js//js:libs.bzl", "js_binary_lib")

_jest_test = rule(
    doc = """FIXME: add documentation""",
    attrs = lib.attrs,
    implementation = lib.implementation,
    test = True,
    toolchains = js_binary_lib.toolchains,
)

def jest_test(jest_repository = "jest", **kwargs):
    _jest_test(
        enable_runfiles = select({
            "@aspect_rules_js//js/private:enable_runfiles": True,
            "//conditions:default": False,
        }),
        entry_point = "@{}//:jest_entrypoint".format(jest_repository),
        sequencer = "@{}//:sequencer".format(jest_repository),
        data = kwargs.pop("data", []) + [
            "@{}//:node_modules/jest-cli".format(jest_repository),
            "@{}//:node_modules/@jest/test-sequencer".format(jest_repository),
        ],
        **kwargs
    )
