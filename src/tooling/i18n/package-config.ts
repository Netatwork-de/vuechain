import { join } from "path";
import { readJson } from "fs-extra";

export interface I18nPackageConfig {
	readonly context: string;
	readonly filename: string;
	readonly external: boolean;
	readonly prefix?: string;
}

export async function getPackageConfig(context: string) {
	const filename = join(context, "i18n-package.json");
	try {
		const config = await readJson(filename);
		if (config.prefix !== undefined && typeof config.prefix !== "string") {
			throw new Error(`config.prefix must be undefined or a string. In ${filename}`);
		}
		config.context = context;
		config.filename = filename;
		config.external = /[\\\/]node_modules[\\\/]/.test(context);
		return config as I18nPackageConfig;
	} catch (error) {
		if (error.code !== "ENOENT") {
			throw error;
		}
	}
}
