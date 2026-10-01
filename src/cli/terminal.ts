const ENTER = new Set(["\r", "\n"]);
const CTRL_C = "\u0003";
const BACKSPACE = new Set(["\u007f", "\b"]);

export const readHiddenLine = (prompt: string): Promise<string> =>
	new Promise((resolve) => {
		const { stdin, stdout } = process;
		let value = "";

		const stopReading = () => {
			stdin.off("data", onData);
			stdin.setRawMode(false);
			stdin.pause();
			stdout.write("\n");
		};

		const onData = (text: string) => {
			for (const character of text) {
				if (ENTER.has(character)) {
					stopReading();
					resolve(value);
					return;
				}
				if (character === CTRL_C) {
					stopReading();
					process.exit(130);
				}
				value = BACKSPACE.has(character)
					? [...value].slice(0, -1).join("")
					: value + character;
			}
		};

		stdout.write(prompt);
		stdin.setRawMode(true);
		stdin.setEncoding("utf8");
		stdin.on("data", onData);
		stdin.resume();
	});
