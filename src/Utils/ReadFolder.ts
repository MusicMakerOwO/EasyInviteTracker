import fs from 'fs';
import { Log } from './Log';

const WINDOWS_DRIVE = /^[a-zA-Z]:\\/;

export function ReadFolder(path: string, depth = 3) {
	if (!path.startsWith('/') && !WINDOWS_DRIVE.test(path)) throw new Error(`Path must be absolute - Received ${path}`);
	if (path.endsWith('/')) path = path.slice(0, -1);
	return ReadFolderRecursive(path, depth);
}

function ReadFolderRecursive(path: string, depth = 3): string[] {
	const folderEntries = fs.readdirSync(path, { withFileTypes: true });

	const files: string[] = [];

	for (let i = 0; i < folderEntries.length; i++) {
		const entry = folderEntries[i];
		const fullPath = `${path}/${entry.name}`;
		if (entry.isBlockDevice() || entry.isCharacterDevice() || entry.isFIFO() || entry.isSocket()) {
			Log('WARN', `Skipping unsupported file system entry at ${fullPath}`);
		}

		if (entry.isFile()) {
			files.push(fullPath);
			continue;
		}

		if (depth <= 0) {
			Log('WARN', `Maximum depth reached - Skipping ${fullPath}`);
			continue;
		}

		if (entry.isDirectory()) {
			const subFiles = ReadFolderRecursive(fullPath, depth - 1);
			files.push(... subFiles);
		}

		if (entry.isSymbolicLink()) {
			try {
				const stats = fs.statSync(fullPath);
				if (stats.isDirectory()) {
					const subFiles = ReadFolderRecursive(fullPath, depth - 1);
					files.push(... subFiles);
				} else if (stats.isFile()) {
					files.push(fullPath);
				}
			} catch (err) {
				Log('ERROR', `Failed to read symbolic link at ${fullPath}:`, err);
			}
		}
	}

	return files;
}