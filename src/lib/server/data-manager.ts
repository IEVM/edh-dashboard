import type { DataManager } from './data-manager/base';
import { DataManagerError } from './data-manager/base';
import { getAuthUser } from './auth';

export * from './data-manager/base';

export async function getDataManager(locals: App.Locals): Promise<DataManager> {
	const user = await getAuthUser(locals);
	if (!user) {
		throw new DataManagerError('Not authenticated', 401);
	}
	const { DbDataManager } = await import('./data-manager/db');
	return DbDataManager.create(user);
}
