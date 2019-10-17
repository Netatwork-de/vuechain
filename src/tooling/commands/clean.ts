import { CommandSpec } from "@phylum/command";
import { loadConfig } from "../config";
import { emptyDir } from "fs-extra";
import { CONFIG } from "../cli-args";

export async function run(command: string, argv: string[]) {
	const args = new CommandSpec([CONFIG]).parse(argv);
	const config = await loadConfig(args.config);
	await emptyDir(config.outDir);
}
