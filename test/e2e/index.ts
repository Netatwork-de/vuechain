import { createRegistry } from "./registry";
import { exec, workspace, context, changeJson, glob } from "./utility";
import { join } from "path";
import { copy, readdir } from "fs-extra";

(async () => {
	const registry = await createRegistry();
	console.log("Using registry:", registry.address);
	try {
		await exec("npm", ["run", "prepack"]);

		const packageDir = await workspace("vuechain");
		for (const name of (await readdir(context)).filter(n => !/^(?:node_modules|test|src|tsconfig.*)$/.test(n))) {
			await copy(join(context, name), join(packageDir, name));
		}
		await changeJson(join(packageDir, "package.json"), data => {
			(data.publishConfig || (data.publishConfig = { })).registry = registry.address;
			delete data.scripts.prepack;
		});
		await exec("npm", ["publish"], { cwd: packageDir, silent: true });

		await exec("ava", [
			"--tap",

			// Concurrency is limited to 1 as concurrent installations of packages
			// from the uplink registry can cause trouble with verdaccio.
			"--concurrency", "1",

			...await glob(join(__dirname, "tests"), "*.js")
		], {
			env: { VUECHAIN_TEST_REGISTRY: registry.address }
		});
	} finally {
		registry.dispose();
	}
})().catch(error => {
	console.error(error);
	process.exit(1);
});
