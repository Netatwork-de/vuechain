import { CommandSpec } from "@phylum/command";
import { run as runBuildChain, VC_RUNNER_ENV_ARG, VcRunnerEnv } from "../runners";
import { loadConfig } from "../config";
import { resolve } from "path";

export async function run(command: string, argv: string[]) {
	const args = new CommandSpec([
		{ name: "config", alias: "c", defaultValue: "vuechain.json" },
		{ name: "env", alias: "e", type: VC_RUNNER_ENV_ARG }
	]).parse(argv);
	const config = await loadConfig(resolve(args.config));
	const env: VcRunnerEnv = args.env || (command === "start" ? "development" : "production");
	await runBuildChain(config, {
		watch: command === "start",
		env
	});
}
