import type { onSendHookHandler } from "fastify";

const SECURITY_HEADERS = {
	"content-security-policy":
		"default-src 'self'; base-uri 'none'; object-src 'none'; form-action 'self'; frame-ancestors 'none'",
	"x-frame-options": "DENY",
	"x-content-type-options": "nosniff",
	"referrer-policy": "same-origin",
};

export const addSecurityHeaders: onSendHookHandler = async (
	_request,
	reply,
) => {
	reply.headers(SECURITY_HEADERS);
	if (String(reply.getHeader("content-type")).startsWith("text/html")) {
		reply.header("cache-control", "no-store");
	}
};
