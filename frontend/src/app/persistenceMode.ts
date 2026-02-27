export type StorageMode = 'local' | 'dynamodb' | 'hybrid';

const DEFAULT_TABLE_NAME = 'studio-learning-state';
const DDB_CALL_COUNT_KEY = 'learningStudio:dynamodbCallCount';

function parseStorageMode(input: string | undefined): StorageMode {
  if (input === 'local' || input === 'dynamodb' || input === 'hybrid') {
    return input;
  }
  return process.env.NODE_ENV === 'development' ? 'local' : 'dynamodb';
}

function parseBoolean(input: string | undefined, fallback: boolean): boolean {
  if (input === undefined) {
    return fallback;
  }
  const normalized = input.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }
  return fallback;
}

function parseMaxCalls(input: string | undefined): number | null {
  if (!input) {
    return null;
  }
  const parsed = Number(input);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return Math.floor(parsed);
}

export function getStorageMode(): StorageMode {
  return parseStorageMode(process.env.NEXT_PUBLIC_STORAGE_MODE);
}

export function isDynamoDbGloballyEnabled(): boolean {
  return parseBoolean(process.env.NEXT_PUBLIC_ENABLE_DYNAMODB, true);
}

export function isDynamoDbLoggingEnabled(): boolean {
  const defaultEnabled = process.env.NODE_ENV === 'development';
  return parseBoolean(process.env.NEXT_PUBLIC_DYNAMODB_LOG_ENABLED, defaultEnabled);
}

export function isRemoteLearningStateReadEnabled(): boolean {
  const mode = getStorageMode();
  return isDynamoDbGloballyEnabled() && (mode === 'dynamodb' || mode === 'hybrid');
}

export function isRemoteLearningStateWriteEnabled(): boolean {
  const mode = getStorageMode();
  if (!isDynamoDbGloballyEnabled()) {
    return false;
  }
  if (mode === 'dynamodb') {
    return true;
  }
  if (mode === 'hybrid') {
    return parseBoolean(process.env.NEXT_PUBLIC_SYNC_WRITES, false);
  }
  return false;
}

function getMaxDynamoDbCallsPerSession(): number | null {
  return parseMaxCalls(process.env.NEXT_PUBLIC_MAX_DDB_CALLS_PER_SESSION);
}

function getJwtSub(): string {
  if (typeof window === 'undefined') {
    return 'unknown';
  }
  const token = window.localStorage.getItem('jwt');
  if (!token) {
    return 'unknown';
  }
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return 'unknown';
    }
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = JSON.parse(atob(padded)) as { sub?: unknown };
    return typeof decoded.sub === 'string' && decoded.sub.length > 0 ? decoded.sub : 'unknown';
  } catch {
    return 'unknown';
  }
}

function getCurrentCallCount(): number {
  if (typeof window === 'undefined') {
    return 0;
  }
  const raw = window.sessionStorage.getItem(DDB_CALL_COUNT_KEY);
  if (!raw) {
    return 0;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

function setCurrentCallCount(value: number) {
  if (typeof window === 'undefined') {
    return;
  }
  window.sessionStorage.setItem(DDB_CALL_COUNT_KEY, String(Math.max(0, Math.floor(value))));
}

export function consumeDynamoDbCallAllowance(operation: 'GET' | 'PUT', scope: string): boolean {
  const maxCalls = getMaxDynamoDbCallsPerSession();
  if (!maxCalls) {
    return true;
  }
  const current = getCurrentCallCount();
  if (current >= maxCalls) {
    logDynamoDbCall(operation, scope, 'blocked');
    return false;
  }
  setCurrentCallCount(current + 1);
  return true;
}

export function logDynamoDbCall(
  operation: 'GET' | 'PUT',
  scope: string,
  outcome: 'attempt' | 'success' | 'blocked' | 'error'
) {
  if (!isDynamoDbLoggingEnabled()) {
    return;
  }
  const tableName = process.env.NEXT_PUBLIC_STUDIO_LEARNING_STATE_TABLE || DEFAULT_TABLE_NAME;
  const pk = `USER#${getJwtSub()}`;
  const sk = `SCOPE#${scope}`;
  console.info(`[DDB ${outcome}] op=${operation} table=${tableName} pk=${pk} sk=${sk}`);
}
