export type Env = {
	HYSBYSU_STORAGE: KVNamespace;
	SIAKAD_URL: string;
	SLC_URL: string;
	LMS_URL: string;
	NIM: string;
	PASSWORD: string;
	NOTIFICATION_API_SECRET: string;
	NOTIFICATION_API_BASE_URL: string;
	ENVIRONMENT: "production" | "development";
};
