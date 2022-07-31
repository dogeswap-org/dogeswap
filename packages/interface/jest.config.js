module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["**/__tests__/**/*.test.[jt]s?(x)"],
    modulePathIgnorePatterns: ["<rootDir>/__tests__/testUtils.ts"],
    globals: {
        "ts-jest": {
            isolatedModules: true,
        },
    }
};
