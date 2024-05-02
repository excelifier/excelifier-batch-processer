import dotenv from "dotenv";

dotenv.config();

// Extend the type to include OCR and OCR_LANG variables
type EnvConfig = {
  dirIn: string;
  dirOut: string;
  bearerToken: string;
  notifyEmail?: string;
  orgId: string;
  apiHost: string;
  schemaUuid?: string;
  ocr: boolean;
  ocrLang?: string;
};

// Function to safely access environment variables and throw an error if required ones are missing
const getEnv = (key: string, required: boolean = true): string | undefined => {
  const value = process.env[key];
  if (required && value === undefined) {
    throw new Error(`Environment variable ${key} is missing`);
  }
  return value;
};

// Convert string to boolean, default to false if not defined
const getEnvBoolean = (key: string, defaultValue: boolean = false): boolean => {
  const value = getEnv(key, false);
  return value ? value.toLowerCase() === "true" : defaultValue;
};

// Initialize the configuration object, check OCR condition for OCR_LANG
const config: EnvConfig = {
  dirIn: getEnv("DIR_IN")!,
  dirOut: getEnv("DIR_OUT")!,
  bearerToken: getEnv("BEARER_TOKEN")!,
  orgId: getEnv("ORG_ID")!,
  notifyEmail: getEnv("NOTIFY_EMAIL", false),
  apiHost: getEnv("API_HOST", false) || "https://api.excelifier.com",
  schemaUuid: getEnv("SCHEMA_UUID", false),
  ocr: getEnvBoolean("OCR"), // Convert the OCR environment variable to boolean, default to false
  ocrLang: undefined, // Initialize as undefined, will conditionally set below
};

// Conditionally require OCR_LANG if OCR is true
if (config.ocr) {
  const ocrLang = getEnv("OCR_LANG", true);
  if (ocrLang) {
    config.ocrLang = ocrLang;
  } else {
    throw new Error("OCR_LANG is required when OCR is set to true");
  }
}

export default config;
