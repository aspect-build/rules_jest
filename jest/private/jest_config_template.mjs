// jest.config.js template for jest_test rule
import { existsSync, readFileSync } from "fs";
import * as path from "path";

const updateSnapshots = !!process.env.JEST_TEST__UPDATE_SNAPSHOTS;
const coverageEnabled = !!process.env.COVERAGE_DIR;
const autoConfReporters = !!"{{AUTO_CONF_REPORTERS}}";
const autoConfTestSequencer = !!"{{AUTO_CONF_TEST_SEQUENCER}}";
const userConfigShortPath = "{{USER_CONFIG_SHORT_PATH}}";
const userConfigPath = "{{USER_CONFIG_PATH}}";
const generatedConfigShortPath = "{{GENERATED_CONFIG_SHORT_PATH}}";
const bazelSequencerPath = _resolveRunfilesPath(
  "{{BAZEL_SEQUENCER_SHORT_PATH}}"
);
const bazelSnapshotReporterPath = _resolveRunfilesPath(
  "{{BAZEL_SNAPSHOT_REPORTER_SHORT_PATH}}"
);
const bazelSnapshotResolverPath = _resolveRunfilesPath(
  "{{BAZEL_SNAPSHOT_RESOLVER_SHORT_PATH}}"
);

if (
  !updateSnapshots &&
  process.env.JEST_JUNIT_OUTPUT_FILE != process.env.XML_OUTPUT_FILE
) {
  console.error(
    `WARNING: aspect_rules_jest[jest_test]: expected JEST_JUNIT_OUTPUT_FILE environment variable to be set to ${process.env.XML_OUTPUT_FILE} in jest_test target ${process.env.TEST_TARGET}`
  );
}

function _resolveRunfilesPath(rootpath) {
  return path.join(
    process.env.RUNFILES,
    process.env.JS_BINARY__WORKSPACE,
    rootpath
  );
}

function _resolveExecrootPath(execpath) {
  return path.join(process.env.JS_BINARY__EXECROOT, execpath);
}

function _hasReporter(config, name) {
  if (!config.reporters) {
    config.reporters = [];
  }
  for (const r of config.reporters) {
    if (Array.isArray(r)) {
      return r.length > 0 && r[0] == name;
    } else {
      return r == name;
    }
  }
}

function _addReporter(config, name, reporter = undefined) {
  if (!config.reporters) {
    config.reporters = [];
  }
  if (!_hasReporter(config, name)) {
    config.reporters.push(reporter ? reporter : name);
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

// Default to using an isolated tmpdir
config.cacheDirectory ||= path.join(process.env.TEST_TMPDIR, 'jest_cache');


// Needed for Jest to walk the filesystem to find inputs.
// See https://github.com/facebook/jest/pull/9351
config.haste = { enableSymlinks: true, ...config.haste };

// https://jestjs.io/docs/cli#--watchman. Whether to use watchman for file crawling. Defaults
// to true. Disable using --no-watchman. Watching is ibazel's job
config.watchman = false;

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
          config.snapshotResolver
        );
    if (!existsSync(snapshotResolverPath)) {
      throw new Error(
        `configured snapshotResolver '${config.snapshotResolver}' not found at ${snapshotResolverPath}`
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

  // Glob pattern paths for which files to cover must be relative to this
  // jest config file in runfiles.
  const jestConfigDir = path.dirname(
    _resolveRunfilesPath(generatedConfigShortPath)
  );

  // Only generate coverage for files declared in the COVERAGE_MANIFEST
  config.collectCoverageFrom = readFileSync(process.env.COVERAGE_MANIFEST)
    .toString("utf8")
    .split("\n")
    .filter((f) => f != "")
    .map((f) => path.relative(jestConfigDir, f));
}

if (process.env.JS_BINARY__LOG_DEBUG) {
  console.error(
    "DEBUG: aspect_rules_jest[jest_test]: config:",
    JSON.stringify(config, null, 2)
  );
}

export default config;
