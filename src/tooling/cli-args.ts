import { VC_RUNNER_ENV_ARG } from "./runners";
import { VC_PACKAGE_TYPE_ARG } from "./config";
import { ArgumentSpec, CommandError, formatUsage } from "@phylum/command";

export const CONFIG = { name: "config", alias: "c", defaultValue: "vuechain.json" };
export const RUNNER_ENV = { name: "env", alias: "e", type: VC_RUNNER_ENV_ARG };

export const PACKAGE_NAME_ARG = Object.assign((value: string, spec: ArgumentSpec) => {
	if (!isValidPackageName(value)) {
		throw new CommandError(`Usage: ${formatUsage(spec)}`);
	}
	return value;
}, {
	displayName: "npm package name"
});
export const PACKAGE_NAME = { name: "name", alias: "n", type: PACKAGE_NAME_ARG };

export const PACKAGE_TYPE = { name: "type", alias: "t", type: VC_PACKAGE_TYPE_ARG };

export function isValidPackageName(name: string) {
	return /^(?:\@[a-z0-9\-\_\.]+\/)?[a-z0-9\-\_\.]+$/.test(name);
}
