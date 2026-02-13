export type DeckStatsRow = {
	id: string;
	name: string;
	games: number;
	wins: number;
	losses: number;
	winRate: number; // 0 to 100
	usagePercent: number; // 0 to 100
	avgFunSelf?: number | null;
	avgFunOthers?: number | null;
};

export type DeckStatsColumn = {
	key: 'games' | 'wins' | 'losses' | 'winRate' | 'usagePercent' | 'avgFunSelf' | 'avgFunOthers';
	label: string;
	align?: 'left' | 'right';
	format?: 'number' | 'percent' | 'games' | 'score';
	showBar?: boolean;
	hideOnMobile?: boolean;
	sortable?: boolean;
};
