// Register tsconfig-paths alias resolution before loading app
require("tsconfig-paths").register({
  baseUrl: __dirname,
  paths: {
    "@database/*": ["dist/database/*"],
    "@src/*": ["dist/*"],
  },
});

// Now load and start the app
require("./dist/app");
