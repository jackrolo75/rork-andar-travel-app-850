interface EnvVarEntry {
  value: string | undefined;
  required: boolean;
  description: string;
}

function getEnvSnapshot(): Record<string, EnvVarEntry> {
  return {
    EXPO_PUBLIC_RORK_API_BASE_URL: {
      value: process.env.EXPO_PUBLIC_RORK_API_BASE_URL,
      required: true,
      description: 'Base URL for the API',
    },
    EXPO_PUBLIC_RORK_DB_ENDPOINT: {
      value: process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT,
      required: true,
      description: 'Database endpoint',
    },
    EXPO_PUBLIC_RORK_DB_NAMESPACE: {
      value: process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE,
      required: true,
      description: 'Database namespace',
    },
    EXPO_PUBLIC_RORK_DB_TOKEN: {
      value: process.env.EXPO_PUBLIC_RORK_DB_TOKEN,
      required: true,
      description: 'Database access token',
    },
    EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY: {
      value: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      required: false,
      description: 'Stripe publishable key for payments',
    },
    EXPO_PUBLIC_PROJECT_ID: {
      value: process.env.EXPO_PUBLIC_PROJECT_ID,
      required: false,
      description: 'Project identifier',
    },
    EXPO_PUBLIC_TOOLKIT_URL: {
      value: process.env.EXPO_PUBLIC_TOOLKIT_URL,
      required: false,
      description: 'Toolkit URL for AI features',
    },
  };
}

interface ValidationResult {
  valid: boolean;
  missingRequired: string[];
  missingOptional: string[];
}

const isDev = __DEV__;

function isSet(val: string | undefined): boolean {
  return val !== undefined && val !== null && val !== '' && val !== 'undefined';
}

export function validateEnv(): ValidationResult {
  const snapshot = getEnvSnapshot();
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];

  for (const [name, entry] of Object.entries(snapshot)) {
    if (!isSet(entry.value)) {
      if (entry.required) {
        missingRequired.push(`${name}: ${entry.description}`);
      } else {
        missingOptional.push(`${name}: ${entry.description}`);
      }
    }
  }

  if (isDev) {
    if (missingRequired.length > 0) {
      console.warn(
        `[AndarTravel] Missing required environment variables:\n` +
          missingRequired.map((v) => `  - ${v}`).join('\n')
      );
    }
    if (missingOptional.length > 0) {
      console.warn(
        `[AndarTravel] Missing optional environment variables:\n` +
          missingOptional.map((v) => `  - ${v}`).join('\n')
      );
    }
    if (missingRequired.length === 0 && missingOptional.length === 0) {
      console.log('[AndarTravel] All environment variables loaded successfully.');
    }
  }

  return {
    valid: missingRequired.length === 0,
    missingRequired,
    missingOptional,
  };
}

function safeGet(value: string | undefined, name: string): string {
  if (isSet(value)) {
    return value as string;
  }

  if (isDev) {
    console.warn(`[AndarTravel] ${name} is not set.`);
  }

  return '';
}

export function getApiBaseUrl(): string {
  return safeGet(process.env.EXPO_PUBLIC_RORK_API_BASE_URL, 'EXPO_PUBLIC_RORK_API_BASE_URL');
}

export function getDbEndpoint(): string {
  return safeGet(process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT, 'EXPO_PUBLIC_RORK_DB_ENDPOINT');
}

export function getDbNamespace(): string {
  return safeGet(process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE, 'EXPO_PUBLIC_RORK_DB_NAMESPACE');
}

export function getDbToken(): string {
  return safeGet(process.env.EXPO_PUBLIC_RORK_DB_TOKEN, 'EXPO_PUBLIC_RORK_DB_TOKEN');
}

export function getStripePublishableKey(): string {
  return safeGet(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY, 'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY');
}

export function getToolkitUrl(): string {
  return safeGet(process.env.EXPO_PUBLIC_TOOLKIT_URL, 'EXPO_PUBLIC_TOOLKIT_URL');
}

export function getProjectId(): string {
  return safeGet(process.env.EXPO_PUBLIC_PROJECT_ID, 'EXPO_PUBLIC_PROJECT_ID');
}
