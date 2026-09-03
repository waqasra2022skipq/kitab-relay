export interface LiveHealthResponse {
  status: 'ok';
  service: 'kitab-relay-api';
}

export interface ReadyHealthResponse extends LiveHealthResponse {
  checks: {
    database: 'up';
  };
}