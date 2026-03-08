/**
 * Database: PostgreSQL only. Exposes query(sql, params) returning { rows }.
 */
import { query as pgQuery } from './pool.js';

export const query = pgQuery;
export const closeDb = () => {};
