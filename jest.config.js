// Domain-layer tests are plain TypeScript with zero React Native imports
// (that's the point of the architecture's layering), so they get their own
// minimal transform instead of the full jest-expo/React Native preset.
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "babel-jest",
      {
        configFile: false,
        babelrc: false,
        presets: [["@babel/preset-env", { targets: { node: "current" } }], "@babel/preset-typescript"],
        plugins: [
          [
            "module-resolver",
            {
              root: ["./"],
              alias: {
                "@app": "./src/navigation",
                "@core": "./src/core",
                "@domain": "./src/domain",
                "@data": "./src/data",
                "@features": "./src/features",
                "@shared": "./src/shared",
              },
            },
          ],
        ],
      },
    ],
  },
};
