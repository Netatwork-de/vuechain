import { VcConfig } from "../config";

export interface I18nPackageManifest {
}

export function getPackageManifest(config: VcConfig): Promise<I18nPackageManifest | undefined> {
	// TODO: Load manifest.
	return Promise.resolve(undefined);
}
