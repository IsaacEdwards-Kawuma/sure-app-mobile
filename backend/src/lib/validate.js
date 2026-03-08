/**
 * Request validation helpers — centralize body/param checks.
 */
export function validateRegister(body) {
  const errors = [];
  const name = body?.name != null ? String(body.name).trim() : '';
  const pin = body?.pin != null ? String(body.pin) : '';
  if (!name || name.length < 1) errors.push('Name is required');
  if (!/^\d{4}$/.test(pin)) errors.push('PIN must be exactly 4 digits');
  return { name, pin, role: body?.role === 'admin' ? 'admin' : 'user', errors };
}

export function validateLogin(body) {
  const errors = [];
  const userId = body?.userId != null ? Number(body.userId) : NaN;
  const pin = body?.pin != null ? String(body.pin) : '';
  if (!Number.isInteger(userId) || userId < 1) errors.push('Valid user ID is required');
  if (!/^\d{4}$/.test(pin)) errors.push('PIN must be exactly 4 digits');
  return { userId, pin, errors };
}

export function validateUpdateMe(body) {
  const errors = [];
  const name = body?.name != null ? String(body.name).trim() : null;
  const phone = body?.phone != null ? String(body.phone).trim() : null;
  const current_pin = body?.current_pin != null ? String(body.current_pin) : null;
  const new_pin = body?.new_pin != null ? String(body.new_pin) : null;
  if (new_pin != null && new_pin !== '' && !/^\d{4}$/.test(new_pin)) errors.push('New PIN must be exactly 4 digits');
  return { name, phone, current_pin, new_pin: new_pin || null, errors };
}
