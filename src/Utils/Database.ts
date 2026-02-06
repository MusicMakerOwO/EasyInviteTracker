import fs from 'fs';
import BetterSqlite3 from 'better-sqlite3';
import { DB_SETUP_FILE, DB_FILE } from './Constants';

function ParseQueries(fileContent: string) {
	const queries: string[] = [];
	let buffer = '';
	let inMultilineComment = false;
	let insubQuery = false;

	const lines = fileContent.split('\n');
	for (let i = 0; i < lines.length; i++) {
		let line = lines[i].trim();

		if (line.startsWith('--')) continue;

		if (line.startsWith('/*')) {
			inMultilineComment = true;
		}

		if (inMultilineComment) {
			if (line.endsWith('*/')) {
				inMultilineComment = false;
			}
			continue;
		}

		if (line.includes('BEGIN')) {
			insubQuery = true;
		}

		if (line.includes('END')) {
			insubQuery = false;
		}

		buffer += line + '\n';

		if (line.endsWith(';') && !insubQuery) {
			queries.push(buffer.trim());
			buffer = '';
		} else {
			buffer += ' ';
		}
	}

	// Check if there's any remaining content in the buffer (for cases where the file might not end with a semicolon)
	if (buffer.trim()) {
		queries.push(buffer.trim());
	}

	return queries;
}

const FileContent = fs.readFileSync(DB_SETUP_FILE, 'utf8');

const NoComments = FileContent.replace(/--.*\n/g, '');

const DBQueries = ParseQueries(NoComments);

const Database = new BetterSqlite3(DB_FILE);

Database.pragma('foreign_keys = ON');
Database.pragma('journal_mode = WAL');
Database.pragma('cache_size = 50000');  // ~200MB cache
Database.pragma('temp_store = MEMORY'); // Use memory for temporary tables
Database.pragma('mmap_size = 268435456'); // 256MB memory map

for (let i = 0; i < DBQueries.length; i++) {
	try {
		Database.exec( DBQueries[i] );
	} catch (error) {
		console.error( DBQueries[i] );
		console.error(error);
		process.exit(1);
	}
}

export { Database }