import { timingSafeEqual } from "node:crypto";
import type { preValidationHookHandler } from "fastify";

const tokensMatch = (sent: string, expected: string): boolean => {
	const sentBuffer = Buffer.from(sent);
	const expectedBuffer = Buffer.from(expected);
	return (
		sentBuffer.length === expectedBuffer.length &&
		timingSafeEqual(sentBuffer, expectedBuffer)
	);
};

export const requireCsrfToken: preValidationHookHandler = async (
	request,
	reply,
) => {
	if (request.method !== "POST") {
		return;
	}
	const sentToken = (request.body as { _csrf?: unknown } | undefined)?._csrf;
	if (
		typeof sentToken !== "string" ||
		!tokensMatch(sentToken, request.adminSession.csrfToken)
	) {
		return reply
			.status(403)
			.view("forbidden.eta", { session: request.adminSession });
	}
};
