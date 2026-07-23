/**
 * Template for the wrapper Jest config written by the `jest_test` rule.
 *
 * `{{...}}` placeholders are substituted by Bazel via `ctx.actions.expand_template`
 * (see `jest_test.bzl`). The wrapper exports an async factory rather than a
 * top-level-awaited config object: that keeps the `.mjs` loadable under both Jest's
 * `import()` path and Node 22.12+'s `require(esm)` path, which would otherwise fail
 * with `ERR_REQUIRE_ASYNC_MODULE` on any top-level `await`.
 *
 * Side effects that must run before Jest forks workers (env vars, warnings) sit at
 * module scope; everything that mutates the config object lives inside the factory.
 */
import { existsSync, writeFileSync } from "fs";
import { createRequire } from "module";
import * as path from "path";

const updateSnapshots = !!process.env.JEST_TEST__UPDATE_SNAPSHOTS;
const coverageEnabled = !!process.env.COVERAGE_DIR;
const autoConfReporting = !!"{{AUTO_CONF_REPORTING}}";
const autoConfReporters = !!"{{AUTO_CONF_REPORTERS}}";
const autoConfTestSequencer = !!"{{AUTO_CONF_TEST_SEQUENCER}}";
const userConfigShortPath = "{{USER_CONFIG_SHORT_PATH}}";
const userConfigPath = "{{USER_CONFIG_PATH}}";
const rootDirShortPath = "{{ROOT_DIR_SHORT_PATH}}";
const packageShortPath = "{{PACKAGE_SHORT_PATH}}";

function _resolveRunfilesPath(rootpath) {
  return path.join(
    process.env.JS_BINARY__RUNFILES,
    process.env.JS_BINARY__WORKSPACE,
    rootpath,
  );
}

function _resolveExecrootPath(execpath) {
  return path.join(process.env.JS_BINARY__EXECROOT, execpath);
}

const bazelSequencerPath = _resolveRunfilesPath(
  "{{BAZEL_SEQUENCER_SHORT_PATH}}",
);
const bazelSnapshotReporterPath = _resolveRunfilesPath(
  "{{BAZEL_SNAPSHOT_REPORTER_SHORT_PATH}}",
);
const bazelSnapshotResolverPath = _resolveRunfilesPath(
  "{{BAZEL_SNAPSHOT_RESOLVER_SHORT_PATH}}",
);
const bazelHasteMapModulePath = _resolveRunfilesPath(
  "{{BAZEL_HASTE_MAP_MODULE_SHORT_PATH}}",
);
const bazelFilelistJsonPath = _resolveRunfilesPath(
  "{{BAZEL_FILELIST_JSON_SHORT_PATH}}",
);

// Set at module scope so child processes Jest spawns inherit it before bazel_haste_map.cjs runs.
process.env.BAZEL_FILELIST_JSON_FULL_PATH = bazelFilelistJsonPath;

if (
  !updateSnapshots &&
  process.env.JEST_JUNIT_OUTPUT_FILE != process.env.XML_OUTPUT_FILE
) {
  console.error(
    `WARNING: aspect_rules_jest[jest_test]: expected JEST_JUNIT_OUTPUT_FILE environment variable to be set to ${process.env.XML_OUTPUT_FILE} in jest_test target ${process.env.TEST_TARGET}`,
  );
}

/**
 * Load the user-supplied Jest config from runfiles and return it as a fresh object.
 *
 * `import()` caches modules by URL, so the same default export is handed back on every
 * call. Returning a shallow clone keeps later config mutations from leaking across
 * factory invocations. The `file://` prefix is required on Windows where bare drive-
 * letter paths (`c:\...`) aren't valid module specifiers.
 */
async function _loadUserConfig() {
  if (!userConfigShortPath) return {};
  const url = "file://" + _resolveRunfilesPath(userConfigShortPath);
  if (path.extname(userConfigShortPath).toLowerCase() === ".json") {
    // `with` is the spec import attribute (Node 20.10+, 22+); the legacy `assert` form
    // was removed in Node 22 and now throws ERR_IMPORT_ATTRIBUTE_MISSING.
    return { ...(await import(url, { with: { type: "json" } })).default };
  }
  const exported = (await import(url)).default;
  return { ...(typeof exported === "function" ? await exported() : exported) };
}

/**
 * Warn if the user's Jest config uses `projects`, which bypasses rules_jest's
 * configuration (reporters, coverage, snapshots, sharding).
 * @see https://jestjs.io/docs/configuration#projects-arraystring--projectconfig
 */
