import { VcConfig } from "../config";

export interface VcRunnerContext {
	readonly watch: boolean;
	readonly env: VcRunnerEnv;
}

export type VcRunnerEnv = "development" | "production" | "testing";

export async function run(config: VcConfig, options: VcRunnerContext) {
	// Package type specific runners are loaded on demand to
	// prevent loading large dependencies when they are not needed.
	switch (config.packageType) {
		case "application": return (await import("./application")).run(config, options);
		case "library": return (await import("./library")).run(config, options);
	}
}
