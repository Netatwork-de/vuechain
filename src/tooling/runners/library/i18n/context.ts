import { I18nAdapterContext, I18nFile } from "../../../i18n/adapter";
import { VcConfig, loadConfigFromContext } from "../../../config";
import { I18nPackageManifest, getPackageManifest } from "../../../i18n/package-manifest";
import { VcRunnerContext } from "../..";

export class I18nContext implements I18nAdapterContext {
	public constructor(
		public readonly config: VcConfig,
		public readonly runner: VcRunnerContext
	) { }

	private _packageConfigRequests = new Map<string, Promise<VcConfig | undefined>>();
	private _packageManifestRequests = new Map<string, Promise<I18nPackageManifest | undefined>>();

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
}
