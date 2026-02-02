// Mock jose imports to avoid Jest ES module parse error
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  createRemoteJWKSet: jest.fn(),
}));
import { handler } from '../../main/lambda-edge-auth';
import { CloudFrontResultResponse } from 'aws-lambda';

describe('Lambda@Edge Auth Handler', () => {
  it('should deny unauthenticated requests to /studio/*', async () => {
    // Simulate a CloudFront event with no auth cookie
    const event = {
      Records: [
        {
          cf: {
            request: {
              uri: '/studio/app',
              headers: {},
            },
          },
        },
      ],
    };
    const result = await handler(event as any);
    // Type guard: check if result is a CloudFrontResultResponse (has status and headers)
    if (
      typeof result === 'object' &&
      result !== null &&
      'status' in result &&
      result.status === '302' &&
      result.headers &&
      result.headers.location &&
      Array.isArray(result.headers.location)
    ) {
      expect(result.status).toBe('302');
      expect(result.headers.location[0].value).toMatch(/login/);
    } else {
      throw new Error('Expected a redirect response with status 302 and location header');
    }
  });
});
