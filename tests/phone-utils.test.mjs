import assert from 'node:assert/strict';
import test from 'node:test';
import { formatPhone, PHONE_REGEX } from '../lib/phone-utils.ts';

const formatted = '+7 700 123 45 67';

test('typing an international number does not duplicate the country digit', () => {
  let value = '';
  for (const character of '+77001234567') value = formatPhone(value + character);
  assert.equal(value, formatted);
  assert.ok(PHONE_REGEX.test(value));
});

test('accepts international, trunk-prefix and national pasted numbers', () => {
  for (const value of ['+7 (700) 123-45-67', '77001234567', '87001234567', '7001234567']) {
    assert.equal(formatPhone(value), formatted);
  }
  assert.equal(formatPhone(formatted), formatted);
});

test('the prefix and the entire field can be deleted', () => {
  let value = formatted;
  for (let i = 0; i < 20 && value; i++) value = formatPhone(value.slice(0, -1));
  assert.equal(value, '');
  assert.equal(formatPhone('+'), '+');
  assert.equal(formatPhone(''), '');
  assert.equal(formatPhone('letters'), '');
});

test('supports partial input and caps a pasted number at eleven digits', () => {
  assert.equal(formatPhone('+77'), '+7 7');
  assert.equal(formatPhone('+77001'), '+7 700 1');
  assert.equal(formatPhone('+77001234567999'), formatted);
  assert.equal(PHONE_REGEX.test(formatPhone('+7700')), false);
});
