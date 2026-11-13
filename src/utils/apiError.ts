export interface ApiErrorDetails {
  status?: number;
  message: string;
  fields: Record<string, string[]>;
}

export const getApiErrorDetails = (error: unknown, fallback: string): ApiErrorDetails => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error.response;
    if (typeof response === 'object' && response !== null) {
      const status = 'status' in response && typeof response.status === 'number'
        ? response.status
        : undefined;
      const data = 'data' in response ? response.data : null;
      if (typeof data === 'object' && data !== null) {
        const message = 'message' in data && typeof data.message === 'string'
          ? data.message
          : status === 403
            ? 'You do not have permission to perform this action.'
            : fallback;
        const rawErrors = 'errors' in data ? data.errors : null;
        const fields: Record<string, string[]> = {};
        if (typeof rawErrors === 'object' && rawErrors !== null) {
          Object.entries(rawErrors).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              fields[field] = messages.filter((value): value is string => typeof value === 'string');
            }
          });
        }
        return { status, message, fields };
      }
      return {
        status,
        message: status === 403 ? 'You do not have permission to perform this action.' : fallback,
        fields: {},
      };
    }
  }

  return {
    message: error instanceof Error ? error.message : fallback,
    fields: {},
  };
};
