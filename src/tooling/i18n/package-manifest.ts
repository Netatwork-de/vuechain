import { VcConfig } from "../config";
import { readJson } from "fs-extra";
import { join, resolve } from "path";

export interface I18nPackageManifest {
	/**
	 * A map of compiled (absolute) filenames to arrays of full
	 * i18n keys that are required to be available by the file.
	 */
	readonly keys: ReadonlyMap<string, string[]>;
	/**
	 * A set of locale ids that are supported by the package.
	 */
	readonly locales: Set<string>;
}

export interface I18nPackageManifestJson {
	version: 1;
	keys: I18nPackageManifestJsonKey[];
	locales: string[];
}

export interface I18nPackageManifestJsonKey {
	/* The compiled filename (relative to config.outDir) */
	filename: string;
	keys: string[];
}

export function getPackageManifestFilename(config: VcConfig) {
	return join(config.outDir, "i18n-manifest.json");
}

export async function getPackageManifest(config: VcConfig): Promise<I18nPackageManifest | undefined> {
	const filename = getPackageManifestFilename(config);
	const json: I18nPackageManifestJson = await readJson(filename);
	if (json) {
		if (json.version !== 1) {
			throw new Error(`Incompatible i18n package manifest version: ${json.version} in ${filename}`);
		}
		return <I18nPackageManifest> {
			keys: new Map(json.keys.map(entry => {
				return [
					resolve(config.outDir, entry.filename),
					entry.keys
				];
			})),
			locales: new Set(json.locales)
		};
	}
}
