import { posix } from "path";
import { I18nAdapterContext, I18nFile } from "../../../i18n/adapter";
import { VcConfig, loadConfigFromContext } from "../../../config";
import { I18nPackageManifest, getPackageManifest, I18nPackageManifestJson, I18nPackageManifestJsonKey } from "../../../i18n/package-manifest";
import { VcRunnerContext } from "../..";

export class I18nContext implements I18nAdapterContext {
	public constructor(
		public readonly config: VcConfig,
		public readonly runner: VcRunnerContext
	) { }

	private _packageConfigRequests = new Map<string, Promise<VcConfig | undefined>>();
	private _packageManifestRequests = new Map<string, Promise<I18nPackageManifest | undefined>>();
	private _sourceOutputRelations = new Map<string, string>();

	public readonly files = new Map<string, I18nFile>();

	public getPackageConfig(context: string): Promise<VcConfig | undefined> {
		let request = this._packageConfigRequests.get(context);
		if (!request) {
			this._packageConfigRequests.set(context, request = loadConfigFromContext(context));
		}
		return request;
	}

	public getPackageManifest(config: VcConfig): Promise<I18nPackageManifest | undefined> {
		let request = this._packageManifestRequests.get(config.context);
		if (!request) {
			this._packageManifestRequests.set(config.context, request = getPackageManifest(config));
		}
		return request;
	}

	/**
	 * Add an output-source file relation.
	 * @param distOutputFilename The output filename (relative to config.outDir)
	 * @param sourceFilename The source filename.
	 */
	public setOutputSourceRelation(distOutputFilename: string, sourceFilename: string) {
		if (/\.js$/.test(sourceFilename) && !this.files.has(sourceFilename)) {
			sourceFilename = sourceFilename.replace(/\.js$/, ".ts");
		}
		distOutputFilename = distOutputFilename.replace(/\\/g, "/");
		if (this.files.has(sourceFilename)) {
			this._sourceOutputRelations.set(sourceFilename, distOutputFilename);
		}
	}

	/** Generate a manifest from the current context. */
	public generateManifest(): I18nPackageManifestJson {
		// console.log(this.files);
		// console.log(this._sourceOutputRelations);
		const keys: I18nPackageManifestJsonKey[] = [];
		for (const [filename, file] of this.files) {
			if (file.meta.context === this.config.context && this._sourceOutputRelations.get(filename) && file.pairs.length > 0) {
				keys.push({
					filename: this._sourceOutputRelations.get(filename) as string,
					keys: file.pairs.map(pair => pair.key)
				});
			}
		}
		return { version: 1, keys };
	}
}
