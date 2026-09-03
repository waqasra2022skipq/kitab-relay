import { describe, it, expect } from 'vitest';
import { validateEnvironment } from './environment.js';

describe('validateEnvironment', () => {
  it('coerces and accepts a complete development environment', () => {
    expect(validateEnvironment({
      NODE_ENV: 'development',
      PORT: '4000',
      DATABASE_URL: 'postgresql://kitab_relay:kitab_relay@localhost:5432/kitab_relay',
      WEB_ORIGIN: 'http://localhost:3000',
    }),
    ).toEqual({
      NODE_ENV: 'development',
      PORT: 4000,
      DATABASE_URL: 'postgresql://kitab_relay:kitab_relay@localhost:5432/kitab_relay',
      WEB_ORIGIN: 'http://localhost:3000',
    });
  });

  it('rejects a missing database URL', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'test',
        PORT: '4000',
        WEB_ORIGIN: 'http://localhost:3000',
      }),
    ).toThrow();
  });
  
});