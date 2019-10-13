import { I18nFileMeta } from "./file-meta";
import { VcConfig } from "../config";
import { I18nPackageManifest } from "./package-manifest";

export interface I18nPair {
	/** The full i18n key. */
	readonly key: string;
	/** The default english translation. */
	readonly value: string;
}

export interface I18nFile {
	readonly meta: I18nFileMeta;
	readonly pairs: I18nPair[];
}

export interface I18nAdapterContext {
	readonly files: ReadonlyMap<string, I18nFile>;

	getPackageConfig(context: string): Promise<VcConfig | undefined>;
	getPackageManifest(config: VcConfig): Promise<I18nPackageManifest | undefined>;
}
