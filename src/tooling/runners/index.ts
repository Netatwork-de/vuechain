import { VcConfig } from "../config";
import { ArgumentSpec, CommandError, formatUsage } from "@phylum/command";

export interface VcRunnerContext {
	readonly watch: boolean;
	readonly env: VcRunnerEnv;
}

export type VcRunnerEnv = "development" | "production" | "testing";
export const VC_RUNNER_ENVS = new Set<VcRunnerEnv>(["development", "production", "testing"]);
export const VC_RUNNER_ENVS_STR = Array.from(VC_RUNNER_ENVS).map(t => `"${t}"`).join(", ");
export const VC_RUNNER_ENV_ARG = Object.assign((value: string, spec: ArgumentSpec) => {
	if (!VC_RUNNER_ENVS.has(<any> value)) {
		throw new CommandError(`Usage: ${formatUsage(spec)}`);
	}
	return value as VcRunnerEnv;
}, {
	displayName: VC_RUNNER_ENVS_STR
});

export async function run(config: VcConfig, options: VcRunnerContext) {
	// Package type specific runners are loaded on demand to
	// prevent loading large dependencies when they are not needed.
	switch (config.packageType) {
		case "application": return (await import("./application")).run(config, options);
		case "library": return (await import("./library")).run(config, options);
	}
}
