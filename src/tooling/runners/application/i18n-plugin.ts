import { I18nPackageConfig, getPackageConfig } from "../../i18n/package-config";
import { I18nPackageManifest, getPackageManifest } from "../../i18n/package-manifest";
import { I18N_MODULE_META_KEY, I18N_PLUGIN_KEY } from "./common";
import { I18nFileMeta } from "../../i18n/file-meta";
import { readFile } from "fs-extra";
import { parseSource } from "../../i18n/parse-source";

const NAME = "vuechain i18n plugin";

export class I18nPlugin {
	private packageConfigRequests = new Map<string, Promise<I18nPackageConfig | undefined>>();
	private packageManifestRequests = new Map<string, Promise<I18nPackageManifest | undefined>>();
	private sourceRequests = new Map<string, Promise<string>>();
	private processingModules = new Map<string, Promise<void>>();

	public apply(compiler: any) {
		compiler.hooks.compilation.tap(NAME, (compilation: any) => {
			compilation[I18N_PLUGIN_KEY] = this;

			if (!compilation.compiler.parentCompilation) {
				this.packageConfigRequests.clear();
				this.packageManifestRequests.clear();
				this.sourceRequests.clear();
				this.processingModules.clear();
			}

			compilation.hooks.buildModule.tap(NAME, (module: any) => {
				this.sourceRequests.delete(module.resource);
				this.processingModules.delete(module.resource);
			});

			compilation.hooks.succeedModule.tap(NAME, (module: any) => {
				this.processModule(compiler, module);
			});

			compilation.hooks.finishModules.tapPromise(NAME, async (modules: any[]) => {
				for (const module of modules) {
					this.processModule(compiler, module);
				}
				await Promise.all(this.processingModules.values());
			});
		});

		compiler.hooks.emit.tapPromise(NAME, async (compilation: any) => {
			if (!compilation.getStats().hasErrors()) {
				console.log("TODO: Invoke external toolchain adapter.");
			}
		});
	}

	public getPackageConfig(context: string): Promise<I18nPackageConfig | undefined> {
		let request = this.packageConfigRequests.get(context);
		if (!request) {
			this.packageConfigRequests.set(context, request = getPackageConfig(context));
		}
		return request;
	}

	public async getPackageManifest(config: I18nPackageConfig): Promise<I18nPackageManifest | undefined> {
		let request = this.packageManifestRequests.get(config.context);
		if (!request) {
			this.packageManifestRequests.set(config.context, request = getPackageManifest(config));
		}
		return request;
	}

	private processModule(compiler: any, module: any) {
		const meta: I18nFileMeta = module[I18N_MODULE_META_KEY];
		if (meta && !this.processingModules.has(module.resource)) {
			const task = (async () => {
				const source = await this.readSource(compiler, module.resource);
				const entities = parseSource(source);
				// TODO: Justify source mode.
				// TODO: Register extracted pairs.
				console.log("Entities from: ", module.resource, ": ", entities);
			})();
			task.catch(() => { });
			this.processingModules.set(module.resource, task);
		}
	}

	private readSource(compiler: any, filename: string) {
		let request = this.sourceRequests.get(filename);
		if (!request) {
			const fs = compiler.inputFileSystem;
			if (fs && fs.readFile) {
				request = new Promise<string>((resolve, reject) => {
					fs.readFile(filename, (error: any, source: string | Buffer) => {
						if (error) {
							reject(error);
						} else {
							resolve(typeof source === "string" ? source : source.toString("utf8"));
						}
					});
				});
			} else {
				request = readFile(filename, "utf8");
			}
		}
		return request;
	}
}
