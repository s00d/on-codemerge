export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  snapshotSerializers: ['jest-serializer-html'],
  moduleNameMapper: {
    '\\.(scss|css)$': 'identity-obj-proxy', // Игнорируем SCSS/CSS файлы
  },
};
