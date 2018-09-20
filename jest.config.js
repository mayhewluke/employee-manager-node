module.exports = {
  preset: "ts-jest",
  testMatch: ["<rootDir>/test/**/*.(j|t)s?(x)"],
  testEnvironment: "node",
  watchPathIgnorePatterns: ["<rootDir>/dist"]
};
