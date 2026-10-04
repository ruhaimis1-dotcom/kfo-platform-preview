export function passwordIssue(password, confirmation) {
  if (password.length < 8) return 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.';
  if (password !== confirmation) return 'كلمتا المرور غير متطابقتين.';
  return null;
}

// Store only an allowlisted category and HTTP status, never provider messages,
// request URLs, credentials, user identity, response bodies or session data.
export function authDiagnostic(error, action) {
  const status = Number.isInteger(error?.status) && error.status >= 0 && error.status <= 599 ? error.status : null;
  const code = error?.code;
  let category = 'unknown';
  if (status === 429 || ['over_email_send_rate_limit', 'over_request_rate_limit'].includes(code)) category = 'rate-limit';
  else if ([502, 503, 504].includes(status)) category = 'service-gateway';
  else if (error?.name === 'AuthRetryableFetchError' || code === 'network_error') category = status === 0 || status === null ? 'connection' : 'retryable-response';
  else if (code === 'invalid_credentials') category = 'credentials';
  else if (code === 'email_not_confirmed') category = 'email-unconfirmed';
  else if (['weak_password', 'same_password'].includes(code)) category = 'password-policy';
  return { action: ['login', 'forgot', 'reset'].includes(action) ? action : 'unknown', category, status };
}

export function authErrorMessage(error, action) {
  const code = error?.code || '';
  if (error?.name === 'AuthRetryableFetchError' || code === 'network_error') {
    if (authDiagnostic(error, action).category === 'connection') {
      return 'تعذر الاتصال بخدمة الدخول. تحقق من اتصالك ثم حاول مجددًا.';
    }
    return action === 'login'
      ? 'خدمة تسجيل الدخول غير متاحة مؤقتاً. انتظر قليلاً ثم أعد المحاولة.'
      : 'الخدمة غير متاحة مؤقتاً. انتظر قليلاً ثم أعد المحاولة.';
  }
  if (code === 'invalid_credentials' || code === 'email_not_confirmed') {
    return code === 'email_not_confirmed'
      ? 'يرجى تأكيد بريدك الإلكتروني من الرسالة المرسلة إليك، ثم حاول مجدداً.'
      : 'تعذر تسجيل الدخول بهذه البيانات. تحقق من بريدك وكلمة المرور، أو عيّن كلمة مرور جديدة.';
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
