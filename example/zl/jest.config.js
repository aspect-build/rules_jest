/** @type {import('ts-jest').JestConfigWithTsJest} */

export default {
    moduleDirectories: ["node_modules", "<rootDir>/"],
    modulePathIgnorePatterns: ["node_modules"],
    testRegex: ".*(spec|test).(js|jsx|ts|tsx)$",

    testEnvironment: "node",
};
