import { readFile, writeFile } from "fs-extra";
import { I18nPackageManifest, getPackageManifest } from "../../i18n/package-manifest";
import { I18nFileMeta } from "../../i18n/file-meta";
import { parseSource } from "../../i18n/parse-source";
import { VcConfig, loadConfigFromContext } from "../../config";
import { justifySource } from "../../i18n/justify-source";
import { I18nPair, I18nFile, I18nAdapterContext, I18nDependency } from "../../i18n/adapter";
import { VcRunnerContext } from "..";
import { I18N_MODULE_META_KEY, I18N_PLUGIN_KEY, I18N_MODULE_CONFIG_KEY } from "./common";

const NAME = "vuechain i18n plugin";

export class I18nPlugin implements I18nAdapterContext {
	public constructor(
		public readonly config: VcConfig,
		public readonly runner: VcRunnerContext
	) { }

	private _packageConfigRequests = new Map<string, Promise<VcConfig | undefined>>();
	private _packageManifestRequests = new Map<string, Promise<I18nPackageManifest | undefined>>();
	private _sourceRequests = new Map<string, Promise<string>>();
	private _processingModules = new Map<string, Promise<void>>();

	public readonly files = new Map<string, I18nFile>();
	public readonly dependencies = new Map<string, I18nDependency>();

	/** @internal */
	public apply(compiler: any) {
		compiler.hooks.compilation.tap(NAME, (compilation: any) => {
			compilation[I18N_PLUGIN_KEY] = this;

			if (!compilation.compiler.parentCompilation) {
				this._packageConfigRequests.clear();
				this._packageManifestRequests.clear();
				this._sourceRequests.clear();
				this._processingModules.clear();
				this.files.clear();
			}

			compilation.hooks.buildModule.tap(NAME, (module: any) => {
				this._sourceRequests.delete(module.resource);
				this._processingModules.delete(module.resource);
			});

			compilation.hooks.succeedModule.tap(NAME, (module: any) => {
				this.processModule(compiler, module);
			});

			compilation.hooks.finishModules.tapPromise(NAME, async (modules: any[]) => {
				for (const module of modules) {
					this.processModule(compiler, module);
				}
				await Promise.all(this._processingModules.values());
			});
		});

		compiler.hooks.emit.tapPromise(NAME, async (compilation: any) => {
			if (!compilation.getStats().hasErrors()) {
				console.log("TODO: Invoke external toolchain adapter.");
				console.log("Files to localize:", this.files);
				console.log("Dependencies to bundle:", this.dependencies);
			}
		});
	}

	public getDependency(config: VcConfig) {
		let dependency = this.dependencies.get(config.context);
		if (!dependency) {
			this.dependencies.set(config.context, dependency = { config, keys: new Set() });
		}
		return dependency;
	}

	public getPackageConfig(context: string): Promise<VcConfig | undefined> {
		let request = this._packageConfigRequests.get(context);
		if (!request) {
			this._packageConfigRequests.set(context, request = loadConfigFromContext(context));
		}
		return request;
	}

	public async getPackageManifest(config: VcConfig): Promise<I18nPackageManifest | undefined> {
		let request = this._packageManifestRequests.get(config.context);
		if (!request) {
			this._packageManifestRequests.set(config.context, request = getPackageManifest(config));
		}
		return request;
	}

	private processModule(compiler: any, module: any) {
		const config: VcConfig = module[I18N_MODULE_CONFIG_KEY];
		const meta: I18nFileMeta = module[I18N_MODULE_META_KEY];
		if (meta && !this._processingModules.has(module.resource)) {
			const task = (async () => {
				const prefix = meta.getPrefix(config);
				const source = await this.readSource(compiler, module.resource);
				const entities = parseSource(source);
				if (compiler.watchMode) {
					const { pairs, output } = justifySource(source, entities);
					if (source !== output) {
						await this.writeSource(module.resource, output);
					}
					this.files.set(module.resource, {
						meta,
						pairs: pairs.map<I18nPair>(p => ({ key: prefix + p.key, value: p.value }))
					});
				} else {
					this.files.set(module.resource, {
						meta,
						pairs: entities
							.filter(e => e.key !== undefined)
							.map<I18nPair>(e => ({ key: prefix + e.key, value: e.value }))
					});
				}
			})();
			task.catch(() => { });
			this._processingModules.set(module.resource, task);
		}
	}

	private readSource(compiler: any, filename: string) {
		let request = this._sourceRequests.get(filename);
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

	private async writeSource(filename: string, source: string) {
		this._sourceRequests.set(filename, Promise.resolve(source));
		await writeFile(filename, source);
	}
}
