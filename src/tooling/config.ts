import { readJson } from "fs-extra";
import { dirname, resolve } from "path";

export interface VcConfig {
	readonly context: string;
	readonly packageType: VcPackageType;
	readonly rootDir: string;
	readonly outDir: string;
}

export type VcPackageType = "application" | "library";
const VC_PACKAGE_TYPES = new Set<VcPackageType>(["application", "library"]);
const VC_PACKAGE_TYPES_STR = Array.from(VC_PACKAGE_TYPES).map(t => `"${t}"`).join(", ");

export class ConfigError extends TypeError {
	constructor(public readonly filename: string, message: string) {
		super(message);
	}
}

export async function loadConfig(filename: string) {
	const config = await readJson(filename).catch(error => {
		if (error && error.code === "ENOENT") {
			throw new ConfigError(filename, "File not found.");
		}
	});

	const context = config.context = resolve(dirname(filename), config.context || ".");

	if (!VC_PACKAGE_TYPES.has(config.packageType)) {
		throw new ConfigError("filename", `config.packageType must be one of ${VC_PACKAGE_TYPES_STR}`);
	}

	config.rootDir = resolve(context, config.rootDir || "src");
	config.outDir = resolve(context, config.outDir || "dist");

	return <VcConfig> config;
}
