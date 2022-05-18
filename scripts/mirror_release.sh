#!/usr/bin/env bash
# Produce a dictionary for the current esbuild release,
# suitable for appending to esbuild/private/versions.bzl
set -o errexit -o nounset
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

version="$(curl --silent "https://registry.npmjs.org/jest-cli/latest" | jq --raw-output ".version")"
out="$SCRIPT_DIR/../jest/private/v${version}"
mkdir -p "$out"

cd $(mktemp -d)
npx pnpm install jest-cli --lockfile-only
touch BUILD
cat >WORKSPACE <<EOF
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "aspect_rules_js",
    sha256 = "4b58aab5048a6e95491114a456795fa9eb8b74c887047a953a3f712b19de764d",
    strip_prefix = "rules_js-0.7.0",
    url = "https://github.com/aspect-build/rules_js/archive/refs/tags/v0.7.0.tar.gz",
)

load("@aspect_rules_js//js:repositories.bzl", "rules_js_dependencies")

rules_js_dependencies()

load("@rules_nodejs//nodejs:repositories.bzl", "nodejs_register_toolchains")

nodejs_register_toolchains(
    name = "nodejs",
    node_version = "16.9.0",
)

load("@aspect_rules_js//js:npm_import.bzl", "translate_pnpm_lock")

translate_pnpm_lock(name = "npm", pnpm_lock = "//:pnpm-lock.yaml")
EOF
bazel fetch @npm//:all
cp $(bazel info output_base)/external/npm/{defs,repositories,package}.bzl "$out"
echo "Mirrored jest versior $version to $out. Now add it to jest/private/versions.bzl"
