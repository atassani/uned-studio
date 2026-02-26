import {
  consumeDynamoDbCallAllowance,
  getStorageMode,
  isDynamoDbGloballyEnabled,
  isRemoteLearningStateReadEnabled,
  isRemoteLearningStateWriteEnabled,
} from '../../src/app/persistenceMode';

const originalEnv = { ...process.env };

describe('persistenceMode', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_STORAGE_MODE;
    delete process.env.NEXT_PUBLIC_ENABLE_DYNAMODB;
    delete process.env.NEXT_PUBLIC_SYNC_WRITES;
    delete process.env.NEXT_PUBLIC_MAX_DDB_CALLS_PER_SESSION;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('defaults to local mode in development', () => {
    (process.env as any).NODE_ENV = 'development';
    expect(getStorageMode()).toBe('local');
  });

  it('enables reads and writes in dynamodb mode', () => {
    process.env.NEXT_PUBLIC_STORAGE_MODE = 'dynamodb';
    expect(isRemoteLearningStateReadEnabled()).toBe(true);
    expect(isRemoteLearningStateWriteEnabled()).toBe(true);
  });

  it('enables reads but disables writes by default in hybrid mode', () => {
    process.env.NEXT_PUBLIC_STORAGE_MODE = 'hybrid';
    expect(isRemoteLearningStateReadEnabled()).toBe(true);
    expect(isRemoteLearningStateWriteEnabled()).toBe(false);
  });

  it('enables writes in hybrid mode when sync writes is true', () => {
    process.env.NEXT_PUBLIC_STORAGE_MODE = 'hybrid';
    process.env.NEXT_PUBLIC_SYNC_WRITES = 'true';
    expect(isRemoteLearningStateWriteEnabled()).toBe(true);
  });

  it('disables DynamoDB globally when NEXT_PUBLIC_ENABLE_DYNAMODB is false', () => {
    process.env.NEXT_PUBLIC_STORAGE_MODE = 'dynamodb';
    process.env.NEXT_PUBLIC_ENABLE_DYNAMODB = 'false';
    expect(isDynamoDbGloballyEnabled()).toBe(false);
    expect(isRemoteLearningStateReadEnabled()).toBe(false);
    expect(isRemoteLearningStateWriteEnabled()).toBe(false);
  });

  it('blocks calls after reaching max calls per session', () => {
    process.env.NEXT_PUBLIC_MAX_DDB_CALLS_PER_SESSION = '2';
    expect(consumeDynamoDbCallAllowance('GET', 'global')).toBe(true);
    expect(consumeDynamoDbCallAllowance('PUT', 'global')).toBe(true);
    expect(consumeDynamoDbCallAllowance('PUT', 'global')).toBe(false);
  });
});
