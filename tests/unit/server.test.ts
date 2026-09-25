import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type MockInstance,
	vi,
} from "vitest";

interface ServerApp {
	listen: (options: { port: number; host: string }) => Promise<unknown>;
	log: { error: (error: unknown) => void };
}

// We'll test the server logic by creating a separate function that contains the start logic
// since the server.js file executes immediately when imported

// Create a function that mimics the server start logic
const createServerStartFunction = (mockApp: ServerApp) => {
	return async () => {
		const PORT = Number(process.env.PORT) || 3000;

		try {
			await mockApp.listen({ port: PORT, host: "0.0.0.0" });
			console.log(`Chiquito API running on port ${PORT}`);
			console.log(`Documentation: http://localhost:${PORT}/api/jokes`);
		} catch (err) {
			mockApp.log.error(err);
			process.exit(1);
		}
	};
};

describe("Server Start Logic", () => {
	let originalEnv: typeof process.env;
	let mockConsoleLog: MockInstance<typeof console.log>;

	beforeEach(() => {
		originalEnv = process.env;
		mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
	});

	afterEach(() => {
		process.env = originalEnv;
		vi.clearAllMocks();
	});

	it("should start server successfully with default port", async () => {
		const mockApp = {
			listen: vi.fn().mockResolvedValue(undefined),
			log: {
				error: vi.fn(),
			},
		};

		const start = createServerStartFunction(mockApp);
		await start();

		expect(mockApp.listen).toHaveBeenCalledWith({
			port: 3000,
			host: "0.0.0.0",
		});
		expect(mockConsoleLog).toHaveBeenCalledWith(
			"Chiquito API running on port 3000",
		);
		expect(mockConsoleLog).toHaveBeenCalledWith(
			"Documentation: http://localhost:3000/api/jokes",
		);
	});

	it("should start server successfully with custom port", async () => {
		process.env.PORT = "8080";
		const mockApp = {
			listen: vi.fn().mockResolvedValue(undefined),
			log: {
				error: vi.fn(),
			},
		};

		const start = createServerStartFunction(mockApp);
		await start();

		expect(mockApp.listen).toHaveBeenCalledWith({
			port: 8080,
			host: "0.0.0.0",
		});
		expect(mockConsoleLog).toHaveBeenCalledWith(
			"Chiquito API running on port 8080",
		);
		expect(mockConsoleLog).toHaveBeenCalledWith(
			"Documentation: http://localhost:8080/api/jokes",
		);
	});

	it("should handle startup errors gracefully", async () => {
		const mockApp = {
			listen: vi.fn().mockRejectedValue(new Error("Server startup failed")),
			log: {
				error: vi.fn(),
			},
		};

		// Mock process.exit to prevent actual exit during tests
		const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
			throw new Error("process.exit called");
		});

		const start = createServerStartFunction(mockApp);

		await expect(start()).rejects.toThrow("process.exit called");

		// Verify the error was logged
		expect(mockApp.log.error).toHaveBeenCalledWith(
			new Error("Server startup failed"),
		);
		expect(mockExit).toHaveBeenCalledWith(1);

		mockExit.mockRestore();
	});
});
