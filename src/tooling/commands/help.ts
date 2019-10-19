import { CommandSpec } from "@phylum/command";
import { readJson } from "fs-extra";
import { join } from "path";

export async function run(command: string | undefined, argv: string[]) {
	new CommandSpec().parse(argv);
	const packageInfo = await readJson(join(__dirname, "../../package.json"));
	console.log(`Visit ${packageInfo.homepage} for help.`);
}
