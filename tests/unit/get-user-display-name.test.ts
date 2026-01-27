import { getUserDisplayName } from '../../src/app/utils';

describe('getUserDisplayName', () => {
  it('should return full name from name attribute when available', () => {
    const user = {
      username: 'testuser',
      attributes: {
        name: 'John Smith',
        given_name: 'John',
        family_name: 'Smith',
        email: 'john.smith@example.com',
      },
    };

    expect(getUserDisplayName(user)).toBe('John Smith');
  });

  it('should combine given_name and family_name when name is not available', () => {
    const user = {
      username: 'testuser',
      attributes: {
        given_name: 'Jane',
        family_name: 'Doe',
        email: 'jane.doe@example.com',
      },
    };

    expect(getUserDisplayName(user)).toBe('Jane Doe');
  });

  it('should use only given_name when family_name is not available', () => {
    const user = {
      username: 'testuser',
      attributes: {
        given_name: 'Bob',
        email: 'bob@example.com',
      },
    };

    expect(getUserDisplayName(user)).toBe('Bob');
  });

  it('should use only family_name when given_name is not available', () => {
    const user = {
      username: 'testuser',
      attributes: {
        family_name: 'Wilson',
        email: 'wilson@example.com',
      },
    };

    expect(getUserDisplayName(user)).toBe('Wilson');
  });

  it('should fallback to email when no name information is available', () => {
    const user = {
      username: 'testuser',
      attributes: {
        email: 'user@example.com',
      },
    };

    expect(getUserDisplayName(user)).toBe('user@example.com');
  });

  it('should fallback to username when no name or email is available', () => {
    const user = {
      username: 'cooluser123',
      attributes: {},
    };

    expect(getUserDisplayName(user)).toBe('cooluser123');
  });

  it('should fallback to username when attributes is undefined', () => {
    const user = {
      username: 'cooluser123',
    };

    expect(getUserDisplayName(user)).toBe('cooluser123');
  });

  it('should return "User" when user is null', () => {
    expect(getUserDisplayName(null)).toBe('User');
  });

  it('should return "User" when user is undefined', () => {
    expect(getUserDisplayName(undefined)).toBe('User');
  });

  it('should return "User" when user has no useful information', () => {
    const user = {
      attributes: {},
    };

    expect(getUserDisplayName(user)).toBe('User');
  });
});
