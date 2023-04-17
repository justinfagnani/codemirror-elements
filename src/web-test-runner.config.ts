import type {TestRunnerConfig} from '@web/test-runner';
import {playwrightLauncher} from '@web/test-runner-playwright';

export default {
  files: ['test/**/*_test.js'],
  nodeResolve: {
    exportConditions: ['development', 'browser'],
  },
  browsers: [playwrightLauncher({product: 'chromium'})],
  testFramework: {
    // https://mochajs.org/api/mocha
    config: {
      ui: 'tdd',
    },
  },
} satisfies TestRunnerConfig;
