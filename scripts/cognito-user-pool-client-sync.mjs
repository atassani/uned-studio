#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const DEFAULT_REGION = 'eu-west-2';
const DEFAULT_SNAPSHOT_PATH = 'infra/config/cognito-user-pool-client.json';
const DEFAULT_ENV_FILES = ['frontend/.env.production.local', 'frontend/.env.production'];
const fileEnv = loadEnvFiles(DEFAULT_ENV_FILES);

const command = process.argv[2];
if (!['pull', 'push', 'diff'].includes(command)) {
  console.error('Usage: node scripts/cognito-user-pool-client-sync.mjs <pull|push|diff>');
  process.exit(1);
}

function getRegion() {
  return (
    process.env.AWS_REGION ||
    process.env.AWS_DEFAULT_REGION ||
    fileEnv.AWS_REGION ||
    fileEnv.AWS_DEFAULT_REGION ||
    fileEnv.NEXT_PUBLIC_AWS_REGION ||
    DEFAULT_REGION
  );
}

function getSnapshotPath() {
  return resolve(process.cwd(), process.env.COGNITO_SNAPSHOT_PATH || DEFAULT_SNAPSHOT_PATH);
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function parseEnvFile(path) {
  if (!existsSync(path)) {
    return {};
  }

  const env = {};
  const content = readFileSync(path, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const equalIndex = line.indexOf('=');
    if (equalIndex <= 0) {
      continue;
    }
    const key = line.slice(0, equalIndex).trim();
    const value = stripQuotes(line.slice(equalIndex + 1).trim());
    env[key] = value;
  }
  return env;
}

function loadEnvFiles(paths) {
  const env = {};
  for (const relativePath of paths) {
    const absolutePath = resolve(process.cwd(), relativePath);
    Object.assign(env, parseEnvFile(absolutePath));
  }
  return env;
}

function getUserPoolId() {
  return (
    process.env.COGNITO_USER_POOL_ID ||
    fileEnv.COGNITO_USER_POOL_ID ||
    fileEnv.NEXT_PUBLIC_COGNITO_USER_POOL_ID
  );
}

function getUserPoolClientId() {
  return (
    process.env.COGNITO_USER_POOL_CLIENT_ID ||
    fileEnv.COGNITO_USER_POOL_CLIENT_ID ||
    fileEnv.NEXT_PUBLIC_COGNITO_CLIENT_ID
  );
}

function awsJson(args) {
  const output = execFileSync('aws', args, { encoding: 'utf8' });
  return JSON.parse(output);
}

function normalizeForSnapshot(userPoolClient) {
  const fields = [
    'ClientName',
    'RefreshTokenValidity',
    'AccessTokenValidity',
    'IdTokenValidity',
    'TokenValidityUnits',
    'ReadAttributes',
    'WriteAttributes',
    'ExplicitAuthFlows',
    'SupportedIdentityProviders',
    'CallbackURLs',
    'LogoutURLs',
    'DefaultRedirectURI',
    'AllowedOAuthFlows',
    'AllowedOAuthScopes',
    'AllowedOAuthFlowsUserPoolClient',
    'AnalyticsConfiguration',
    'PreventUserExistenceErrors',
    'EnableTokenRevocation',
    'EnablePropagateAdditionalUserContextData',
    'AuthSessionValidity',
  ];

  const normalized = {};
  for (const field of fields) {
    if (field in userPoolClient && userPoolClient[field] !== undefined) {
      normalized[field] = userPoolClient[field];
    }
  }
  return normalized;
}

function buildUpdatePayload(snapshot, userPoolId, clientId) {
  return {
    UserPoolId: userPoolId,
    ClientId: clientId,
    ...snapshot.userPoolClient,
  };
}

function loadSnapshot(snapshotPath) {
  if (!existsSync(snapshotPath)) {
    throw new Error(`Snapshot not found at ${snapshotPath}. Run pull first: npm run cognito:pull`);
  }
  return JSON.parse(readFileSync(snapshotPath, 'utf8'));
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function readLiveConfig(region, userPoolId, clientId) {
  const response = awsJson([
    'cognito-idp',
    'describe-user-pool-client',
    '--region',
    region,
    '--user-pool-id',
    userPoolId,
    '--client-id',
    clientId,
    '--output',
    'json',
  ]);

  return normalizeForSnapshot(response.UserPoolClient);
}

function writeSnapshot(snapshotPath, snapshot) {
  mkdirSync(dirname(snapshotPath), { recursive: true });
  writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
}

function runPull() {
  const userPoolId =
    getUserPoolId() ||
    (() => {
      throw new Error(
        'COGNITO_USER_POOL_ID is required (or NEXT_PUBLIC_COGNITO_USER_POOL_ID in frontend/.env.production).'
      );
    })();
  const clientId =
    getUserPoolClientId() ||
    (() => {
      throw new Error(
        'COGNITO_USER_POOL_CLIENT_ID is required (or NEXT_PUBLIC_COGNITO_CLIENT_ID in frontend/.env.production).'
      );
    })();
  const region = getRegion();
  const snapshotPath = getSnapshotPath();

  const userPoolClient = readLiveConfig(region, userPoolId, clientId);
  const snapshot = {
    metadata: {
      region,
      userPoolId,
      clientId,
      pulledAt: new Date().toISOString(),
    },
    userPoolClient,
  };

  writeSnapshot(snapshotPath, snapshot);
  console.log(`Snapshot updated: ${snapshotPath}`);
}

function runPush() {
  const snapshotPath = getSnapshotPath();
  const snapshot = loadSnapshot(snapshotPath);
  const region = getRegion();
  const userPoolId = getUserPoolId() || snapshot.metadata?.userPoolId;
  const clientId = getUserPoolClientId() || snapshot.metadata?.clientId;

  if (!userPoolId || !clientId) {
    throw new Error(
      'COGNITO_USER_POOL_ID and COGNITO_USER_POOL_CLIENT_ID are required (either env vars or snapshot metadata).'
    );
  }

  const payload = buildUpdatePayload(snapshot, userPoolId, clientId);
  const payloadPath = resolve(process.cwd(), '.tmp-cognito-update-user-pool-client.json');

  writeFileSync(payloadPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  execFileSync(
    'aws',
    [
      'cognito-idp',
      'update-user-pool-client',
      '--region',
      region,
      '--cli-input-json',
      `file://${payloadPath}`,
    ],
    { stdio: 'inherit' }
  );

  const liveAfterPush = readLiveConfig(region, userPoolId, clientId);
  if (!deepEqual(liveAfterPush, snapshot.userPoolClient)) {
    console.error(
      'Warning: live config differs from snapshot after push. Run `npm run cognito:diff`.'
    );
    process.exitCode = 2;
    return;
  }

  console.log('Cognito User Pool Client updated and verified.');
}

function runDiff() {
  const snapshotPath = getSnapshotPath();
  const snapshot = loadSnapshot(snapshotPath);
  const region = getRegion();
  const userPoolId = getUserPoolId() || snapshot.metadata?.userPoolId;
  const clientId = getUserPoolClientId() || snapshot.metadata?.clientId;

  if (!userPoolId || !clientId) {
    throw new Error(
      'COGNITO_USER_POOL_ID and COGNITO_USER_POOL_CLIENT_ID are required (either env vars or snapshot metadata).'
    );
  }

  const live = readLiveConfig(region, userPoolId, clientId);
  const expected = snapshot.userPoolClient;
  const keys = Array.from(new Set([...Object.keys(live), ...Object.keys(expected)])).sort();

  const diffs = [];
  for (const key of keys) {
    const liveValue = live[key];
    const expectedValue = expected[key];
    if (!deepEqual(liveValue, expectedValue)) {
      diffs.push({
        field: key,
        snapshot: expectedValue,
        live: liveValue,
      });
    }
  }

  if (diffs.length === 0) {
    console.log('No differences between snapshot and live Cognito config.');
    return;
  }

  console.log(JSON.stringify(diffs, null, 2));
  process.exitCode = 1;
}

try {
  if (command === 'pull') runPull();
  if (command === 'push') runPush();
  if (command === 'diff') runDiff();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
