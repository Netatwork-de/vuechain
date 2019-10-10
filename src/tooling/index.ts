#!/usr/bin/env node
import { CommandSpec, CommandError } from "@phylum/command";
import { inspect } from "util";
import { ConfigError, loadConfig } from "./config";
import { resolve } from "path";
import { run } from "./runners";

;(async () => {
	const argv = process.argv.slice(2);
	const command = argv.shift();
	switch (command) {
		case "start":
		case "build":
			const args = new CommandSpec([
				{ name: "config", alias: "c", defaultValue: "vuechain.json" },
				{ name: "env", alias: "e", defaultValue: "development" }
			]).parse(argv);
			const config = await loadConfig(resolve(args.config));
			await run(config, {
				watch: command === "start",
				env: "development"
			});
			break;

		default:
			process.exitCode = 1;
			console.error(`Unknown command: "${command}"`);

		case "help":
		case undefined:
			console.log("// TODO: Somehow point to the readme.");
			break;
	}
})().catch(error => {
	process.exitCode = 1;
	if (error instanceof CommandError) {
		error = error.message;
	}
	if (error instanceof ConfigError) {
		error = `Invalid configuration (${error.filename}):\n${error.message}`;
	}
	console.error(typeof error === "string" ? error : inspect(error));
});
