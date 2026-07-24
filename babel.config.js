module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
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
      "react-native-reanimated/plugin",
    ],
  };
};
