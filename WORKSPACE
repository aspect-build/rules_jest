# Declare the local Bazel workspace.
workspace(name = "aspect_rules_jest")

load(":internal_deps.bzl", "rules_jest_internal_deps")

# Fetch deps needed only locally for development
rules_jest_internal_deps()

load("//jest:dependencies.bzl", "rules_jest_dependencies")

# Fetch dependencies which users need as well
rules_jest_dependencies()

load("@aspect_rules_js//js:toolchains.bzl", "DEFAULT_NODE_VERSION", "rules_js_register_toolchains")

rules_js_register_toolchains(node_version = DEFAULT_NODE_VERSION)

# For running our own unit tests
load("@bazel_skylib//:workspace.bzl", "bazel_skylib_workspace")

bazel_skylib_workspace()

# Test case 4 (see //jest/tests)
local_repository(
    name = "case4",
    path = "e2e/case4",
)

############################################
# Example npm dependencies

load("@aspect_rules_js//npm:repositories.bzl", "npm_translate_lock")

npm_translate_lock(
    name = "npm",
    npmrc = "//:.npmrc",
    pnpm_lock = "//:pnpm-lock.yaml",
    verify_node_modules_ignored = "//:.bazelignore",
)

load("@npm//:repositories.bzl", "npm_repositories")

# Declares npm_import rules from the pnpm-lock.yaml file
npm_repositories()

############################################
# Stardoc
load("@io_bazel_stardoc//:setup.bzl", "stardoc_repositories")

stardoc_repositories()

load("@rules_jvm_external//:repositories.bzl", "rules_jvm_external_deps")

rules_jvm_external_deps()

load("@rules_jvm_external//:setup.bzl", "rules_jvm_external_setup")

rules_jvm_external_setup()

load("@io_bazel_stardoc//:deps.bzl", "stardoc_external_deps")

stardoc_external_deps()

load("@stardoc_maven//:defs.bzl", stardoc_pinned_maven_install = "pinned_maven_install")

stardoc_pinned_maven_install()

# Buildifier
load("@buildifier_prebuilt//:deps.bzl", "buildifier_prebuilt_deps")

buildifier_prebuilt_deps()

load("@buildifier_prebuilt//:defs.bzl", "buildifier_prebuilt_register_toolchains")

buildifier_prebuilt_register_toolchains()

load("@bazel_features//:deps.bzl", "bazel_features_deps")

bazel_features_deps()

# rules_lint
load(
    "@aspect_rules_lint//format:repositories.bzl",
    "rules_lint_dependencies",
)

rules_lint_dependencies()

load("@rules_multitool//multitool:multitool.bzl", "multitool")

multitool(
    name = "multitool",
    lockfiles = [
        "@aspect_rules_lint//format:multitool.lock.json",
        "@aspect_rules_lint//lint:multitool.lock.json",
    ],
)

# rules_shell
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")
http_archive(
    name = "rules_shell",
    sha256 = "e6b87c89bd0b27039e3af2c5da01147452f240f75d505f5b6880874f31036307",
    strip_prefix = "rules_shell-0.6.1",
    url = "https://github.com/bazelbuild/rules_shell/releases/download/v0.6.1/rules_shell-v0.6.1.tar.gz",
)

load("@rules_shell//shell:repositories.bzl", "rules_shell_dependencies", "rules_shell_toolchains")
rules_shell_dependencies()
rules_shell_toolchains()
