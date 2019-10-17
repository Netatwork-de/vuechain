import test from "ava";
import { workspace, stringify, createLogStream, exec } from "../utility";
import { createPackage, testPackageName, TSCONFIG_LIB, NPMIGNORE, DEFAULT_HTML } from "../packages";
import { join } from "path";
import { runApp, sendEnd, sendData } from "../app";

test("supports-vue", async t => {
	const dirname = await workspace("supports-vue");

	await createPackage({
		cwd: join(dirname, "lib"),
		name: testPackageName("lib"),
		main: "./dist/index.js",
		scripts: {
			prepack: "vuechain build"
		},
		files: {
			"tsconfig.json": TSCONFIG_LIB,
			".npmignore": NPMIGNORE,
			"src/index.ts": `
				/// <reference types="vuechain" />
				export { default as ExampleComponent } from "./example-component.vue";
			`,
			"src/example-component.vue": `
				<template>
					<div>
						foo <slot /> bar: {{ value }}
					</div>
				</template>

				<script lang="ts">
					import Vue from "vue";

					export default Vue.extend({
						props: {
							value: String
						}
					});
				</script>
			`,
			"vuechain.json": stringify({
				packageType: "library"
			})
		},
		publish: true
	});

	const app = join(dirname, "app");
	await createPackage({
		cwd: app,
		name: testPackageName("app"),
		scripts: {
			build: "vuechain build"
		},
		dependencies: [testPackageName("lib")],
		files: {
			"tsconfig.json": TSCONFIG_LIB,
			".npmignore": NPMIGNORE,
			"src/index.ts": `
				import { bootstrap } from "vuechain";
				import App from "./app.vue";

				(async () => {
					await bootstrap({
						app: App
					});

					await ${sendData(`{ body: document.body.innerHTML }`)};
					await ${sendEnd()};
				})();
			`,
			"src/app.vue": `
				<template>
					<div>
						<h1>app</h1>
						<example-component value="42">baz</example-component>
					</div>
				</template>

				<script lang="ts">
					import Vue from "vue";
					import { ExampleComponent } from "${testPackageName("lib")}";

					export default Vue.extend({
						components: { ExampleComponent }
					});
				</script>
			`,
			"src/index.html": DEFAULT_HTML,
			"vuechain.json": stringify({
				packageType: "application"
			})
		},
		publish: false
	});

	await exec("npm", ["run", "build"], {
		cwd: app,
		output: createLogStream(app, "build")
	});

	const chunks = await runApp({ cwd: app });
	t.deepEqual(chunks, [
		{ body: "<div><h1>app</h1><div> foo baz bar: 42 </div></div>" }
	]);
	t.pass();
});
