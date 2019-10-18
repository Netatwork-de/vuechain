import { CommandSpec } from "@phylum/command";
import { resolve, basename, join } from "path";
import read = require("read");
import colors = require("ansi-colors");
import { isValidPackageName, PACKAGE_NAME, PACKAGE_TYPE } from "../cli-args";
import { readdir, ensureDir, writeFile, copy } from "fs-extra";
import { spawn } from "child_process";

export async function run(command: string, argv: string[]) {
	const args = new CommandSpec([
		{ name: "path", defaultFallback: true, defaultValue: "." },
		PACKAGE_NAME,
		PACKAGE_TYPE
	]).parse(argv);

	const path = resolve(args.path);

	const name = args.name || (await question("Enter a package name", args.name || basename(path), name => {
		if (isValidPackageName(name)) {
			return true;
		}
		console.log(`"${name}" is not a valid package name.`);
	}));

	const type = args.type || (await question("Do you want to create an application (a) or a library (L)?", "a", type => {
		if (["a", "l"].includes(type.toLowerCase())) {
			return true;
		}
		console.log(`Please enter "a" for application or "L" for library.`);
	}, type => {
		return { a: "application", l: "library" }[type.toLowerCase()];
	}));

	await ensureDir(path);
	const contents = (await readdir(path)).filter(n => /^(?:src|package.json|vuechain.json|tsconfig.json)$/.test(n));
	if (contents.length > 0) {
		console.log(colors.redBright(`The directory already contains: ${contents.join(", ")}`));
		process.exitCode = 1;
		return;
	}

	console.log(`Creating new vuechain ${colors.blueBright(type)} "${colors.greenBright(name)}" ${colors.gray(`(in: ${path})`)}`);

	await writeFile(join(path, "package.json"), JSON.stringify({
		name,
		version: "1.0.0",
		description: `A vuechain ${type}`,
		main: type === "library" ? "./dist" : undefined,
		scripts: {
			start: "vuechain start",
			build: "vuechain build",
			clean: "vuechain clean",
			prepack: "vuechain clean && vuechain build"
		},
		dependencies: {},
		devDependencies: {}
	}, null, "\t") + "\n");

	await writeFile(join(path, "vuechain.json"), JSON.stringify({
		packageType: type,
		prefix: type === "library" ? name : undefined
	}, null, "\t") + "\n");

	await copy(join(__dirname, "../../prefabs", type), path);

	await new Promise((resolve, reject) => {
		const npm = spawn("npm", ["install", "--save-dev", "vuechain"], {
			cwd: path,
			stdio: "inherit",
			shell: true
		});
		npm.on("error", reject)
		npm.on("exit", (code, signal) => {
			if (code || signal) {
				reject(code || signal);
			} else {
				resolve();
			}
		});
	});
}

async function question<T = string>(prompt: string, defaultValue?: string, validate?: (value: string) => boolean | void, map?: (value: string) => T): Promise<T> {
	let value: string | undefined;
	while (!value || (validate && !validate(value))) {
		value = await new Promise<string>((resolve, reject) => {
			read({
				prompt: `${prompt}${defaultValue ? ` (${defaultValue})` : ""}> `
			}, (error, value) => {
				if (error) {
					reject(error);
				} else {
					resolve(value.trim() || defaultValue);
				}
			});
		});
	}
	return <T> (map ? map(value) : value);
}
