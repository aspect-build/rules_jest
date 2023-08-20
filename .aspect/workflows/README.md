# Aspect Workflows demonstration deployment

This deployment of [Aspect Workflows](https://www.aspect.build/workflows) is configured to run on AWS + Buildkite.

You can see this Aspect Workflows demonstration deployment live at
https://buildkite.com/aspect/rules-jest.

The three components of the configuration are,

1. Aspect Workflows terraform module
1. Aspect Workflows configuration yaml
1. Buildkite pipeline configuration (in the Buildkite UI)

## Aspect Workflows terraform module

This is found under the [.aspect/workflows/terraform](./terraform) directory.

## Aspect Workflows configuration yaml

This is the [config.yaml](./config.yaml) file in this directory.

## Buildkite pipeline configuration (in the Buildkite UI)

There are two pipelines configured on Buildkite.

1. Main build & test pipeline: https://buildkite.com/aspect/rules-jest
2. Scheduled warming pipeline: https://buildkite.com/aspect/rules-jest-warming

### Main build & test pipeline configuration

The main build & test pipeline found at https://buildkite.com/aspect/rules-jest is configured
with the following yaml steps:

```
steps:
  - key: aspect-workflows-setup
    label: ":aspect: Setup Aspect Workflows"
    commands:
      - "rosetta steps | buildkite-agent pipeline upload"
    agents:
      queue: default
```

### Scheduled warming pipeline configuration

The scheduled warming pipeline found at https://buildkite.com/aspect/rules-jest-warming is
configured with the following yaml steps:

```
steps:
  - label: ":fire: Create warming archives"
    commands:
      - 'echo "--- :aspect: Configure environment"'
      - 'configure_workflows_env'
      - 'echo "--- :stethoscope: Agent health checks"'
      - 'agent_health_check'
      - 'echo "--- :bazel: Create warming archive for ."'
      - 'rosetta run warming'
      - 'warming_archive'
    agents:
      queue: warming
```

A scheduled is configured for this pipeline with the cron interval `0 08-22/4 * * * America/Toronto`
so that it runs periodically to create up-to-date warming archives that caches repository rules so
that the "default" build & test runners don't have to re-fetch them on their first build.