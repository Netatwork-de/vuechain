#!/usr/bin/env node
import "v8-compile-cache";

import { CommandError } from "@phylum/command";
import { inspect } from "util";
import { ConfigError } from "./config";

;(async () => {
	const argv = process.argv.slice(2);
	const command = argv.shift();
	switch (command) {
		case "start":
		case "build":
			await (await import("./commands/build")).run(command, argv);
			break;

		case "clean":
			await (await import("./commands/clean")).run(command, argv);
			break;

		case "init":
			await (await import("./commands/init")).run(command, argv);
			break;

		default:
			process.exitCode = 1;
			console.error(`Unknown command: "${command}"`);

		case "help":
		case undefined:
			await (await import("./commands/help")).run(command, argv);
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
