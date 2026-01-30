// Lambda@Edge authentication handler for /uned/studio/*
// Supports: OAuth redirect, JWT/cookie validation, guest access

import { CloudFrontRequestEvent, CloudFrontRequestResult, CloudFrontRequest } from 'aws-lambda';

// Dummy JWT validation (replace with real logic)
function isValidJWT(cookie: string | undefined): boolean {
  // Example: check for a dummy token
  return cookie === 'jwt=valid';
}

const LOGIN_URL = '/uned/studio/login';

export async function handler(event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> {
  const request: CloudFrontRequest = event.Records[0].cf.request;
  const uri = request.uri;
  const cookieHeader = request.headers.cookie?.[0]?.value;

  // Allow guest access for /uned/studio/guest
  if (uri.startsWith('/uned/studio/guest')) {
    return request;
  }

  // Allow if valid JWT/cookie
  if (isValidJWT(cookieHeader)) {
    return request;
  }

  // Redirect unauthenticated access to /uned/studio/app to /uned/studio/login (no query params)
  if (uri.startsWith('/uned/studio/app')) {
    return {
      status: '302',
      statusDescription: 'Found',
      headers: {
        location: [{ key: 'Location', value: LOGIN_URL }],
        'cache-control': [{ key: 'Cache-Control', value: 'no-cache' }],
      },
      body: '',
    };
  }

  // Allow public access to other /uned/studio paths
  return request;
}
