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
	/** File meta information. */
	readonly meta: I18nFileMeta;
	/** The i18n pairs that were extracted from the file. */
	readonly pairs: I18nPair[];
}

export interface I18nAdapterContext {
	/** A map of source filenames to i18n related file information. */
	readonly files: ReadonlyMap<string, I18nFile>;

	getPackageConfig(context: string): Promise<VcConfig | undefined>;
	getPackageManifest(config: VcConfig): Promise<I18nPackageManifest | undefined>;
}
