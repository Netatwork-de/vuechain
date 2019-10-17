import { join } from "path";
import { spawn } from "child_process";
import { emptyDir, readJson, writeFile, readFile, createWriteStream } from "fs-extra";
import globCallback = require("glob");

export const context = join(__dirname, "../../..");

export async function workspace(name: string) {
	const dirname = join(__dirname, `workspace/${name}-${process.pid}`);
	await emptyDir(dirname);
	return dirname;
}

export function createLogStream(workspace: string, name: string) {
	return createWriteStream(join(workspace, `log-${name}.txt`), { autoClose: true, encoding: "utf8" });
}

export function exec(command: string, argv: string[], {
	cwd = context,
	env = { },
	output
}: {
	cwd?: string;
	env?: NodeJS.ProcessEnv;
	output?: NodeJS.WritableStream;
} = { }) {
	console.log(`${cwd}> ${command} ${argv.join(" ")}`);
	return new Promise((resolve, reject) => {
		const proc = spawn(command, argv, {
			cwd,
			stdio: output ? ["ignore", "pipe", "pipe"] : "inherit",
			shell: true,
			env: Object.assign(Object.create(process.env), env)
		});
		if (output) {
			output.write(`\n${cwd}> ${command} ${argv.join(" ")}\n\n`);
			proc.stdout.pipe(output);
			proc.stderr.pipe(output);
		}
		proc.on("error", reject);
		proc.on("exit", (code, signal) => {
			if (code || signal) {
				reject(new Error(`${command} exited wrongly: ${code || signal}`));
			} else {
				resolve();
			}
		});
	});
}

export async function changeJson(filename: string, action: (data: any) => void | Promise<void>) {
	const data = await readJson(filename);
	await action(data);
	await writeFile(filename, stringify(data));
}

export async function changeText(filename: string, action: (data: string) => string | Promise<string>) {
	await writeFile(filename, await action(await readFile(filename, "utf8")));
}

export function glob(cwd: string, pattern: string) {
	return new Promise<string[]>((resolve, reject) => {
		globCallback(pattern, { cwd }, (error, names) => {
			if (error) {
				reject(error);
			} else {
				resolve(names.map(name => join(cwd, name)));
			}
		});
	});
}

export function stringify(data: any) {
	return JSON.stringify(data, null, "\t") + "\n";
}
