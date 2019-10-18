import { ensureDir, writeFile } from "fs-extra";
import { dirname, join } from "path";
import { exec, stringify } from "./utility";

const REGISTRY = <string> process.env.VUECHAIN_TEST_REGISTRY;
const REGISTRY_ARGV = ["--registry", REGISTRY];

export async function createPackage({
	cwd,
	name,
	version = "1.0.0",
	main,
	dependencies = [],
	devDependencies = [],
	scripts = {},
	files,
	publish
}: {
	cwd: string;
	name: string;
	version?: string;
	main?: string;
	dependencies?: string[];
	devDependencies?: string[];
	scripts?: any;
	files: { [name: string]: string };
	publish: boolean;
}) {
	await ensureDir(cwd);

	await ensureDir(cwd);
	await writeFile(join(cwd, "package.json"), stringify({
		name,
		version,
		publishConfig: { registry: REGISTRY },
		main,
		scripts
	}));

	for (const name in files) {
		const filename = join(cwd, name);
		await ensureDir(dirname(filename));
		await writeFile(filename, files[name]);
	}

	if (dependencies.length > 0) {
		await exec("npm", ["install", ...REGISTRY_ARGV, ...dependencies], { cwd, silent: true });
	}
	await exec("npm", ["install", ...REGISTRY_ARGV, "--save-dev", "vuechain", ...devDependencies], { cwd, silent: true });

	if (publish) {
		// Registry is set via package publish config.
		await exec("npm", ["publish"], { cwd, silent: true });
	}
}

export function testPackageName(name: string) {
	return `@vuechain-test/${name}-${process.pid}`;
}

export const TSCONFIG_LIB = stringify({
	compilerOptions: {
		target: "es6",
		module: "esnext",
		moduleResolution: "node",
		declaration: true,
		sourceMap: true,
		rootDir: "./src",
		outDir: "./dist"
	},
	include: [
		"./src/**/*"
	]
});

export const NPMIGNORE = `
/node_modules
/src
/tsconfig*
`;

export const DEFAULT_HTML = `<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>VueChain Test</title>
	</head>
	<body>
		<div id="app"></div>
	</body>
</html>
`;
