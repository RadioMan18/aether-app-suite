export interface NidusRequestPayload {
  type: "db:query" | "db:execute" | "broker:request";
  params?: Record<string, unknown>;
}

export interface NidusResponse<T = unknown> {
  id: string;
  success: boolean;
  data?: T;
  error?: string;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  icon?: string;
  permissions?: string[];
}

export interface DatabaseQueryParams {
  sql: string;
  params?: unknown[];
}

export interface DatabaseQueryResult {
  columns: string[];
  rows: unknown[][];
}

export interface DatabaseExecuteParams {
  sql: string;
  params?: unknown[];
}

export interface DatabaseExecuteResult {
  changes: number;
}

export interface BrokerRequestParams {
  targetPluginId: string;
  action: string;
  payload?: Record<string, unknown>;
}

export type BrokerResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};
