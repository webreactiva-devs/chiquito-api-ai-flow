export interface Joke {
	id: number;
	type: string;
	content: string;
	category: string;
}

export interface JokeWithVotes extends Joke {
	upvotes: number;
	downvotes: number;
	score: number;
}

export interface Category {
	name: string;
	count: number;
}

export interface HealthResponse {
	status: string;
	message: string;
	timestamp: string;
}

export interface ErrorResponse {
	error: string;
}

export interface VoteResult {
	upvotes: number;
	downvotes: number;
	score: number;
}

export type VoteType = "up" | "down";

export interface GlobalStats {
	totalJokes: number;
	totalVotes: number;
	totalViews: number;
}

export interface JokeWithStats extends Joke {
	upvotes: number;
	downvotes: number;
	score: number;
	views: number;
}

export interface Admin {
	id: number;
	email: string;
	passwordHash: string;
	createdAt: string;
}

export interface NewJoke {
	type: string;
	content: string;
	category: string;
}

export interface AdminSession {
	id: string;
	adminId: number;
	adminEmail: string;
	csrfToken: string;
	createdAt: string;
	expiresAt: string;
}

export interface JokeWithActivity extends Joke {
	upvotes: number;
	downvotes: number;
	views: number;
}
