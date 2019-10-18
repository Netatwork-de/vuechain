import verdaccio from "verdaccio";
import { join } from "path";
import { workspace } from "./utility";

export interface Registry {
	readonly address: string;
	dispose(): void;
}

export async function createRegistry() {
	const data = await workspace("registry");
	return new Promise<Registry>((resolve, reject) => {
		verdaccio({
			store: { memory: { limit: 1024 } },
			plugins: join(data, "plugins"),
			web: { enable: true },
			uplinks: { npmjs: { url: "https://registry.npmjs.org/" } },
			packages: {
				"@*/*": { access: "$all", publish: "$anonymous", unpublish: "$anonymous", proxy: "npmjs" },
				"**": { access: "$all", publish: "$anonymous", unpublish: "$anonymous", proxy: "npmjs" }
			},
			server: { keepAliveTimeout: 60 },
			logs: [{ type: "stdout", format: "pretty", level: "warn" }]
		}, 0, __filename, "vuechain", "7.7.7", (server: any) => {
			server.on("error", reject);
			server.listen(0, () => {
				resolve({
					address: `http://localhost:${server.address().port}/`,
					dispose() {
						server.close();
					}
				});
			});
		});
	});
}
