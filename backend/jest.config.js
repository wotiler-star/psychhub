/* Jest 配置（后端自动化测试） */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        // 测试不卡类型检查，聚焦行为；与构建(nest build)的类型门禁解耦
        isolatedModules: true,
      },
    ],
  },
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/test/setup.ts'],
  testTimeout: 30000,
  // 排除构建产物与脚本目录，避免误扫
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/'],
};
