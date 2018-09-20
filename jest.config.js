module.exports = {
  preset: "ts-jest",
  testMatch: ["<rootDir>/test/**/*.(j|t)s?(x)"],
  testEnvironment: "node",
  moduleNameMapper: {
    "^secrets/(.*)": "<rootDir>/secrets/$1"
  },
  moduleDirectories: ["src", "node_modules"],
  watchPathIgnorePatterns: ["<rootDir>/dist"]
};
