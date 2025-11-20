// jest.config.js template for jest_test rule
import { existsSync, readFileSync } from "fs";
import * as path from "path";

const updateSnapshots = !!process.env.JEST_TEST__UPDATE_SNAPSHOTS;
const coverageEnabled = !!process.env.COVERAGE_DIR;
const autoConfReporting = !!"{{AUTO_CONF_REPORTING}}";
const autoConfReporters = !!"{{AUTO_CONF_REPORTERS}}";
const autoConfTestSequencer = !!"{{AUTO_CONF_TEST_SEQUENCER}}";
const userConfigShortPath = "{{USER_CONFIG_SHORT_PATH}}";
const userConfigPath = "{{USER_CONFIG_PATH}}";
const generatedConfigShortPath = "{{GENERATED_CONFIG_SHORT_PATH}}";
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

// Store the filelist as an envvar that will be accessible to bazel_haste_map.cjs, including
// from potential jest launched child processes.
process.env.BAZEL_FILELIST_JSON_FULL_PATH = bazelFilelistJsonPath;

if (
  !updateSnapshots &&
  process.env.JEST_JUNIT_OUTPUT_FILE != process.env.XML_OUTPUT_FILE
) {
  console.error(
    `WARNING: aspect_rules_jest[jest_test]: expected JEST_JUNIT_OUTPUT_FILE environment variable to be set to ${process.env.XML_OUTPUT_FILE} in jest_test target ${process.env.TEST_TARGET}`,
  );
}

function _resolveRunfilesPath(rootpath) {
  return path.join(
    process.env.RUNFILES,
    process.env.JS_BINARY__WORKSPACE,
    rootpath,
  );
}

function _resolveExecrootPath(execpath) {
  return path.join(process.env.JS_BINARY__EXECROOT, execpath);
}

function _hasReporter(config, name) {
  if (!config.reporters) {
    config.reporters = [];
  }
  return config.reporters.some((r) => {
    if (Array.isArray(r)) {
      return r.length > 0 && r[0] == name;
    } else {
      return r == name;
    }
  });
}

function _addReporter(config, name, reporter = undefined) {
  if (!config.reporters) {
    config.reporters = [];
  }
  if (!_hasReporter(config, name)) {
    config.reporters.push(reporter ? reporter : name);
  }
}

function _verifyJestConfig(config) {
  // Projects will be loaded by jest and bypass rules_jest configuration.
  // See https://jestjs.io/docs/configuration#projects-arraystring--projectconfig
  if (config.projects && config.projects.length > 0) {
    console.error(`WARNING: aspect_rules_jest[jest_test]: Jest config in target ${process.env.TEST_TARGET} uses 'projects'.
      The use of 'projects' in aspect_rules_jest is unsupported and will cause unexpected behavior including breaking use of
      reporting, coverage, snapshots and sharding.`);
  }
}

let config = {};
if (userConfigShortPath) {
  if (path.extname(userConfigShortPath).toLowerCase() == ".json") {
    // On Windows, import does not like paths that start with the drive letter such as
    // `c:\...` so we prepend the with `file://` so node is happy.
    config = (
      await import("file://" + _resolveRunfilesPath(userConfigShortPath), {
        assert: { type: "json" },
      })
    ).default;
  } else {
    // On Windows, import does not like paths that start with the drive letter such as
    // `c:\...` so we prepend the with `file://` so node is happy.
    const userConfigModule = (
      await import("file://" + _resolveRunfilesPath(userConfigShortPath))
    ).default;
    if (typeof userConfigModule === "function") {
      config = await userConfigModule();
    } else {
      config = userConfigModule;
    }
  }
}

_verifyJestConfig(config);

// Default to using an isolated tmpdir
config.cacheDirectory ||= path.join(process.env.TEST_TMPDIR, "jest_cache");

config.haste = {
  // Needed for Jest to walk the filesystem to find inputs.
  // See https://github.com/facebook/jest/pull/9351
  enableSymlinks: true,

  // Do not use external watchman or find, use a custom
  // HasteMap module designed for rules_jest
  forceNodeFilesystemAPI: true,
  hasteMapModulePath: bazelHasteMapModulePath,

  // Use of SHA1, computing dependencies etc are all related to caching.
  // Disable them unless explicitly enabled by the user `config.haste`.
  computeSha1: false,

  ...config.haste,
};

// https://jestjs.io/docs/cli#--watchman. Whether to use watchman for file crawling. Defaults
// to true. Disable using --no-watchman. Watching is ibazel's job
config.watchman = false;

// Watching and reinvoking tests is rule_jest + ibazel's job.
config.watch = config.watchAll = false;

// Caching is bazel's job.
config.cache = false;

// Change detection is bazel's job.
config.onlyChanged = false;

// Auto configure reporters
if (autoConfReporters) {
  // Default reporter should always be configured
  _addReporter(config, "default");
  // jest-junit reporter is only auto-configured if this is a test target
  if (!updateSnapshots) {
    _addReporter(config, "jest-junit", [
      "jest-junit",
      { outputFile: process.env.XML_OUTPUT_FILE },
    ]);
  }
}

if (!updateSnapshots) {
  // The Bazel snapshot reporter is always configured if this is a test target
  _addReporter(config, bazelSnapshotReporterPath);
}

// Auto configure the Bazel test sequencer (if this is a test target)
if (autoConfTestSequencer) {
  if (config.testSequencer) {
    console.error(`WARNING: aspect_rules_jest[jest_test]: user supplied Jest config testSequencer value '${config.testSequencer}' will be overridden by jest_test in target ${process.env.TEST_TARGET}.
    See https://jestjs.io/docs/configuration#testsequencer-string for more information on Jest testSequencer config option.
    Set auto_configure_test_sequencer to False to disable this override.`);
  }
  config.testSequencer = bazelSequencerPath;
}

// If this is an update snapshot target the configure the Bazel snapshot resolver
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

  let coverageFile = path.basename(process.env.COVERAGE_OUTPUT_FILE);
  let coverageDirectory = path.dirname(process.env.COVERAGE_OUTPUT_FILE);

  /**
   * This can be used to eject from the default behavior so end users
   * can integrate their own coverage reporters.
   * Note, if a user does this, they are also responsible for the split coverage processing logic
   */
  if (autoConfReporting) {
    if (process.env.SPLIT_COVERAGE_POST_PROCESSING == "1") {
      // in split coverage post processing mode bazel assumes that the COVERAGE_OUTPUT_FILE
      // will be created by lcov_merger which runs as a separate action with everything in
      // COVERAGE_DIR provided as inputs. so we'll just create the final coverage at
      // `COVERAGE_DIR/coverage.dat` which then later moved by merger.sh to final location.
      coverageDirectory = process.env.COVERAGE_DIR;
      coverageFile = "coverage.dat";
    }
  
    config.coverageDirectory = coverageDirectory;
    config.coverageReporters = ["text", ["lcovonly", { file: coverageFile }]];
  }
}

if (process.env.JS_BINARY__LOG_DEBUG) {
  console.error(
    "DEBUG: aspect_rules_jest[jest_test]: config:",
    JSON.stringify(config, null, 2),
  );
}

export default config;
