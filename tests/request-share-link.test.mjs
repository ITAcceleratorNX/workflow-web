import assert from 'node:assert/strict';
import test from 'node:test';
import {
  guestRequestUrl,
  isPhoneUserAgent,
  mobileAppRequestUrl,
  requestLoginPath,
  requestShareMessage,
  telegramShareUrl,
  whatsAppShareUrl,
} from '../lib/request-share-link.ts';

const URL_ = 'https://app.tmk-workflow.kz/r/abc_DEF-123';

test('the guest link lives under /r/ and does not carry the request number', () => {
  assert.equal(guestRequestUrl('https://app.tmk-workflow.kz/', 'abc_DEF-123'), URL_);
  assert.doesNotMatch(guestRequestUrl('https://app.tmk-workflow.kz', 'abc'), /requestId/);
});

test('the message carries the request number and the direct link', () => {
  assert.equal(requestShareMessage(123, URL_, ' Принтер '), `Заявка #123: Принтер\n${URL_}`);
  assert.equal(requestShareMessage(123, URL_), `Заявка #123\n${URL_}`);
});

test('WhatsApp and Telegram receive the address of this request', () => {
  const message = requestShareMessage(123, URL_, 'Принтер');
  assert.equal(new URL(whatsAppShareUrl(message)).searchParams.get('text'), message);
  const tg = new URL(telegramShareUrl(URL_, 'Заявка #123'));
  assert.equal(tg.origin + tg.pathname, 'https://t.me/share/url');
  assert.equal(tg.searchParams.get('url'), URL_);
  assert.equal(tg.searchParams.get('text'), 'Заявка #123');
});

test('«Войти в Workflow» keeps the target request', () => {
  assert.equal(requestLoginPath(123), '/?requestId=123');
  assert.equal(mobileAppRequestUrl(123), 'workflowmobile://?requestId=123');
});

test('phones are told apart from computers and tablets', () => {
  assert.equal(isPhoneUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'), true);
  assert.equal(isPhoneUserAgent('Mozilla/5.0 (Linux; Android 15; Pixel 9)'), true);
  assert.equal(isPhoneUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)'), false);
  assert.equal(isPhoneUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)'), false);
});
