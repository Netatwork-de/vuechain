
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

export function stream(start: (end: () => void, error: (error: any) => void) => void) {
	return new Promise((resolve, reject) => {
		const errors: any[] = [];
		start(() => {
			if (errors.length > 0) {
				reject(errors[0]);
			} else {
				resolve();
			}
		}, error => {
			errors.push(error);
		});
	});
}
