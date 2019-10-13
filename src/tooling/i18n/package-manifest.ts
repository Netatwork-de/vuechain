import { I18nPackageConfig } from "./package-config";

export interface I18nPackageManifest {
}

export function getPackageManifest(config: I18nPackageConfig): Promise<I18nPackageManifest | undefined> {
	// TODO: Load manifest.
	return Promise.resolve(undefined);
}
