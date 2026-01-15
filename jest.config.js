module.exports = {
  preset: 'ts-jest',
  testMatch: [
    "<rootDir>/tests/unit/**/*.test.ts",
    "<rootDir>/tests/unit/**/*.test.js"
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/tests/e2e/" // Ignore Playwright tests
  ],
  testEnvironment: "jsdom"
};
