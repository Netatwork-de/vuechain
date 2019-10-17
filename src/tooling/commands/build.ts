import { CommandSpec } from "@phylum/command";
import { run as build, VcRunnerEnv } from "../runners";
import { loadConfig } from "../config";
import { CONFIG, RUNNER_ENV } from "../cli-args";

export async function run(command: string, argv: string[]) {
	const args = new CommandSpec([CONFIG, RUNNER_ENV]).parse(argv);
	const config = await loadConfig(args.config);
	const env: VcRunnerEnv = args.env || (command === "start" ? "development" : "production");
	await build(config, {
		watch: command === "start",
		env
	});
}
