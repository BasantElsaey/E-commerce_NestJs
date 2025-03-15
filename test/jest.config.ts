// jest.config.js
export const displayName = 'e-commerce';
export const preset = 'ts-jest';
export const testEnvironment = 'node';
export const moduleDirectories = ['node_modules', '<rootDir>/src'];
export const moduleNameMapper = {
    '^src/(.*)$': '<rootDir>/src/$1', 
    '@src/(.*)': '<rootDir>/src/$1',
    '@auth/(.*)': '<rootDir>/src/auth/$1',
    '@users/(.*)': '<rootDir>/src/users/$1',
    '@categories/(.*)': '<rootDir>/src/categories/$1',
    '@products/(.*)': '<rootDir>/src/products/$1',
    '@orders/(.*)': '<rootDir>/src/orders/$1',
    '@carts/(.*)': '<rootDir>/src/carts/$1',
    '@payment/(.*)': '<rootDir>/src/payment/$1',
    '@utility/(.*)': '<rootDir>/src/utility/$1',
    '@common/(.*)': '<rootDir>/src/utility/common/$1',
    '@reviews/(.*)': '<rootDir>/src/reviews/$1',
};
export const moduleFileExtensions = ['ts', 'js', 'html'];
export const coverageDirectory = './coverage/e-commerce';