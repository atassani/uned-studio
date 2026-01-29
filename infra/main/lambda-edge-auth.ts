// Lambda@Edge authentication handler for CloudFront
// Minimal version: redirects unauthenticated requests to /uned/studio/* to /login

import { CloudFrontRequestEvent, CloudFrontRequestResult } from 'aws-lambda';

export async function handler(event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> {
  const request = event.Records[0].cf.request;
  const uri = request.uri;
  // Only protect /uned/studio/*
  if (uri.startsWith('/uned/studio/')) {
    // Check for auth cookie (simplified: look for 'cookie' header with 'auth=')
    const cookies = request.headers.cookie || [];
    const hasAuth = cookies.some(({ value }) => value.includes('auth='));
    if (!hasAuth) {
      // Redirect to login page (could be /login or external OAuth handler)
      return {
        status: '302',
        statusDescription: 'Found',
        headers: {
          location: [
            {
              key: 'Location',
              value: '/login?redirect=' + encodeURIComponent(uri),
            },
          ],
        },
      };
    }
  }
  // Allow request to proceed
  return request;
}
