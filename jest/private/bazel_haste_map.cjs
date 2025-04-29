const { join, dirname, extname } = require("path");
const { readFileSync } = require("fs");

// to require jest-haste-map we need to hop from jest-cli => @jest/core => jest-haste-map in the virtual store
const jestCliPackage = dirname(require.resolve("jest-cli/package.json"));
const jestConfigPackage = dirname(
  require.resolve(join(jestCliPackage, "../@jest/core/package.json")),
);
const HasteMap = require(
  join(jestConfigPackage, "../../jest-haste-map"),
).default;
const fastPath = require(
  join(jestConfigPackage, "../../jest-haste-map/build/lib/fast_path.js"),
);

// The path to the rules_jest files list file
const WORKSPACE_RUNFILES = join(
  process.env.TEST_SRCDIR,
  process.env.TEST_WORKSPACE,
);
const BAZEL_FILELIST_JSON_FULL_PATH = process.env.BAZEL_FILELIST_JSON_FULL_PATH;

/**
 * Extend the standard jest HasteMap to use rules_jest
 */
module.exports = class BazelHasteMap extends HasteMap {
  constructor(options) {
    super({
      // Override some default HasteMap options.
      // These are HasteMap.Options, not Config.Options.haste
      dependencyExtractor: null,
      computeDependencies: false,
      resetCache: true,

      ...options,
    });

    // Override the jest HasteMap._crawl() to not invoke `find` or `fs.*`
    this._crawl = this.bazelCrawl.bind(this);

    // Override & remove the HastMap._persist() method to disable persisting the cache due to:
    // - when `config.cacheDirectory` is not persisted across jest_test invocations caching is ineffective
    // - when extending `HasteMap` the `BazelHasteMap` construction does not invoke the standard `HasteMap` factory
    //   logic including `await HasteMap.setupCachePath()` which is required for `._persist()` to work.
    this._persist = function bazelNoopPersist() {};
  }

  /**
   * A rules_jest replacement for the standard jest `crawl` function.
   *
   * Modified to:
   *  - use the rules_jest replacement for `find` to avoid walking the filesystem
   *  - disable or skip all jest caching that is not applicable in bazel
   *  - assume rules_jest did all directory+symlink filtering to avoid stat() calls
   *
   * See https://github.com/jestjs/jest/blob/v29.7.0/packages/jest-haste-map/src/index.ts#L760-L773
   */
  async bazelCrawl(hasteMap /*: InternalHasteMap*/) {
    const ignore = this._ignore.bind(this);
    const { extensions, rootDir, enableSymlinks, roots } = this._options;

    return new Promise(function bazelCrawlExecutor(resolve) {
      function findComplete(files) {
        const filesMap = new Map();
        for (const file of files) {
          const relativeFilePath = fastPath.relative(rootDir, file);
          filesMap.set(relativeFilePath, [
            "", // ID
            0, // MTIME
            0, // SIZE
            0, // VISITED
            "", // DEPENDENCIES
            null, // SHA1 (disabled by default by rules_jest)
          ]);
        }
        hasteMap.files = filesMap;

        resolve({
          hasteMap: hasteMap,
          removedFiles: new Map(),
        });
      }

      find(roots, extensions, ignore, enableSymlinks, findComplete);
    });
  }
};

/**
 * A rules_jest replacement for standard jest fs `find` function.
 *
 * Differences from standard `find`:
 *  - all fs info read from the BAZEL_FILELIST_JSON_FULL_PATH file outputted by the jest rule, no fs operations/traversal
 *
 * See: https://github.com/jestjs/jest/blob/v29.7.0/packages/jest-haste-map/src/crawlers/node.ts#L59-L131
 */
function find(roots, extensions, ignore, enableSymlinks, callback) {
  const files = JSON.parse(
    readFileSync(BAZEL_FILELIST_JSON_FULL_PATH, { encoding: "utf8" }),
  );

  // TODO: exclude those not in `roots`?

  const result = [];

  for (const file of files) {
    const ext = extname(file).slice(1);
    if (!extensions.includes(ext)) {
      continue;
    }

    const f = join(WORKSPACE_RUNFILES, file);
    if (ignore(f)) {
      continue;
    }

    result.push(f);
  }

  callback(result);
}
