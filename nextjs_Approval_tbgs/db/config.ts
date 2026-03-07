export function getDatabaseUrl() {
  const rawValue = process.env.DATABASE_URL?.trim();

  if (!rawValue) {
    throw new Error(
      "DATABASE_URL is not set. Add a valid Postgres connection string to your environment."
    );
  }

  const normalizedValue = rawValue.startsWith("DATABASE_URL=")
    ? rawValue.slice("DATABASE_URL=".length)
    : rawValue;

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(normalizedValue);
  } catch {
    throw new Error(
      "DATABASE_URL is invalid. Expected a full Postgres URL like postgresql://user:password@host:5432/database."
    );
  }

  if (!["postgres:", "postgresql:"].includes(parsedUrl.protocol)) {
    throw new Error(
      `DATABASE_URL must use the postgres or postgresql protocol. Received: ${parsedUrl.protocol}`
    );
  }

  return normalizedValue;
}
