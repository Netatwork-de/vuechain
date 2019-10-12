
export class Task {
	public constructor(private readonly action: () => Promise<void>) {
	}

	private running: Promise<void> | null = null;
	private invalid = false;

	public run() {
		if (this.running) {
			this.invalid = true;
		} else {
			this.running = (async () => this.action())().finally(() => {
				this.running = null;
				if (this.invalid) {
					this.invalid = false;
					this.run();
				}
			});
		}
		return this.running;
	}
}
