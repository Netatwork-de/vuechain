import { readJson } from "fs-extra";
import { dirname, resolve, join } from "path";
import { ArgumentSpec, CommandError, formatUsage } from "@phylum/command";

export interface VcConfig {
	readonly filename: string;
	readonly context: string;
	readonly external: boolean;
	readonly packageType: VcPackageType;
	readonly rootDir: string;
	readonly outDir: string;

	readonly prefix?: string;
	readonly adapter?: string;
}

export type VcPackageType = "application" | "library";
export const VC_PACKAGE_TYPES = new Set<VcPackageType>(["application", "library"]);
export const VC_PACKAGE_TYPES_STR = Array.from(VC_PACKAGE_TYPES).map(t => `"${t}"`).join(", ");
export const VC_PACKAGE_TYPE_ARG = Object.assign((value: string, spec: ArgumentSpec) => {
	if (!VC_PACKAGE_TYPES.has(<any> value)) {
		throw new CommandError(`Usage: ${formatUsage(spec)}`);
	}
	return value as VcPackageType;
}, {
	displayName: VC_PACKAGE_TYPES_STR
});

export class ConfigError extends TypeError {
	constructor(public readonly filename: string, message: string) {
		super(message);
	}
}

export async function loadConfig(filename: string) {
	filename = resolve(filename);
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
	if (config.adapter !== undefined && typeof config.adapter !== "string") {
		throw new ConfigError(filename, `config.adapter must be undefined or a string.`);
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
