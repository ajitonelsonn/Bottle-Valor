import "server-only";

/**
 * Server-only configuration. Credentials are NOT configured here: locally the
 * Google SDKs use Application Default Credentials (`gcloud auth
 * application-default login`); on Cloud Run they use the attached service
 * account. Only the Resend API key is a secret, read from the environment.
 */
function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

export const env = {
  projectId: required("GOOGLE_CLOUD_PROJECT", "botlevalor"),
  geminiModel: required("GEMINI_MODEL", "gemini-3.5-flash-lite"),
  geminiLocation: required("GEMINI_LOCATION", "global"),
  uploadsBucket: required("GCS_UPLOADS_BUCKET", "botlevalor-uploads"),
  publicBucket: required("GCS_PUBLIC_BUCKET", "botlevalor-public"),
  resendApiKey: process.env.RESEND_API_KEY || null,
  emailFrom: process.env.EMAIL_FROM || "BotleValor <onboarding@resend.dev>",
  /** Optional extra secret mixed into verification-code hashes. */
  codePepper: process.env.EMAIL_CODE_PEPPER || "",
};
