// jest.config.js template for jest_test rule
import * as path from "path";

// isTest indicates if this is a test target or if this is a binary target generating reference output snapshots for the snapshot updater target
const isTest = !!process.env.TEST_TARGET;
const updateSnapshots = process.env.JEST_TEST__UPDATE_SNAPSHOTS;
const autoConfReporters = !!"{{AUTO_CONF_REPORTERS}}";
const autoConfTestSequencer = !!"{{AUTO_CONF_TEST_SEQUENCER}}";
const userConfigShortPath = "{{USER_CONFIG_SHORT_PATH}}";
const junitReportPath = _runfilesPath("{{JUNIT_REPORTER_SHORT_PATH}}");
const bazelSequencerPath = _runfilesPath("{{BAZEL_SEQUENCER_SHORT_PATH}}");
const bazelSnapshotReporterPath = _runfilesPath(
  "{{BAZEL_SNAPSHOT_REPORTER_SHORT_PATH}}"
);
const bazelSnapshotResolverPath = _runfilesPath(
  "{{BAZEL_SNAPSHOT_RESOLVER_SHORT_PATH}}"
);

if (isTest && updateSnapshots) {
  console.error(
    `ERROR: aspect_rules_jest[jest_test]: update_snapshots should not be set on a test target ${process.env.TEST_TARGET}`
  );
  process.exit(1);
}

if (
  isTest &&
  process.env.JEST_JUNIT_OUTPUT_FILE != process.env.XML_OUTPUT_FILE
) {
  console.error(
    `WARNING: aspect_rules_jest[jest_test]: expected JEST_JUNIT_OUTPUT_FILE environment variable to be set to ${process.env.XML_OUTPUT_FILE} in jest_test target ${process.env.TEST_TARGET}`
  );
}

function _runfilesPath(shortPath) {
  return path.join(
    process.env.RUNFILES,
    process.env.JS_BINARY__WORKSPACE,
    shortPath
  );
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
    config = (
      await import(_runfilesPath(userConfigShortPath), {
        assert: { type: "json" },
      })
    ).default;
  } else {
    config = (await import(_runfilesPath(userConfigShortPath))).default;
  }
}

// Needed for Jest to walk the filesystem to find inputs.
// See https://github.com/facebook/jest/pull/9351
config.haste = { enableSymlinks: true };

// https://jestjs.io/docs/cli#--watchman. Whether to use watchman for file crawling. Defaults
// to true. Disable using --no-watchman. Watching is ibazel's job
config.watchman = false;

// Auto configure reporters
if (autoConfReporters) {
  // Default reporter should always be configured
  _addReporter(config, "default");
  // jest-junit reporter is only auto-configured if this is a test target
  if (isTest) {
    _addReporter(config, "jest-junit", [
      junitReportPath,
      { outputFile: process.env.XML_OUTPUT_FILE },
    ]);
  }
}
if (isTest) {
  // The Bazel snapshot reporter is always configured if this is a test target
  _addReporter(config, bazelSnapshotReporterPath);
}

// Auto configure the Bazel test sequencer (if this is a test target)
if (isTest && autoConfTestSequencer) {
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
    process.env.JEST_TEST__USER_SNAPSHOT_RESOLVER = path.isAbsolute(
      config.snapshotResolver
    )
      ? config.snapshotResolver
      : path.resolve(__dirname, config.snapshotResolver);
  }
  config.snapshotResolver = bazelSnapshotResolverPath;
}

if (process.env.JS_BINARY__LOG_DEBUG) {
  console.error(
    "DEBUG: aspect_rules_jest[jest_test]: config:",
    JSON.stringify(config, null, 2)
  );
}

export default config;
