function req(name: string): string {
  const v = process.env[name];

  if (!v) throw new Error(`Missing env ${name}`);

  return v;
}

export const config = {
  databaseUrl: req("DATABASE_URL"),
  redisUrl: req("REDIS_URL"),
  r2: {
    endpoint: req("R2_S3_ENDPOINT_URL"),
    accessKeyId: req("R2_ACCESS_KEY_ID"),
    secretAccessKey: req("R2_SECRET_ACCESS_KEY"),
    bucket: req("R2_BUCKET_NAME"),
  },
  queueName: "submit-resume",
  concurrency: parseInt(process.env.WORKER_CONCURRENCY ?? "2", 10),
};
