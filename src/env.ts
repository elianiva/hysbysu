const NODE_ENV = process.env.NODE_ENV ?? "development"; // dev by default

export const IS_DEV = NODE_ENV === "development";
export const NIM = process.env.NIM ?? "";
export const PASSWORD = process.env.PASSWORD ?? "";
export const SIAKAD_URL = process.env.SIAKAD_URL ?? "";
export const LMS_URL = process.env.LMS_URL ?? "";
