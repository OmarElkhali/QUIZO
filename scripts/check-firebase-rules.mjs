// Read-only production preflight. Never prints credentials or document contents.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { cert } from 'firebase-admin/app';
const credential = JSON.parse(readFileSync('python_api/service-account.json', 'utf8'));
if (credential.project_id !== 'ests-quiz') throw new Error('Unexpected Firebase project');
const { access_token } = await cert(credential).getAccessToken();
const base = `https://firebaserules.googleapis.com/v1/projects/${credential.project_id}`;
async function request(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' } });
  const data = await response.json();
  if (!response.ok) throw new Error(`Firebase Rules ${response.status}: ${data.error?.status || 'request failed'}`);
  return data;
}
const release = await request(`${base}/releases/cloud.firestore`);
const ruleset = await request(`https://firebaserules.googleapis.com/v1/${release.rulesetName}`);
const source = readFileSync('firestore.rules', 'utf8');
const normalize = value => value.replace(/\r\n/g, '\n').trim();
const baseline = execFileSync('git', ['show', 'HEAD:firestore.rules'], { encoding: 'utf8' });
console.log(JSON.stringify({ project: credential.project_id, currentRuleset: release.rulesetName, localMatchesRemote: ruleset.source.files.some(file => normalize(file.content) === normalize(source)), baselineMatchesRemote: ruleset.source.files.some(file => normalize(file.content) === normalize(baseline)) }));
const validation = await request(`${base}:test`, { method: 'POST', body: JSON.stringify({ source: { files: [{ name: 'firestore.rules', content: source }] }, testSuite: { testCases: [] } }) });
console.log(JSON.stringify({ syntaxIssues: validation.issues || [] }));
