#!/usr/bin/env bash

set -o errexit -o nounset -o pipefail

# Argument provided by reusable workflow caller, see
# https://github.com/bazel-contrib/.github/blob/d197a6427c5435ac22e56e33340dff912bc9334e/.github/workflows/release_ruleset.yaml#L72
TAG=$1
# The prefix is chosen to match what GitHub generates for source archives
PREFIX="rules_jest-${TAG:1}"
ARCHIVE="rules_jest-$TAG.tar.gz"
git archive --format=tar --prefix=${PREFIX}/ ${TAG} | gzip >$ARCHIVE
SHA=$(shasum -a 256 $ARCHIVE | awk '{print $1}')

cat <<EOF
Add to your \`MODULE.bazel\` file:

\`\`\`starlark
bazel_dep(name = "aspect_rules_jest", version = "${TAG:1}")
\`\`\`
EOF
