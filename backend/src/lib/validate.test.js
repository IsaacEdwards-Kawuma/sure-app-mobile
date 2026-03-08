import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateRegister, validateLogin, validateUpdateMe } from './validate.js';

describe('validateRegister', () => {
  it('returns errors when name missing', () => {
    const out = validateRegister({ pin: '1234' });
    assert.strictEqual(out.errors.length, 1);
    assert.ok(out.errors[0].toLowerCase().includes('name'));
  });
  it('returns errors when PIN not 4 digits', () => {
    const out = validateRegister({ name: 'Alice', pin: '12' });
    assert.strictEqual(out.errors.length, 1);
    assert.ok(out.errors[0].toLowerCase().includes('pin'));
  });
  it('accepts valid name and 4-digit PIN', () => {
    const out = validateRegister({ name: 'Bob', pin: '5678', role: 'user' });
    assert.strictEqual(out.errors.length, 0);
    assert.strictEqual(out.name, 'Bob');
    assert.strictEqual(out.pin, '5678');
    assert.strictEqual(out.role, 'user');
  });
  it('accepts admin role', () => {
    const out = validateRegister({ name: 'Admin', pin: '0000', role: 'admin' });
    assert.strictEqual(out.errors.length, 0);
    assert.strictEqual(out.role, 'admin');
  });
});

describe('validateLogin', () => {
  it('returns errors when userId invalid', () => {
    const out = validateLogin({ pin: '1234' });
    assert.strictEqual(out.errors.length, 1);
  });
  it('returns errors when PIN not 4 digits', () => {
    const out = validateLogin({ userId: 1, pin: '99' });
    assert.strictEqual(out.errors.length, 1);
  });
  it('accepts valid userId and PIN', () => {
    const out = validateLogin({ userId: 1, pin: '1234' });
    assert.strictEqual(out.errors.length, 0);
    assert.strictEqual(out.userId, 1);
    assert.strictEqual(out.pin, '1234');
  });
});

describe('validateUpdateMe', () => {
  it('returns error when new_pin not 4 digits', () => {
    const out = validateUpdateMe({ new_pin: '12' });
    assert.strictEqual(out.errors.length, 1);
  });
  it('accepts valid new_pin', () => {
    const out = validateUpdateMe({ name: 'X', new_pin: '1234' });
    assert.strictEqual(out.errors.length, 0);
  });
});
