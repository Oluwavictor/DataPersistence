// import type { Config } from "jest";

// const config: Config = {
//   preset: "ts-jest",
//   testEnvironment: "node",
//   rootDir: ".",
//   testMatch: ["**/tests/**/*.test.ts"],
//   transform: {
//     "^.+\\.tsx?$": [
//       "ts-jest",
//       {
//         tsconfig: {
//           experimentalDecorators: true,
//           emitDecoratorMetadata: true,
//           esModuleInterop: true,
//           strict: true,
//           strictPropertyInitialization: false,
//         },
//       },
//     ],
//   },
//   moduleFileExtensions: ["ts", "tsx", "js", "json"],
//   clearMocks: true,
//   verbose: true,
//   testTimeout: 30000,
// };

// export default config;

import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["**/tests/**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          esModuleInterop: true,
          strict: true,
          strictPropertyInitialization: false,
        },
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  clearMocks: true,
  verbose: true,
  testTimeout: 30000,
  // Set NODE_ENV to test
  testEnvironmentOptions: {
    NODE_ENV: "test",
  },
  globals: {
    NODE_ENV: "test",
  },
};

export default config;