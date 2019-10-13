import { readJson } from "fs-extra";
import { dirname, resolve, join } from "path";

export interface VcConfig {
	readonly filename: string;
	readonly context: string;
	readonly external: boolean;
	readonly packageType: VcPackageType;
	readonly rootDir: string;
	readonly outDir: string;

	readonly prefix?: string;
}

export type VcPackageType = "application" | "library";
export const VC_PACKAGE_TYPES = new Set<VcPackageType>(["application", "library"]);
export const VC_PACKAGE_TYPES_STR = Array.from(VC_PACKAGE_TYPES).map(t => `"${t}"`).join(", ");

export class ConfigError extends TypeError {
	constructor(public readonly filename: string, message: string) {
		super(message);
	}
}

export async function loadConfig(filename: string) {
	const config = await readJson(filename);
	const context = config.context = dirname(filename);
	config.filename = filename;
	config.external = /[\\\/]node_modules[\\\/]/.test(context);

	if (!VC_PACKAGE_TYPES.has(config.packageType)) {
		throw new ConfigError(filename, `config.packageType must be one of ${VC_PACKAGE_TYPES_STR}`);
	}

	config.rootDir = resolve(context, config.rootDir || "src");
	config.outDir = resolve(context, config.outDir || "dist");

	if (config.prefix !== undefined && typeof config.prefix !== "string") {
		throw new ConfigError(filename, `config.prefix must be undefined or a string.`);
	}

	return <VcConfig> config;
}

export function loadConfigFromContext(context: string) {
	return loadConfig(join(context, "vuechain.json")).catch(error => {
		if (error && error.code === "ENOENT") {
			return undefined;
		}
		throw error;
	});
}
