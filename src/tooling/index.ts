#!/usr/bin/env node
import "v8-compile-cache";

import { CommandSpec, CommandError } from "@phylum/command";
import { inspect } from "util";
import { ConfigError, loadConfig } from "./config";
import { resolve } from "path";
import { run, VcRunnerEnv, VC_RUNNER_ENV_ARG } from "./runners";

;(async () => {
	const argv = process.argv.slice(2);
	const command = argv.shift();
	switch (command) {
		case "start":
		case "build":
			const args = new CommandSpec([
				{ name: "config", alias: "c", defaultValue: "vuechain.json" },
				{ name: "env", alias: "e", type: VC_RUNNER_ENV_ARG }
			]).parse(argv);
			const config = await loadConfig(resolve(args.config));
			const env: VcRunnerEnv = args.env || (command === "start" ? "development" : "production");
			await run(config, {
				watch: command === "start",
				env
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
