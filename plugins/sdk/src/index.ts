import { sendRequest } from "./bridge";
import type { DatabaseQueryResult, DatabaseExecuteResult, BrokerRequestParams, BrokerResponse } from "./types";

export const db = {
  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    const result = await sendRequest<DatabaseQueryResult>({
      type: "db:query",
      params: { sql, params },
    });

    if (!result || !Array.isArray(result.columns)) {
      return [];
    }

    const columns = result.columns as string[];
    const rows = result.rows as unknown[][];

    return rows.map((row) => {
      const obj: Record<string, unknown> = {};
      columns.forEach((col, index) => {
        obj[col] = row[index];
      });
      return obj as T;
    });
  },

  async execute(sql: string, params?: unknown[]): Promise<DatabaseExecuteResult> {
    const result = await sendRequest<DatabaseExecuteResult>({
      type: "db:execute",
      params: { sql, params },
    });

    return result ?? { changes: 0 };
  },
};

export const broker = {
  async request<T = unknown>(params: BrokerRequestParams): Promise<BrokerResponse<T>> {
    const raw = await sendRequest<unknown>({
      type: "broker:request",
      params: { ...params },
    });

    if (!raw) {
      return { success: false, error: "No response from broker" };
    }

    const data = raw as Record<string, unknown>;
    if (Array.isArray(data.columns) && Array.isArray(data.rows)) {
      const columns = data.columns as string[];
      const rows = data.rows as unknown[][];
      return {
        success: true,
        data: rows.map((row) => {
          const obj: Record<string, unknown> = {};
          columns.forEach((col, index) => {
            obj[col] = row[index];
          });
          return obj as T;
        }) as T,
      };
    }

    return { success: true, data: raw as T };
  },
};

export { sendRequest } from "./bridge";
export type { DatabaseQueryParams, DatabaseQueryResult, DatabaseExecuteParams, DatabaseExecuteResult, BrokerRequestParams, BrokerResponse } from "./types";
