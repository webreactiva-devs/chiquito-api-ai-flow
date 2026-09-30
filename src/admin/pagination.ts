export const JOKES_PER_PAGE = 20;

export interface Pagination {
	page: number;
	pageCount: number;
	total: number;
	offset: number;
	hasPrevious: boolean;
	hasNext: boolean;
}

export const parsePage = (value: string | undefined): number => {
	const page = Number(value);
	return Number.isInteger(page) && page >= 1 ? page : 1;
};

export const paginate = (
	total: number,
	page: number,
	pageSize: number,
): Pagination => {
	const pageCount = Math.max(1, Math.ceil(total / pageSize));
	return {
		page,
		pageCount,
		total,
		offset: (page - 1) * pageSize,
		hasPrevious: page > 1,
		hasNext: page < pageCount,
	};
};
