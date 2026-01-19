const env = import.meta.env.MODE || "development";
function getEnvVariable(key: string, required?: true): string;
function getEnvVariable(key: string, required?: false): string | undefined;
function getEnvVariable(key: string, required = true): string | undefined {
  const value = import.meta.env[key] as string | undefined;
  if (required && value === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
}

export const Config = {
  ENV: env,
  SERVICE_NAME: getEnvVariable("VITE_ENV_SERVICE_NAME"),
  PORT: getEnvVariable("VITE_ENV_PORT"),
  API_URL: getEnvVariable("VITE_ENV_API_URL"),
};
