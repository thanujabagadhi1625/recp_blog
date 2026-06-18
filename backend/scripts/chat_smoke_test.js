const fetch = require('node-fetch');
const base = 'http://localhost:4444';
async function signup(u){
  try{
    const r = await fetch(base + '/api/users/signup', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(u)});
    return await r.json();
  }catch(e){console.error('signup err',e);}
}
async function login(creds){
  const r = await fetch(base + '/api/users/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(creds)});
  if (r.status !== 200) { console.error('login failed', await r.text()); return null; }
  return await r.json();
}
(async ()=>{
  console.log('Creating users Alice and Bob...');
  await signup({name:'Alice', email:'alice.test@example.com', password:'pass1234'});
  await signup({name:'Bob', email:'bob.test@example.com', password:'pass1234'});
  const la = await login({email:'alice.test@example.com', password:'pass1234'});
  const lb = await login({email:'bob.test@example.com', password:'pass1234'});
  if (!la || !lb) return;
  const tokenA = la.token; const tokenB = lb.token; const idA = la.user.id; const idB = lb.user.id;
  console.log('Alice id:', idA, 'Bob id:', idB);
  console.log('Alice -> Bob: send chat request');
  const sendReq = await fetch(`${base}/api/chats/request/${idB}`, {method:'POST', headers: {Authorization: 'Bearer ' + tokenA}});
  console.log('send request status', sendReq.status);
  const bobReqs = await (await fetch(`${base}/api/chats/requests`, {headers: {Authorization: 'Bearer ' + tokenB}})).json();
  console.log('Bob sees', bobReqs.length, 'requests');
  if (!bobReqs[0]) { console.error('No request found for Bob'); return; }
  const requestId = bobReqs[0]._id;
  console.log('Bob accepts request', requestId);
  const acc = await fetch(`${base}/api/chats/request/${requestId}/respond`, {method:'POST', headers: {'Content-Type':'application/json', Authorization: 'Bearer ' + tokenB}, body: JSON.stringify({action:'accepted'})});
  console.log('accept status', acc.status);
  console.log('Alice sends message to request');
  const msg = await fetch(`${base}/api/chats/${requestId}/messages`, {method:'POST', headers: {'Content-Type':'application/json', Authorization: 'Bearer ' + tokenA}, body: JSON.stringify({text:'Hello Bob, this is Alice'})});
  console.log('message send status', msg.status);
  const messages = await (await fetch(`${base}/api/chats/${requestId}/messages`, {headers: {Authorization: 'Bearer ' + tokenA}})).json();
  console.log('Messages count:', messages.length, messages);
})();
