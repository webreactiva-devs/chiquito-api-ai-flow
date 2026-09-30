const LOCAL_ORIGIN = "http://admin.local";
export const DEFAULT_ADMIN_PATH = "/admin/jokes";

export const resolveNextPath = (next: string | undefined): string => {
	if (!next || !URL.canParse(next, LOCAL_ORIGIN)) {
		return DEFAULT_ADMIN_PATH;
	}
	const url = new URL(next, LOCAL_ORIGIN);
	const isLocalAdminPath =
		url.origin === LOCAL_ORIGIN && url.pathname.startsWith("/admin/");
	return isLocalAdminPath ? url.pathname + url.search : DEFAULT_ADMIN_PATH;
};

export const loginPath = ({
	state,
	next,
}: {
	state?: string;
	next?: string;
}): string => {
	const query = new URLSearchParams();
	if (state) {
		query.set("state", state);
	}
	if (next) {
		query.set("next", next);
	}
	const queryString = query.toString();
	return queryString ? `/admin/login?${queryString}` : "/admin/login";
};
