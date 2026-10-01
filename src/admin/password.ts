import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

interface ScryptParameters {
	cost: number;
	blockSize: number;
	parallelization: number;
}

const DEFAULT_PARAMETERS: ScryptParameters = {
	cost: 2 ** 14,
	blockSize: 8,
	parallelization: 5,
};
const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

const deriveKey = (
	password: string,
	salt: Buffer,
	keyLength: number,
	{ cost, blockSize, parallelization }: ScryptParameters,
): Promise<Buffer> =>
	new Promise((resolve, reject) => {
		scrypt(
			password,
			salt,
			keyLength,
			{ N: cost, r: blockSize, p: parallelization },
			(error, key) => (error ? reject(error) : resolve(key)),
		);
	});

export const hashPassword = async (password: string): Promise<string> => {
	const salt = randomBytes(SALT_LENGTH);
	const key = await deriveKey(password, salt, KEY_LENGTH, DEFAULT_PARAMETERS);
	return [
		"scrypt",
		DEFAULT_PARAMETERS.cost,
		DEFAULT_PARAMETERS.blockSize,
		DEFAULT_PARAMETERS.parallelization,
		salt.toString("base64"),
		key.toString("base64"),
	].join("$");
};

export const verifyPassword = async (
	password: string,
	storedHash: string,
): Promise<boolean> => {
	const [, cost, blockSize, parallelization, salt, key] = storedHash.split("$");
	const expectedKey = Buffer.from(key, "base64");
	const actualKey = await deriveKey(
		password,
		Buffer.from(salt, "base64"),
		expectedKey.length,
		{
			cost: Number(cost),
			blockSize: Number(blockSize),
			parallelization: Number(parallelization),
		},
	);
	return timingSafeEqual(actualKey, expectedKey);
};

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;

export const findPasswordProblem = (password: string): string | undefined => {
	const length = [...password].length;
	if (length < MIN_PASSWORD_LENGTH || length > MAX_PASSWORD_LENGTH) {
		return `The password must have ${MIN_PASSWORD_LENGTH} to ${MAX_PASSWORD_LENGTH} characters.`;
	}
	return undefined;
};
