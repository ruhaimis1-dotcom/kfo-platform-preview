export async function verifyCertificate(client,code){
 const normalized=String(code||'').trim().toUpperCase();if(!/^KFO-[A-F0-9]{16}$/.test(normalized))throw Error('أدخل رمز شهادة كفو الصحيح.');
 const {data,error}=await client.rpc('verify_learner_certificate',{p_code:normalized});
 if(error)throw Error('تعذر الاتصال بخدمة التحقق. حاول مجددًا.');
 if(!data||!['valid','revoked','unavailable'].includes(data.status)||Object.keys(data).some(k=>!['status','course_slug','course_version','course_title','issued_at'].includes(k)))throw Error('تعذر التحقق من الاستجابة.');
 if(data.status==='valid'&&(typeof data.course_slug!=='string'||!Number.isInteger(data.course_version)||data.course_version<1||!Number.isFinite(Date.parse(data.issued_at))))throw Error('تعذر التحقق من الاستجابة.');return data;
}
