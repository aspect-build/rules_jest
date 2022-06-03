#!/usr/bin/env bash
# Produce a dictionary for the current esbuild release,
# suitable for appending to esbuild/private/versions.bzl
set -o errexit -o nounset
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

version="${1:-$(curl --silent "https://registry.npmjs.org/jest-cli/latest" | jq --raw-output ".version")}"
out="$SCRIPT_DIR/../jest/private/v${version}"
mkdir -p "$out"

cd $(mktemp -d)
npx pnpm install "jest-cli@$version" --lockfile-only
touch BUILD
cat >WORKSPACE <<EOF
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "aspect_rules_js",
    sha256 = "f4693a937c5852e660d1da773436fc3dc3a6274b25f735c233a8cffc12ed2dbb",
    strip_prefix = "rules_js-0.11.0",
    url = "https://github.com/aspect-build/rules_js/archive/refs/tags/v0.11.0.tar.gz",
)

load("@aspect_rules_js//js:repositories.bzl", "rules_js_dependencies")

rules_js_dependencies()

load("@rules_nodejs//nodejs:repositories.bzl", "nodejs_register_toolchains")

nodejs_register_toolchains(
    name = "nodejs",
    node_version = "16.9.0",
)

load("@aspect_rules_js//npm:npm_import.bzl", "npm_translate_lock")

npm_translate_lock(name = "npm", pnpm_lock = "//:pnpm-lock.yaml")

load("@npm//:repositories.bzl", "npm_repositories")

npm_repositories()
EOF
bazel fetch @npm//:all
cp $(bazel info output_base)/external/npm/{defs,repositories}.bzl "$out"
echo "Mirrored jest version $version to $out. Now add it to jest/private/versions.bzl"
