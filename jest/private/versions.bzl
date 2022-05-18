"""Mirror of release info"""

# Run /scripts/mirror_release.sh to produce a new bzl file.
load("v28.1.0/repositories.bzl", v28_1_0 = "npm_repositories")

TOOL_VERSIONS = {
    "v28.1.0": v28_1_0,
}
