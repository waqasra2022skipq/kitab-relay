import createClient from 'openapi-fetch';
import type { paths } from './schema.js';

export type { paths } from './schema.js';


export function createKitabRelayClient(baseUrl: string) {
  return createClient<paths>({ baseUrl });
}