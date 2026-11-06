// Fixtures activate through the real SMTP capture and API. Never bypass verification in the app.
const base = process.env.CLINGO_TEST_API ?? 'http://localhost:4000';
const mailbox = process.env.CLINGO_TEST_MAILPIT ?? 'http://localhost:8025';
function local(url) { if (!['localhost', '127.0.0.1'].includes(new URL(url).hostname)) throw Error('Test activation only supports local APIs and mailboxes.'); }
async function latestActivation(email) {
  local(mailbox);
  for (let attempt = 0; attempt < 30; attempt++) {
    const list = await (await fetch(`${mailbox}/api/v1/messages?limit=200`)).json();
    const entry = list.messages?.find(row => row.To?.some(to => to.Address.toLowerCase() === email.toLowerCase()));
    if (entry) {
      const message = await (await fetch(`${mailbox}/api/v1/message/${entry.ID}`)).json();
      const code = message.Text?.match(/kod aktywacyjny Clingo:\s*(\d{4})/i)?.[1];
      if (code) return { code, id: entry.ID };
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw Error('No activation message for the isolated test account.');
}
async function finishFixtureRegistration(path, result) {
  if (!String(path).endsWith('/auth/register') || !result?.verificationRequired) return result;
  local(base);
  if (!result.verificationToken) throw Error('Use the app verification cookie when registering through a web proxy.');
  const message = await latestActivation(result.email);
  const response = await fetch(`${base}/auth/verify-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ verificationToken: result.verificationToken, code: message.code }) });
  const data = await response.json();
  if (!response.ok) throw Error(data.message ?? 'Fixture activation failed.');
  await deleteActivationMessage(message.id);
  return data;
}
async function deleteActivationMessage(id) {
  local(mailbox);
  await fetch(`${mailbox}/api/v1/messages`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ IDs: [id] }) });
}
async function createVerifiedFixture(input) {
  local(base);
  const response = await fetch(`${base}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  const data = await response.json(); if (!response.ok) throw Error(data.message);
  return finishFixtureRegistration('/auth/register', data);
}
module.exports = { latestActivation, finishFixtureRegistration, createVerifiedFixture, deleteActivationMessage };
