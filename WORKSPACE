# Declare the local Bazel workspace.
workspace(name = "aspect_rules_jest")

load(":internal_deps.bzl", "rules_jest_internal_deps")

# Fetch deps needed only locally for development
rules_jest_internal_deps()

load("//jest:dependencies.bzl", "rules_jest_dependencies")

# Fetch dependencies which users need as well
rules_jest_dependencies()

load("@rules_nodejs//nodejs:repositories.bzl", "nodejs_register_toolchains")

nodejs_register_toolchains(
    name = "node16",
    node_version = "16.9.0",
)

load("//jest:repositories.bzl", "jest_register_toolchains")

jest_register_toolchains(
    name = "jest",
    jest_version = "1.14.2",
)

# For running our own unit tests
load("@bazel_skylib//:workspace.bzl", "bazel_skylib_workspace")

bazel_skylib_workspace()

############################################
# Gazelle, for generating bzl_library targets
load("@io_bazel_rules_go//go:deps.bzl", "go_register_toolchains", "go_rules_dependencies")
load("@bazel_gazelle//:deps.bzl", "gazelle_dependencies")

go_rules_dependencies()

go_register_toolchains(version = "1.17.2")

gazelle_dependencies()
