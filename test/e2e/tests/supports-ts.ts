import test from "ava";
import { workspace, stringify, exec, createLogStream } from "../utility";
import { createPackage, testPackageName, TSCONFIG_LIB, NPMIGNORE, DEFAULT_HTML } from "../packages";
import { join } from "path";
import { runApp, sendData, sendEnd } from "../app";

test("supports-ts", async t => {
	const dirname = await workspace("supports-ts");

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
				export function foo() {
					return "bar";
				}

				export * from "./bar";
			`,
			"src/bar.ts": `
				export function bar() {
					return "baz";
				}
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
				import { foo, bar } from "${testPackageName("lib")}";

				(async () => {
					await ${sendData(`{ foo: foo(), bar: bar() }`)};
					await ${sendEnd()};
				})();
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
		{ foo: "bar", bar: "baz" }
	]);

	t.pass();
});
