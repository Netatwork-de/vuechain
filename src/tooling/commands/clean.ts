import { CommandSpec } from "@phylum/command";
import { loadConfig } from "../config";
import { emptyDir } from "fs-extra";
import { CONTEXT } from "../cli-args";

export async function run(command: string, argv: string[]) {
	const args = new CommandSpec([CONTEXT]).parse(argv);
	const config = await loadConfig(args.context);
	await emptyDir(config.outDir);
}
