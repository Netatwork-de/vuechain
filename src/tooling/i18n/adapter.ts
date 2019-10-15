import { I18nFileMeta } from "./file-meta";
import { VcConfig } from "../config";
import { I18nPackageManifest } from "./package-manifest";
import { VcRunnerContext } from "../runners";
import { I18nMessages } from "./messages";

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

export interface I18nDependency {
	/** The config that was used during the build of the dependency. */
	readonly config: VcConfig;
	/** A set of full i18n keys that are required in the final bundle. */
	readonly keys: Set<string>;
}

export interface I18nAdapterContext {
	readonly config: VcConfig;
	readonly runner: VcRunnerContext;

	/** A map of source filenames to i18n related file information. */
	readonly files: ReadonlyMap<string, I18nFile>;

	getPackageConfig(context: string): Promise<VcConfig | undefined>;
	getPackageManifest(config: VcConfig): Promise<I18nPackageManifest | undefined>;

	bundleMessages(locale: string, messages: I18nMessages | string, path?: string): void;
}

export interface I18nAdapter {
	process(context: I18nAdapterContext): Promise<void> | void;
}
