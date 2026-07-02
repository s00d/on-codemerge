export default {
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.ts$',
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '\\.d\\.ts$', '/__tests__/helpers/'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  snapshotSerializers: ['jest-serializer-html'],
  moduleNameMapper: {
    '\\.(scss|css)$': 'identity-obj-proxy',
    '\\.svg\\?raw$': '<rootDir>/src/__mocks__/svgMock.ts',
  },
};
