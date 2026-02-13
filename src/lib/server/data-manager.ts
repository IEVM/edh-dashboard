import type { DataManager } from './data-manager/base';

export * from './data-manager/base';

export async function getDataManager(sessionId: string): Promise<DataManager> {
	const { DbDataManager } = await import('./data-manager/db');
	return DbDataManager.create(sessionId);
}
