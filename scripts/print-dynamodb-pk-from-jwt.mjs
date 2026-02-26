#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function parseArgs(argv) {
  const args = {
    jwt: '',
    file: '',
    scope: 'global',
    table: process.env.STUDIO_LEARNING_STATE_TABLE || 'studio-learning-state',
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'eu-west-2',
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--jwt' && argv[i + 1]) {
      args.jwt = argv[++i];
      continue;
    }
    if (arg === '--file' && argv[i + 1]) {
      args.file = argv[++i];
      continue;
    }
    if (arg === '--scope' && argv[i + 1]) {
      args.scope = argv[++i];
      continue;
    }
    if (arg === '--table' && argv[i + 1]) {
      args.table = argv[++i];
      continue;
    }
    if (arg === '--region' && argv[i + 1]) {
      args.region = argv[++i];
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  npm run jwt:pk -- --jwt <JWT>
  npm run jwt:pk -- --file <json-file-with-jwt>

Options:
  --jwt <token>     JWT string (id token)
  --file <path>     JSON file containing { "jwt": "..." } or { "token": "..." }
  --scope <scope>   DynamoDB scope key suffix (default: global)
  --table <name>    DynamoDB table name (default: studio-learning-state)
  --region <region> AWS region (default: eu-west-2)

Fallbacks:
  If --jwt/--file are missing, script tries process.env.JWT`);
}

function decodeBase64Url(input) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(base64 + padding, 'base64').toString('utf8');
}

function decodeJwtPayload(token) {
  const parts = token.split('.');
  if (parts.length < 2) {
    throw new Error('Invalid JWT format.');
  }
  const payloadRaw = decodeBase64Url(parts[1]);
  return JSON.parse(payloadRaw);
}

function getToken(args) {
  if (args.jwt) {
    return args.jwt;
  }

  if (args.file) {
    const absolutePath = resolve(process.cwd(), args.file);
    const raw = readFileSync(absolutePath, 'utf8');
    const data = JSON.parse(raw);
    const token = data.jwt || data.token || data.id_token;
    if (typeof token === 'string' && token.length > 0) {
      return token;
    }
    throw new Error(`No jwt/token/id_token field found in file: ${absolutePath}`);
  }

  if (process.env.JWT) {
    return process.env.JWT;
  }

  throw new Error('Missing JWT. Provide --jwt, --file, or JWT env var.');
}

try {
  const args = parseArgs(process.argv);
  const token = getToken(args);
  const payload = decodeJwtPayload(token);

  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error('JWT payload does not contain a valid sub claim.');
  }

  const pk = `USER#${payload.sub}`;
  const sk = `SCOPE#${args.scope}`;

  console.log(`sub: ${payload.sub}`);
  if (typeof payload.email === 'string') {
    console.log(`email: ${payload.email}`);
  }
  console.log(`pk: ${pk}`);
  console.log(`sk: ${sk}`);

  console.log('\nDelete command:');
  console.log(
    `aws dynamodb delete-item --region ${args.region} --table-name ${args.table} --key '${JSON.stringify({ pk: { S: pk }, sk: { S: sk } })}'`
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
