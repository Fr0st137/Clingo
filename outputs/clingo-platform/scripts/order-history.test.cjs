const { test } = require('node:test');
const assert = require('node:assert/strict');
const { orderHistoryDiff, attachmentHistoryDiff, historyMoney } = require('../apps/api/dist/provider/order-history');
const session = { id: 'a', date: '2026-11-03', startMinute: 600, endMinute: 690, employees: [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Barbara' }] };
test('history records precise before/after values and ignores employee order and unchanged plans', () => {
  assert.deepEqual(orderHistoryDiff({ sessions: [session] }, { sessions: [{ ...session, employees: [...session.employees].reverse() }] }), []);
  assert.deepEqual(orderHistoryDiff({ sessions: [session] }, { sessions: [{ ...session, endMinute: 705 }] }), [{ type: 'Zmiana godziny końca zamówienia', before: '03.11.2026, 11:30', after: '03.11.2026, 11:45' }]);
  assert.deepEqual(orderHistoryDiff({ fields: { 'Zmiana ceny': historyMoney(19600) } }, { fields: { 'Zmiana ceny': historyMoney(16500) } }), [{ type: 'Zmiana ceny', before: '196 zł', after: '165 zł' }]);
});
test('rescheduling, staffing, adding/removing sessions and midnight retain their real values', () => {
  const changes = orderHistoryDiff({ sessions: [session] }, { sessions: [{ ...session, date: '2026-11-04', endMinute: 1440, employees: [session.employees[0]] }] });
  assert.equal(changes[0].type, 'Przełożenie terminu'); assert.equal(changes[0].after, '04.11.2026, 10:00 - 00:00 (+1 dzień)');
  assert.deepEqual(changes[1], { type: 'Zmiana pracowników', before: 'Anna, Barbara', after: 'Anna' });
  assert.equal(orderHistoryDiff({ sessions: [] }, { sessions: [session] })[0].before, '—');
  assert.equal(orderHistoryDiff({ sessions: [session] }, { sessions: [] })[0].after, '—');
});
test('note content edits and photo replacement are logged without including any image bytes', () => {
  const old = { noteItems: [{ id: 'n', title: 'Wejście', body: 'Brama A' }], photos: [{ id: 'old' }] };
  const next = { noteItems: [{ ...old.noteItems[0], body: 'Brama B' }], photos: [{ id: 'new', dataUrl: 'private-image-bytes' }] };
  const changes = attachmentHistoryDiff(old, next);
  assert.deepEqual(changes[0], { type: 'Zmiana treści notatki „Wejście”', before: 'Brama A', after: 'Brama B' });
  assert.deepEqual(changes[1], { type: 'Zmiana zdjęć (dodano: 1, usunięto: 1)', before: '1', after: '1' });
  assert.ok(!JSON.stringify(changes).includes('private-image-bytes'));
  assert.deepEqual(attachmentHistoryDiff(old, old), []);
});
