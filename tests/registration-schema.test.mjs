import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';

// Resolve the two application aliases while loading the actual schema in Node.
const aliases = {
  '@/constants/registration': new URL('../constants/registration.ts', import.meta.url).href,
  '@/lib/phone-utils': new URL('../lib/phone-utils.ts', import.meta.url).href,
};
const resolver = registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(aliases[specifier] ?? specifier, context);
  },
});
const { registerPhoneSchema, registerStep1Schema, registerPasswordSchema } =
  await import('../lib/registration-schema.ts');
resolver.deregister();

const client = {
  phone: '+7 700 123 45 67',
  full_name: 'Иван Иванов',
  office_id: '1',
  role: 'client',
  service_category_id: '',
  company_id: '3',
  company_other_name: '',
};

function hasIssue(result, field) {
  return !result.success && result.error.issues.some((issue) => issue.path[0] === field);
}

test('SMS phone validation is available independently of the refined profile schema', () => {
  assert.equal(registerPhoneSchema.safeParse(client.phone).success, true);
  for (const phone of ['', '+7', '+7 700 123', '77001234567', '+1 700 123 45 67']) {
    assert.equal(registerPhoneSchema.safeParse(phone).success, false, phone);
    assert.equal(hasIssue(registerStep1Schema.safeParse({ ...client, phone }), 'phone'), true);
  }
});

test('the profile step still checks name, office, role and company', () => {
  const valid = registerStep1Schema.safeParse({ ...client, full_name: '  Иван Иванов  ' });
  assert.equal(valid.success, true);
  assert.equal(valid.data.full_name, 'Иван Иванов');
  for (const [field, value] of [['full_name', '  '], ['office_id', ''], ['role', ''], ['company_id', '']]) {
    assert.equal(hasIssue(registerStep1Schema.safeParse({ ...client, [field]: value }), field), true, field);
  }
});

test('other company requires a nonblank company name', () => {
  const other = { ...client, company_id: '__other__' };
  assert.equal(hasIssue(registerStep1Schema.safeParse(other), 'company_other_name'), true);
  assert.equal(hasIssue(registerStep1Schema.safeParse({ ...other, company_other_name: '  ' }), 'company_other_name'), true);
  assert.equal(registerStep1Schema.safeParse({ ...other, company_other_name: 'Компания' }).success, true);
});

test('executors require a service category instead of a company', () => {
  const executor = { ...client, role: 'executor', company_id: '' };
  assert.equal(hasIssue(registerStep1Schema.safeParse(executor), 'service_category_id'), true);
  assert.equal(registerStep1Schema.safeParse({ ...executor, service_category_id: '2' }).success, true);
});

test('passwords must be long enough and match before registration', () => {
  assert.equal(hasIssue(registerPasswordSchema.safeParse({ password: '12345', confirm_password: '12345' }), 'password'), true);
  assert.equal(hasIssue(registerPasswordSchema.safeParse({ password: 'secret123', confirm_password: 'different' }), 'confirm_password'), true);
  assert.equal(registerPasswordSchema.safeParse({ password: 'secret123', confirm_password: 'secret123' }).success, true);
});
