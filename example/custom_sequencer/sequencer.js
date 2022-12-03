/**
 * @fileoverview teach Jest to run only the test cases in one shard.
 *
 * This is suggested by a project maintainer:
 * https://github.com/facebook/jest/issues/11252#issuecomment-812877010
 */

const Sequencer = require("@jest/test-sequencer").default;
// see https://docs.bazel.build/versions/main/test-encyclopedia.html#test-sharding
const shardCount = Number(process.env.TEST_TOTAL_SHARDS);
const shardIndex = Number(process.env.TEST_SHARD_INDEX);

class BazelSequencer extends Sequencer {
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
