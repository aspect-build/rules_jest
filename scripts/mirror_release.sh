#!/usr/bin/env bash
# Produce a dictionary for the current esbuild release,
# suitable for appending to esbuild/private/versions.bzl
set -o errexit -o nounset
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

version="${1:-$(curl --silent "https://registry.npmjs.org/jest-cli/latest" | jq --raw-output ".version")}"
jest_junit_version="${2:-$(curl --silent "https://registry.npmjs.org/jest-junit/latest" | jq --raw-output ".version")}"
out="$SCRIPT_DIR/../jest/private/v${version}"
mkdir -p "$out"

cd $(mktemp -d)
npx pnpm install "jest-cli@$version" "jest-junit@$jest_junit_version" --lockfile-only

cp pnpm-lock.yaml "$out"
echo "Mirrored jest version $version to $out. Now add it to jest/private/versions.bzl"