function _verifyJestConfig(config) {
  if (config.projects && config.projects.length > 0) {
    console.error(`WARNING: aspect_rules_jest[jest_test]: Jest config in target ${process.env.TEST_TARGET} uses 'projects'.
      The use of 'projects' in aspect_rules_jest is unsupported and will cause unexpected behavior including breaking use of
      reporting, coverage, snapshots and sharding.`);
  }
}

/** Add a reporter to `config.reporters` if one named `name` isn't already present. */
function _addReporter(config, name, reporter = name) {
  config.reporters ??= [];
  const exists = config.reporters.some((r) =>
    Array.isArray(r) ? r[0] === name : r === name,
  );
  if (!exists) config.reporters.push(reporter);
}

export default async function jestConfig() {
  const config = await _loadUserConfig();
  _verifyJestConfig(config);

  // Pin rootDir to an absolute path so jest leaves it untouched, mirroring jest's
  // own readConfigFileAndSetRootDir: an absolute user rootDir stays as-is, a
  // relative one resolves against the anchor, and an absent one defaults to it.
  // See https://github.com/aspect-build/rules_jest/issues/347.
  const rootDir = _resolveRunfilesPath(rootDirShortPath);
  if (config.rootDir) {
    if (!path.isAbsolute(config.rootDir)) {
      config.rootDir = path.resolve(rootDir, config.rootDir);
    }
  } else {
    config.rootDir = rootDir;
  }

  // Default test-discovery roots to the target's package, not rootDir, so the
  // target's tests are found wherever the config lives. A user `roots` wins.
  config.roots ||= [_resolveRunfilesPath(packageShortPath)];

  config.cacheDirectory ||= path.join(process.env.TEST_TMPDIR, "jest_cache");

  config.haste = {
    // Walk the filesystem to find inputs. See https://github.com/facebook/jest/pull/9351
    enableSymlinks: true,
    // Don't shell out to watchman or find; use the rules_jest haste map module instead.
    forceNodeFilesystemAPI: true,
    hasteMapModulePath: bazelHasteMapModulePath,
    // Caching is Bazel's job; SHA1/dependency computation is only useful with persistent caching.
    computeSha1: false,
    ...config.haste,
  };

  // Watching, caching, and change detection are all Bazel/ibazel's job.
  config.watchman = false;
  config.watch = config.watchAll = false;
  config.cache = false;
  config.onlyChanged = false;

  if (autoConfReporters) {
    _addReporter(config, "default");
    if (!updateSnapshots) {
      _addReporter(config, "jest-junit", [
        "jest-junit",
        { outputFile: process.env.XML_OUTPUT_FILE },
      ]);
    }
  }

  if (!updateSnapshots) {
    _addReporter(config, bazelSnapshotReporterPath);
  }

  if (autoConfTestSequencer) {
    if (config.testSequencer) {
      console.error(`WARNING: aspect_rules_jest[jest_test]: user supplied Jest config testSequencer value '${config.testSequencer}' will be overridden by jest_test in target ${process.env.TEST_TARGET}.
      See https://jestjs.io/docs/configuration#testsequencer-string for more information on Jest testSequencer config option.
      Set auto_configure_test_sequencer to False to disable this override.`);
    }
    config.testSequencer = bazelSequencerPath;
  }

  if (updateSnapshots) {
    if (config.snapshotResolver) {
      const snapshotResolverPath = path.isAbsolute(config.snapshotResolver)
        ? config.snapshotResolver
        : path.resolve(
            _resolveExecrootPath(userConfigPath),
            "..",
            config.snapshotResolver,
          );
      if (!existsSync(snapshotResolverPath)) {
        throw new Error(
          `configured snapshotResolver '${config.snapshotResolver}' not found at ${snapshotResolverPath}`,
        );
      }
      process.env.JEST_TEST__USER_SNAPSHOT_RESOLVER = snapshotResolverPath;
    }
    config.snapshotResolver = bazelSnapshotResolverPath;
  }

  if (coverageEnabled) {
    config.collectCoverage = true;

    // Jest 30's default resolver (unrs-resolver) resolves symlinks to their
    // realpath, which moves rules_js first-party sources out of the runfiles
    // tree (Jest's rootDir). Coverage recorded against those realpaths is then
    // dropped from the report, producing an empty coverage.dat (rules_js #2901).
    // Resolve first-party (relative) requests with symlinks disabled so paths
    // stay inside runfiles and coverage is attributed correctly. A user-supplied
    // `resolver` is composed underneath (wrapped, not replaced).
    //
    // KNOWN LIMITATION: only relative (`./`) requests get symlink-free
    // resolution. A first-party library imported by its workspace *package* name
    // (a bare specifier such as `@myorg/lib`) still resolves via the default
    // realpath path, so on jest 30 its coverage may be dropped in package-based
    // monorepos. Bare specifiers can't be classified first-party vs third-party
    // from the request alone, and forcing symlink-free resolution on third-party
    // packages would break the `.aspect_rules_js` module store.
    if (config.resolver) {
      const configDir = path.dirname(_resolveRunfilesPath(userConfigShortPath));
      const rootDir = config.rootDir
        ? path.resolve(configDir, config.rootDir)
        : configDir;

      let spec = config.resolver;
      if (spec.startsWith("<rootDir>")) {
        spec = path.join(rootDir, spec.slice("<rootDir>".length));
      } else if (spec.startsWith(".")) {
        spec = path.resolve(rootDir, spec);
      }

      // Resolve like Jest would — either a file path or a package name (e.g.
      // `jest-pnp-resolver`) — from the runfiles tree, instead of assuming a
      // path on disk (which threw for package-name resolvers).
      process.env.JEST_TEST__USER_RESOLVER = createRequire(
        path.join(rootDir, "package.json"),
      ).resolve(spec);
    }

    // Write the wrapper to TEST_TMPDIR (always present and writable) rather than
    // config.cacheDirectory, which at this point may be read-only or still an
    // unexpanded `<rootDir>` token.
    const resolverPath = path.join(
      process.env.TEST_TMPDIR,
      "_bazel_resolver.cjs",
    );
    writeFileSync(
      resolverPath,
      "const u = process.env.JEST_TEST__USER_RESOLVER;\n" +
        "const base = u ? require(u) : null;\n" +
        "module.exports = (request, options) =>\n" +
        "  request.startsWith('.')\n" +
        "    ? (base || options.defaultResolver)(request, { ...options, symlinks: false })\n" +
        "    : (base || options.defaultResolver)(request, options);\n",
    );
    config.resolver = resolverPath;

    // Jest 30's `normalizeCollectCoverageFrom` returns [] when
    // `collectCoverageFrom` is unset, so files that no test imports are omitted
    // from the report entirely — inflating coverage. Collect from all sources so
    // instrumented-but-unexecuted files still report as 0%. The rules_jest haste
    // map already scopes Jest's file universe to this target's `data`, so this
    // glob only ever matches the target's own sources.
    if (!config.collectCoverageFrom) {
      // shouldInstrument() matches sources relative to rootDir, so a rootDir in a
      // subdirectory (see #347) drops the target's sources above it. Emit a glob
      // per level from rootDir up to the package. Depth 0 yields plain `**/*`.
      const pkgRel = path.relative(
        config.rootDir,
        _resolveRunfilesPath(packageShortPath),
      );
      const depth = pkgRel ? pkgRel.split(path.sep).length : 0;
      config.collectCoverageFrom = [];
      for (let i = 0; i <= depth; i++) {
        const prefix = "../".repeat(i);
        config.collectCoverageFrom.push(
          prefix + "**/*.{cjs,cjx,cts,ctx,js,jsx,mjs,mjx,mts,mtx,ts,tsx}",
        );
        config.collectCoverageFrom.push("!" + prefix + "**/node_modules/**");
      }
    }

    let coverageFile = path.basename(process.env.COVERAGE_OUTPUT_FILE);
    let coverageDirectory = path.dirname(process.env.COVERAGE_OUTPUT_FILE);

    // Users can opt out of auto-configured reporting to integrate their own coverage
    // reporters; in that case they're also responsible for split coverage processing.
    if (autoConfReporting) {
      if (process.env.SPLIT_COVERAGE_POST_PROCESSING == "1") {
        // In split coverage post-processing mode Bazel expects COVERAGE_OUTPUT_FILE to
        // be produced by lcov_merger, which runs as a separate action over everything
        // in COVERAGE_DIR. Emit at `COVERAGE_DIR/coverage.dat` for merger.sh to pick up.
        coverageDirectory = process.env.COVERAGE_DIR;
        coverageFile = "coverage.dat";
      }

      // Default coverage config
      config.coverageDirectory ??= coverageDirectory;
      config.coverageReporters ??= [
        "text",
        ["lcovonly", { file: coverageFile }],
      ];
    }
  }

  // Map Bazel's --test_filter (TESTBRIDGE_TEST_ONLY) to file-level filtering, matching
  // the semantics of other Bazel test rules like java_test which filter by class name.
  if (process.env.TESTBRIDGE_TEST_ONLY) {
    config.testRegex = process.env.TESTBRIDGE_TEST_ONLY;
  }

  if (process.env.JS_BINARY__LOG_DEBUG) {
    console.error(
      "DEBUG: aspect_rules_jest[jest_test]: config:",
      JSON.stringify(config, null, 2),
    );
  }

  return config;
}
