export default {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupDb.js']
};
