/**
 * @fileoverview teach Jest to run only the test cases in one shard.
 *
 * This is suggested by a project maintainer:
 * https://github.com/facebook/jest/issues/11252#issuecomment-812877010
 */

const fs = require("fs");
const path = require("path");

// to require @jest/test-sequencer we need to hop from jest-cli => jest-config => @jest/test-sequencer in the virtual store
const jestCliPackage = path.dirname(require.resolve("jest-cli/package.json"));
const jestConfigPackage = path.dirname(
  require.resolve(path.join(jestCliPackage, "../jest-config/package.json"))
);
const Sequencer = require(path.join(
  jestConfigPackage,
  "../@jest/test-sequencer"
)).default;

// see https://docs.bazel.build/versions/main/test-encyclopedia.html#test-sharding
const shardCount = Number(process.env.TEST_TOTAL_SHARDS);
const shardIndex = Number(process.env.TEST_SHARD_INDEX);
const shardStatusFile = process.env.TEST_SHARD_STATUS_FILE;

class BazelSequencer extends Sequencer {
  constructor() {
    super();
    // Sharding protocol:
    // Tell Bazel that this test runner supports sharding by updating the last modified date of the
    // magic file
    if (shardCount) {
      fs.open(shardStatusFile, "w", (err, fd) => {
        if (err) throw err;
        fs.close(fd, (err) => {
          if (err) throw err;
        });
      });
    }
  }

  sort(tests) {
    if (!shardCount) return tests;

    const minIndex = (tests.length * shardIndex) / shardCount;
    const maxIndex = (tests.length * (shardIndex + 1)) / shardCount;

    return Array.from(tests)
      .sort((testA, testB) => (testA.path > testB.path ? 1 : -1))
      .slice(minIndex, maxIndex);
  }
}

module.exports = BazelSequencer;
