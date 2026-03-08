import { query } from './index.js';

export async function logAdmin(action, details, userId) {
  await query(
    'INSERT INTO admin_log (action, details, user_id) VALUES ($1, $2, $3)',
    [action, details ? JSON.stringify(details) : null, userId]
  );
}

export async function getAdminLog(limit = 300) {
  const result = await query(
    `SELECT al.id, al.action, al.details, al.user_id, al.created_at, u.name as user_name
     FROM admin_log al
     LEFT JOIN users u ON u.id = al.user_id
     ORDER BY al.id DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows.map((row) => ({
    id: row.id,
    action: row.action,
    details: row.details,
    user_id: row.user_id,
    user_name: row.user_name,
    created_at: row.created_at,
  }));
}

export async function clearAdminLog(userId) {
  await query('DELETE FROM admin_log');
  await query(
    'INSERT INTO admin_log (action, details, user_id) VALUES ($1, $2, $3)',
    ['Log Cleared', null, userId]
  );
}
