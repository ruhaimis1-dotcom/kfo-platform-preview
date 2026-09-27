export function passwordIssue(password, confirmation) {
  if (password.length < 8) return 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.';
  if (password !== confirmation) return 'كلمتا المرور غير متطابقتين.';
  return null;
}

export function authErrorMessage(error, action) {
  const code = error?.code || '';
  if (code === 'invalid_credentials' || code === 'email_not_confirmed') {
    return code === 'email_not_confirmed'
      ? 'يرجى تأكيد بريدك الإلكتروني من الرسالة المرسلة إليك، ثم حاول مجدداً.'
      : 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  }
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || error?.status === 429) {
    return 'طلبات كثيرة خلال وقت قصير. حاول مرة أخرى بعد قليل.';
  }
  if (code === 'weak_password' || code === 'same_password') {
    return code === 'same_password' ? 'اختر كلمة مرور تختلف عن السابقة.' : 'اختر كلمة مرور أقوى، ثم حاول مجدداً.';
  }
  return action === 'reset'
    ? 'تعذر حفظ كلمة المرور. قد يكون رابط الاستعادة منتهي الصلاحية؛ اطلب رابطاً جديداً وحاول مجدداً.'
    : 'تعذر إكمال الطلب الآن. تحقق من الاتصال وحاول مجدداً.';
}
