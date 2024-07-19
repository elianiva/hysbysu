import { z } from "zod";

const envSchema = z.object({
	SIAKAD_URL: z.string(),
	SLC_URL: z.string(),
	LMS_URL: z.string(),
	NIM: z.string(),
	PASSWORD: z.string(),
	NOTIFICATION_API_SECRET: z.string(),
	NOTIFICATION_API_BASE_URL: z.string(),
	ENVIRONMENT: z.union([z.literal("production"), z.literal("development")]),
	STORAGE_PATH: z.string(),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);