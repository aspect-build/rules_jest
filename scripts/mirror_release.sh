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
    sha256 = "529a7100fd757d1fe6d39901688b0ae4cfe033b7d432e9c4cfc022f33e3ec7fc",
    strip_prefix = "rules_js-1.0.0-beta.2",
    url = "https://github.com/aspect-build/rules_js/archive/refs/tags/v1.0.0-beta.2.tar.gz",
)

load("@aspect_rules_js//js:repositories.bzl", "rules_js_dependencies")

rules_js_dependencies()

load("@rules_nodejs//nodejs:repositories.bzl", "nodejs_register_toolchains")

nodejs_register_toolchains(
    name = "nodejs",
    node_version = "16.9.0",
)

load("@aspect_rules_js//npm:npm_import.bzl", "npm_translate_lock")

npm_translate_lock(
    name = "npm",
    pnpm_lock = "//:pnpm-lock.yaml",
    public_hoist_packages = {
        # Hoist @jest/test-sequencer out of the transitive closure of jest-cli to node_modules/@jest/test-sequencer
        # so it can be required from sharing.js
        "@jest/test-sequencer": [""],
    },
)

load("@npm//:repositories.bzl", "npm_repositories")

npm_repositories()
EOF
bazel fetch @npm//:all
cp $(bazel info output_base)/external/npm/{defs,repositories}.bzl "$out"
echo "Mirrored jest version $version to $out. Now add it to jest/private/versions.bzl"
