export async function endAccountSession(client,{switchAccount=false,storage,navigate}={}) {
  const {error}=await client.auth.signOut({scope:'local'});
  if(error)throw new Error('تعذر إنهاء الجلسة. حاول مرة أخرى.');
  storage?.removeItem('kfo.company.org');
  navigate(switchAccount?'/login':'/');
}
