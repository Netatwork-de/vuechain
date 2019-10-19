import { CommandSpec } from "@phylum/command";
import { run as build, VcRunnerEnv } from "../runners";
import { loadConfig } from "../config";
import { CONTEXT, RUNNER_ENV } from "../cli-args";

export async function run(command: string, argv: string[]) {
	const args = new CommandSpec([CONTEXT, RUNNER_ENV]).parse(argv);
	const config = await loadConfig(args.context);
	const env: VcRunnerEnv = args.env || (command === "start" ? "development" : "production");
	await build(config, {
		watch: command === "start",
		env
	});
}
