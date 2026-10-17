# كفو — استعادة مساحة العمل 15 أكتوبر 2026

صيانة مساحة العمل أزالت المصدر المحلي السابق. استُعيد مستودع GitHub على فرع recovery/kfo-20261015 من origin/qa/kfo-uat-20261010 عند 337a2d0. هذه نسخة أقدم من آخر تطوير محلي؛ لا تمثل 980b993.

## المستعاد فعليًا
- مصدر GitHub وتاريخه، دون نشر أو دفع تغييرات.
- 11 ملف SQL، بأرقامها وأسمائها ونصوص statements من سجل supabase_migrations.schema_migrations في مشروع كفو ktkdcfxeaicbykdurlfg، من 20261014182909 إلى 20261014202600.
- لم يُنفذ SQL مستعاد مرة أخرى؛ كانت العملية قراءة للسجل فقط.

## غير المستعاد
آخر فرع محلي qa/kfo-saved-attachment-20261013 وcommit 980b993 غير موجودين في GitHub. البحث عن ملفات كفو الحديثة وقائمة مجلد كفو لم يجدا حزمة مصدر تطابقهما. الواجهات المحلية الجديدة، اختبارات المصدر وتقاريرها غير متاحة في هذا checkout. نتائج 242 اختبارًا السابقة تاريخية وليست تحققًا من هذه النسخة المستعادة.

## شرط الاستئناف من نفس المصدر
توفير نسخة المصدر التي تحتوي آخر تعديلات 14 أكتوبر، أو إعادة بناء الواجهات المفقودة وفق عقود SQL المستعادة ثم اختبارها من جديد. لا يجوز نسخ الواجهة الأقدم فوق التغييرات المفقودة واعتبارها استعادة كاملة.

لم يُنشر الموقع، ولم تُغيّر بيانات العملاء أو إعدادات البوابة في هذه الجولة.

## البحث الموسع بطلب سعود
- فحص أسماء ملفات المصدر والأرشيفات في مساحة العمل المتاحة و/tmp، بما يشمل course-editor.mjs وlesson-editor.mjs وrelease-preview.mjs. لم تظهر النسخ المفقودة؛ الموجود من admin-live.js وintelligent-player.js داخل النسخة المستعادة الأقدم.
- حصر 170 أرشيف ZIP معدل منذ 10 أكتوبر في الملفات المحفوظة، دون صفحات نتائج متبقية؛ لم تظهر حزمة مصدر كفو حديثة. الملفات المسماة LOCAL_BUILD_FINAL_UI_20261014.zip وZAWED_Local_UI_Preview_20261014.zip تابعة لمشروع زاود وفق مساراتها، وليست مصدر كفو، فلم تُخلط بالمشروع.
- قراءة نقطة KFO_UAT_checkpoint_20261012.txt، الإصدار 6؛ آخر مصدر مثبت فيها 337a2d0 على QA، ولا تتضمن تطوير الواجهات المحلي ليوم 14 أكتوبر.
- فحص فروع Git وreflog وكائنات Git المتاحة لم يستعد 980b993. آخر نتيجة بحث ليست دليلًا على وجود نسخة حديثة في جهاز Windows غير المتاح من هذه الجلسة.

الخلاصة: البحث لم يستعد أحدث المصدر المحلي. النسخة الأقدم وعقود قاعدة البيانات تصلح أساسًا لإعادة البناء، ولا تسمى نسخة مطابقة أو استعادة كاملة.

## إعادة بناء واجهة إضافة الشركات
- أعيد إنشاء organization-actions.mjs وربطه بصفحة الشركات بعد تحميل بيانات الإدارة. يستخدم RPC admin_create_organization الموجود دون تطبيق migrations أو تعديل حسابات العملاء.
- نموذج الاسم والمعرف والبريد يوضح أن مسؤول الشركة يحتاج حسابًا مؤكدًا وأن النطاق pending. يحمي الطلب من الإرسال المتكرر، ويعرض أخطاء الحساب والصلاحية والتكرار. إذا نجح الإنشاء وفشل تحديث القائمة، يطلب تحديثها بدل الادعاء بفشل الإنشاء.
- اجتاز npm run check: البناء و223 اختبارًا؛ 220 من المصدر المستعاد و3 اختبارات لعقد إضافة الشركة. هذه ليست استعادة كاملة للـ242 اختبارًا السابقة، ولا Browser QA.
- لا نشر أو تغيير فرع QA المنشور. نقطة الحفظ البعيدة مخطط لها بوسم Git فقط، دون تحديث أي فرع؛ لا توجد GitHub Actions في المصدر الحالي أو main. توثيق Vercel يصف النشر الافتراضي عند دفع الفروع؛ النشر بالوسوم يحتاج مسار Actions/CLI منفصلًا. المرجع: https://vercel.com/kb/guide/can-you-deploy-based-on-tags-releases-on-vercel

- تعذر رفع وسم Git لغياب بيانات HTTPS؛ لم يُرفع الوسم. بديل الحفظ فرع recovery/kfo-20261015-onboarding عبر اتصال GitHub، مع git.deploymentEnabled=false في vercel.json لهذا المصدر فقط لمنع النشر التلقائي. لا يتغير إعداد فرع QA أو main.

## استعادة طلبات الدورات للأفراد والشركات
- أعيد بناء /orders وربطها بمساحة المتدرب، واستبدلت أمثلة صفحة طلبات الشركة بعروض وسجل الخادم. طلب الشركة محصور في صاحب صلاحية إدارة الإعدادات، مع استمرار تحقق الخادم.
- السعر وحالة الطلب من الخادم؛ لا يرسل العميل مبلغًا أو حالة دفع. التسجيل المجاني الفردي يحتاج enrollment مؤكدًا؛ المدفوع يحتاج awaiting_payment دون enrollment. طلب الشركة لا ينشئ أرصدة مقاعد أو فاتورة.
- مفتاح إعادة المحاولة محفوظ في sessionStorage حسب المستخدم والشركة والدورة والإصدار والعدد. تتوقف العملية إذا تعذر حفظه، وتُراجع هوية Auth قبل الإنشاء. لا توجد طلبات إلى بوابة نيو ليب.
- أزيل معالج نافذة الطلب التوضيحية من التنفيذ على الصفحة الجديدة عند غياب النافذة، مع بقاء تنقل القائمة الجانبية.
- اجتاز البناء و229 اختبارًا محليًا، منها 6 اختبارات جديدة لحدود الطلبات وإعادة المحاولة والهوية والاستجابة. SQL التراجعي أثبت المجاني والمدفوع وعدم تكرار الطلب وتسعير الخادم وعزل الطلبات، ثم أكد استعلام مستقل صفر عروض وطلبات وشركات والتحاقات الاختبار المتبقية.
- هذا لا يغطي Browser QA. لم تُنشر الواجهات، وإعداد git.deploymentEnabled=false مستمر في فرع الاستعادة.

## استعادة إعدادات الشركة
- أعيد ربط نصوص بوابة التعلم والفروع والأقسام وسجل النشاط والأدوار والتنبيهات بعقود RPC الموجودة، دون تعديل schema أو تفعيل خدمات خارجية. نماذج الإدارة تبقى مخفية لمن لا يملك صلاحية إدارة الشركة.
- تعديل دور CO/BM/EM ونطاق المدير فقط للعضويات النشطة ذات الدور الواحد غير عضوية المستخدم نفسه. الأدوار المتخصصة والمتعددة للقراءة فقط؛ الخادم يحمي آخر مالك ويمنع SA ويرفض تعارض الدور المتوقع.
- يحتفظ النموذج بالدور الأصلي المتوقع منذ اختيار العضو حتى الحفظ، حتى لا يخفي تحديث التنبيهات تعديلًا متزامنًا على الدور. أثناء الحفظ تقفل النماذج، ولا تُمسح النصوص أو التفضيلات غير المحفوظة عند إضافة وحدة تنظيمية.
- أصلحت تمرير name وcanManageSettings عند تهيئة company-live من dataset إذا سبق وصول بيانات الشركة تحميل السكربت؛ يشمل ذلك إعدادات الشركة وطلبات الدورات المستعادة.
- البناء و235 اختبارًا محليًا ناجحة. SQL التراجعي أثبت حفظ النصوص والتفضيلات، عدم تكرار الفرع، إضافة القسم، منع SA وإزالة آخر مالك، تغيير الدور إلى مدير بنطاق ورفض مراجعة الدور القديمة، ومنع المدير من إعدادات الشركة. تأكد صفر شركة وتفضيلات الاختبار بعد ROLLBACK.
- إعادة بناء وليست مطابقة بايتية للمصدر المفقود. الشعار والغلاف والألوان وسياسة التدريب قيد التجهيز؛ Browser QA غير مكتمل. يحفظ المصدر في فرع الاستعادة مع النشر التلقائي معطّلًا.

## استعادة محرر الدورات ومعاينة الإصدارات
- أعيد بناء محرر بيانات العرض والعنوان والوصف والسعر، وإنشاء مسودة مستقلة وإعادة تحميلها. الحفظ يتحقق من رقم المراجعة والاستجابة، ونشر غير الجاهز يظل مرفوضًا من الخادم.
- أعيد محرر الدروس النصية والتأمل والمهام وأسئلة الاختيار، مع الترتيب والحذف والمعاينة النصية والتحقق من المعرفات وحدود النصوص والإجابات. تغيير الدورة يمنع عند وجود تعديلات غير محفوظة؛ تجاهلها إجراء صريح. حفظ بيانات العرض لا يمس تعديلات الدروس غير المحفوظة.
- تجهيز الحزمة يجمع أسئلة الاختيار في تقييم نهائي بحد 75% ويترك المهارات ومعايير المهام والتفعيل للمرحلة التالية. يتيح رابط معاينة داخل مشغّل التعلم عبر RPC محصور بالإدارة، دون إجابات صحيحة أو حفظ تقدم أو إصدار شهادة أو خلط مع enrollment.
- أعيد إصلاح عرض عناوين تنقل المشغّل كنص آمن، وتجاهل إكمال الدرس القديم عند وجود نشاط يحتاج دليلًا ومراجعة. إصلاح الخادم المقابل موجود بالفعل من migrations المستعادة.
- اجتاز البناء و243 اختبارًا محليًا. الاختبارات الجديدة تشمل تحقق البيانات وتعارض الحفظ ومطابقة الاستجابة وفصل الإجابات، ومحاكاة controller تثبت التنقل بين كل أنشطة المعاينة دون استدعاء الكتابة وعدم تفسير عنوان HTML. هذه ليست Browser QA.
- SQL التراجعي أكد المسودة والحفظ ورفض النشر غير الجاهز ورفض مراجعة دروس قديمة وإعادة نفس الحزمة لنفس المراجعتين ومنع BM/anon من المعاينة، وعدم إنشاء أنشطة أو مفاتيح تقييم حية. التحقق المستقل بعد ROLLBACK: عروض وأحداث وحزم وأنشطة اختبار الجولة صفر.
- لم يُنشر تحديث. النشر التلقائي مستمر في حالة التعطيل داخل فرع الاستعادة. استعادة المصدر لا تعني إغلاق بوابة MVP: تبقى المهارات ومعايير التقييم وتفعيل الإصدار المدروس، والشعار والغلاف وسياسة التدريب ومسار مسؤول شركة جديد وفحص المتصفح والجوال، وربط نيو ليب الفعلي.

## تأمين عرض مهارات النشاط
- استبدال تركيب HTML لأسماء المهارات ومعرفاتها الاحتياطية بعناصر DOM ونصوص آمنة. إزالة بطاقات النشاط السابق عند التنقل.
- اختبار controller يشمل عنوان مهارة ومعرفًا احتياطيًا يحتويان HTML، مع بقاء المعاينة دون عمليات كتابة. البناء و243 اختبارًا ناجحة؛ فحص المتصفح الفعلي وربط المهارات ومعايير المهام ما زالت أعمالًا متبقية.

## مهارات الأنشطة ومعايير المهام — جولة 15 أكتوبر
- إضافة learning_design إلى مسودة الإدارة فقط، مع حفظ موحد للدروس والتصميم عبر admin_save_course_design وتعارض مراجعة واحد. كل فشل يرجع الدروس والتصميم والمراجعة والأحداث معًا. عميل الدروس السابق لا يستطيع حذف نشاط ترتبط به مهارة أو معايير دون تحديث التصميم.
- نماذج للمهارات ونتائج التعلم، اختيار مهارات النشاط، ومعايير المهمة التطبيقية بأوزان صحيحة مجموعها 100%. الحد 30 مهارة و10 معايير للمهمة؛ التكرار والمراجع المفقودة والحقول الزائدة مرفوضة من العميل والخادم.
- حزم المراجعة الجديدة تضم المهارات ومعايير المهام وربط أسئلة التقييم، مع الاحتفاظ بالإجابات الصحيحة في private فقط. الحزم السابقة ثابتة ولا تعاد كتابتها. لا نشر ولا تفعيل ولا تعديل أنشطة المتعلمين أو التحاقاتهم أو شهاداتهم.
- migration المطبقة في مشروع كفو: 20261014223935_course_learning_design_drafts. أضيفت إلى نطاق اختبار بوابة التكامل مع اختبار مستقل يؤكد اقتصارها على المسودات وثبات الحزم ومنع تفعيل runtime_ready. لا يغيّر ذلك شرط MVP Gate أو موافقة النشر.
- SQL التراجعي نجح: الحفظ واللقطات، فصل الإجابات، رفض الأوزان والمهارة المجهولة والمراجعة القديمة، التراجع الذري، منع المراجع اليتيمة من العميل السابق، ثبات الحزمة القديمة، ومنع BM وanon. التحقق المستقل بعد ROLLBACK: عروض وأحداث وحزم وأنشطة الاختبار صفر.
- البناء و249 اختبارًا محليًا ناجحة، تشمل محاكاة تدفق المحرر: ربط مهارة، إعادة تسمية النشاط وترتيبه ثم حذفه، وإرسال العقد الذري مع المراجعة الصحيحة. هذه ليست Browser QA. فحص الأمان بلا ERROR؛ مجموعات التحذيرات الموجودة تتعلق بالدوال المصرح بها للمصادقين وحماية كلمات المرور المسربة؛ جداول private تبقى مغلقة.
- المتبقي: فحص المتصفح والجوال للواجهات الجديدة، اعتماد وتفعيل الإصدار للمتدربين، استكمال إعدادات العلامة وسياسة التدريب ومسار مسؤول شركة جديد، وربط نيو ليب الفعلي.

## فحص سلامة حزمة الإصدار — 15 أكتوبر
- وجد نقص في تحقق العميل: prepareRelease كان يكتفي بأرقام المراجعة دون تطابق هوية runtime وassessment وفحص البنية. أضيف عقد موحد تستخدمه تهيئة الحزمة ومعاينتها، ويرفض هوية مختلفة أو مراجعات غير صالحة أو إجابات مكشوفة أو أسئلة مكررة/معطوبة أو ترتيبًا غير صالح أو مراجع مهارات ومعايير غير متوافقة.
- يتحقق العقد من تطابق مهارات التقييم النهائي مع اتحاد مهارات أسئلته، ويبقى منفصلًا عن الدورة المرجعية الثابتة التي لها عقد أقدم. الحزم القديمة الصحيحة دون ربط مهارات للأسئلة تبقى مقبولة.
- أضيف ملخص مراجعة يبين المهام دون معايير والأنشطة دون مهارات والمهارات غير المرتبطة. الملخص لا يعد اعتمادًا أو تفعيلًا، ولا يضيف شروط نشر خفية إلى الخادم.
- نجح البناء و253 اختبارًا محليًا. جرى إنشاء حزمة داخل transaction تراجعي في قاعدة كفو، ثم تمرير ناتج RPC الحقيقي إلى عقد العميل الجديد وملخص المراجعة بنجاح (نشاطان، سؤال، مهارة، مهمة بمعايير). التحقق بعد ROLLBACK أكد عروض وأحداث وحزم الاختبار صفر. لم تتغير schema في هذه الجولة.
- محاولة فحص المتصفح: بدأ خادم محلي للنسخة المبنية، لكن متصفح CUA لم يتمكن من فتح المستند المحلي وأعاد protected_command_failed مع طلب manual handoff. هذا ليس إثبات رفض سياسة ولا نجاح QA؛ فحص المتصفح والجوال يبقى غير مكتمل. لم تعاد محاولة الدخول أو استرجاع بيانات الجلسة المقيدة، ولم ينشر شيء.

## تصحيح مساحة المتدرب — جولة صباح 15 أكتوبر
- إعادة تنظيم /workspace إلى خمسة أقسام بعناوين وروابط مباشرة عبر hash: الرئيسية، دوراتي، الإشعارات، شهاداتي، ملفي الشخصي؛ مع روابط التسجيل والطلبات والكتالوج. هذه أقسام داخل المسار الحالي وليست صفحات backend جديدة. يظل قسم الشركة وتوجيه الأدوار كما هو.
- حالة تبويب واحدة ظاهرة، aria-current للتنقل، تخطيط قائمة جانبية للشاشات الواسعة وقائمة ملتفة للجوال. الانتقال لا يعيد تحميل البيانات ولا يمس حقول الملف غير المحفوظة. hash مجهول أو موروث مثل constructor يعود للرئيسية دون تفسير HTML.
- إصلاح عائق فعلي: بطاقات الالتحاق لم تكن تحتوي رابط متابعة. أضيف رابط للالتحاق النشط بمرجع خدمة العملاء إصدار 1 فقط، مع UUID صحيح والتحقق الحالي من الملكية في المشغّل. لا تحول دورة أخرى أو إصدارًا غير مدعوم إلى محتوى المرجع. تعرض الدورة المكتملة حالتها، والنسخة النشطة غير المدعومة توضيحًا بدل رابط مضلل.
- عرض اسم عربي للدورات المعروفة وحالة الالتحاق وموعده، وحالة حساب شخصي دون جهة عمل. توضيح أن المحتوى العام للمراجعة الذاتية لا يصدر شهادة، وأن الإشعارات المعروضة آخر عشرة فقط. إضافة رسالة فشل تحديث إشعار وإعادة توجيه إذا انتهت الجلسة عند تحميل بيانات المتدرب.
- نجح البناء و258 اختبارًا محليًا. الاختبارات الجديدة تشمل الروابط المباشرة والتبديل والحفاظ على الملف غير المحفوظ والحالات غير المعروفة وروابط الالتحاق الصحيحة ومنع فتح دورة/نسخة أخرى. محاكاة DOM وليست Browser QA أو فحصًا بصريًا للجوال.
- لا تغيير schema أو صلاحيات أو بيانات حية، ولا نشر. يبقى عرض/طباعة الشهادة التفصيلي وتفعيل نسخ الدورات الجديدة والفحص الفعلي للواجهات والمسار الكامل ضمن المتبقي؛ هذه الجولة لا تعني اكتمال مساحة المتدرب أو جاهزية مشاركة العملاء.

## تفاصيل سجل الشهادة داخل حساب المتدرب
- إضافة «عرض تفاصيل الشهادة» لقائمة الشهادات. تُقرأ الشهادة الحالية ثم الإكمال والتحاقه ومحاولة النجاح، مع فلترة كل طلب بهوية المستخدم، والتحقق من تطابق السلسلة واجتياز المحاولة وإكمال الالتحاق. إعادة فحص الهوية وحالة الشهادة قبل العرض ترفض الإلغاء أو تغيير الجلسة أثناء الطلب.
- تعرض الواجهة اسم الدورة المعروف وإصدارها ورمز الشهادة وتواريخ الإكمال والإصدار بالتقويم الميلادي ووقت الرياض ونتيجة التقييم ونوع الالتحاق. نصوص السجل عبر DOM/textContent؛ لا تفسير HTML ولا تمرير بيانات خارجية.
- طلب تفاصيل أحدث يمنع استجابة طلب أقدم من استبدال النتيجة، كما يمنع تغير generation عرض تفاصيل تخص جلسة سابقة. يعاد إخفاء السجل عند تحميل مساحة الحساب.
- نجاح البناء و263 اختبارًا محليًا؛ الجديد يشمل سلسلة البيانات وفلترة الملكية، رفض صفوف أجنبية والإلغاء أثناء الطلب وتغيير الجلسة والحالات غير المكتملة/الراسبة ودرجات غير صالحة وفشل قاعدة البيانات وعرض النصوص بأمان. هذه محاكاة API/DOM؛ لم تجر قراءة شهادات العملاء أو إنشاء شهادة أو تطبيق migration في هذه الجولة.
- ليس هذا تصميم الشهادة النهائي القابل للتنزيل أو الطباعة، ولا صفحة تحقق عامة؛ نص الواجهة يوضح ذلك. هذه الأعمال والفحص الفعلي للمتصفح والجوال باقية قبل اعتماد مساحة المتدرب. لم ينشر تحديث.

## اتساق الملف الشخصي والإشعارات
- إصلاح بطاقة الملف: تعرض القيم المؤكدة في استجابة الحفظ بدل بقاء الاسم والنبذة القديمين. حقول الملف مقفلة أثناء الحفظ، والطلبات المتكررة مرفوضة محليًا، وفشل الحفظ يحتفظ بالمسودة والبطاقة السابقة.
- عميل تحديث الملف يتحقق من تطابق الاسم والنبذة مع الاستجابة ومن وجود هوية صف؛ عميل قراءة الإشعار يتطلب timestamp صالحًا بدل اعتبار أي قيمة نجاحًا. الصلاحيات والهوية الخادمية تبقى بعقود RPC الحالية؛ لا تغيير في database أو طلبات حية خلال هذه الجولة.
- تحديد الإشعار كمقروء يحدث الزر والعداد بعد نجاح الخادم فقط، مرة واحدة ودون نزول العداد تحت الصفر. عند الفشل يظهر خطأ واضح ويمكن إعادة المحاولة. استجابات الملف والإشعارات القديمة لا تحدث واجهة بعد تغير generation للجلسة.
- البناء و268 اختبارًا محليًا ناجحة. الجديد يغطي الحفظ المتزامن والتحديث المؤكد وفشل الحفظ وحفظ المسودة والاستجابات القديمة ونجاح/فشل قراءة الإشعار وحدود العداد وعقود استجابة RPC. اختبارات محاكاة وليست Browser QA.
- حفظ المصدر دون نشر. تبقى شهادة التنزيل والطباعة والتحقق العام وتفعيل إصدارات المحتوى الجديدة وفحص النسخة الأحدث على المتصفح والجوال والمسار الكامل متبقية.

## إعدادات الشركة — حماية المسودات واتساق العرض
- تصحيح رسالة HTML القديمة التي وصفت إعدادات D6 كاملة بأنها توضيحية لا تحفظ، واستبدالها برسالة تحقق وتحميل؛ البنود غير المكتملة مثل الشعار والغلاف والألوان وسياسة التدريب تبقى موضحة في أماكنها.
- إخفاء نماذج المسؤول قبل تحميل بياناته، وبقاؤها مخفية لغير المخول. تحديث snapshot وaccess معًا بعد الحفظ، مع بقاء الدور المتوقع منذ اختيار العضو لحماية تعارض تعديل الدور.
- تتبع التعديلات غير المحفوظة بصورة مستقلة للنصوص والوحدات والأدوار والتنبيهات، ورسالة ظاهرة وطلب تحذير المتصفح عند مغادرة المستند. تأكيد حفظ قسم أو استعادة نصوص البوابة لا يمس علامة مسودات الأقسام الأخرى. التحذير يعتمد على دعم المتصفح وتفاعل المستخدم؛ لم يتحقق عبر Browser QA.
- البناء و270 اختبارًا محليًا ناجحة. اختبارات التتبع تثبت استقلال الأقسام وعدم تكرار العلامات وعدم إظهار تحذير لمستند نظيف. لا تغيير schema أو صلاحيات أو بيانات حية أو نشر في هذه الجولة. إعدادات العلامة وسياسة التدريب لا تزال أعمالًا متبقية.

## حفظ ألوان بوابة الشركة ومعاينتها
- تفعيل عقد RPC ضيق لتعديل اللون الأساسي والثانوي فقط، مع تحقق إدارة الشركة بالخادم، قفل الصف، ومقارنة اللونين المتوقعين لرفض الكتابة فوق تعديل متزامن. لا يغير نص البوابة أو الأصول أو الصلاحيات.
- اللونان بصيغة #RRGGBB فقط، وتباين النص الأبيض لا يقل عن 4.5 في العميل والخادم. وظيفة حساب التباين الخاصة غير متاحة مباشرة للأدوار العامة أو المصادقين. النماذج ضمن تحذير المسودات وقفل الحفظ والتحقق من الاستجابة.
- واجهة اختيار لونين ومعاينة نصية آمنة واستعادة القيم المحفوظة. توضح الواجهة أن تطبيق الألوان على جميع واجهات الحساب ما زال قيد الاستكمال؛ ليست ادعاء اكتمال هوية الشركة. رفع الشعار والغلاف وسياسة التدريب باقية.
- migration المسجلة: 20261015082231_company_portal_colors. اختبار SQL تراجعي أكد حفظ مالك الشركة، الحفاظ على النصوص، رفض مراجعة قديمة ولون ضعيف التباين وCSS غير صالح وnull، وعدم تعديل اللون عند فشل الطلب، ومنع مدير شركة أخرى وanon. التحقق المستقل بعد ROLLBACK: شركة الاختبار صفر.
- البناء و274 اختبارًا محليًا ناجحة، تشمل التباين وعقد الحفظ والتعارض والاستجابة والمعاينة. فحص الأمان بلا ERROR، مع استمرار مجموعات WARN السابقة الخاصة بالدوال المصرح بها وحماية كلمات المرور المسربة وINFO الخاصة بالجداول المغلقة. لا Browser QA لهذه الواجهة ولا نشر.

## Company brand image local preparation — 2026-10-15
- Recovered latest GitHub recovery branch after scratch maintenance; base commit 77069b0513910d5492e48304497804cadda2789f, tree deef85f4ea9ee98e35956e2a1fedffb97f13c3a2.
- Added owner-settings local logo/cover selectors and previews. PNG/JPEG allowlist, byte signatures, 2/5 MiB limits, decoded dimensions/pixel limits, decoder cleanup, stale-selection guard and object URL revocation.
- UI explicitly says selection is local and not uploaded/saved. No storage endpoint, storage policy or database mutation introduced. Client validation is not a substitute for server validation.
- Build and 277 local tests pass, including rejection and selection-race tests. No browser/mobile visual QA and no deployment.
- Remaining: authorized storage upload/save with server enforcement, branding application, then actual browser/mobile gate.

## Company brand image upload/save — 2026-10-15
- Applied migrations 20261015102142 and 20261015102329: private image bucket (5 MiB PNG/JPEG), scoped storage INSERT/SELECT, no authenticated UPDATE/DELETE; authenticated owner/SA save/load RPCs with disabled-tenant guard, path/kind/MIME/size checks and compare-and-swap against original key. Existing private asset/evidence buckets unchanged.
- Initial SQL test caught missing helper EXECUTE in storage policies; fixed via narrow private access helper in second migration and reran successfully. No broad grant to course-order helper.
- UI now uploads unique object paths, verifies upload receipt, rechecks identity before linking and after save, and previews saved objects using five-minute signed URLs. Explicit save required. Applying these assets across portals remains pending.
- Build + 281 local tests passed. Rolled-back SQL checks: owner insert/save, stale writes, oversized/missing/wrong-slot images, foreign insert/read/save and anonymous rejection, immutable object update. Cleanup: zero test organizations and zero brand objects.
- SQL storage objects were metadata fixtures only, not actual binary uploads. Real browser/Storage HTTP upload and mobile QA remain open; no frontend deployment.
- Server enforces permission/path/MIME metadata/size, not image decoding/signatures/dimensions; those checks currently run in browser only. A trusted binary validation pipeline remains a security hardening gate before general availability. Old/unlinked image retention has no automatic cleanup yet; do not claim full image lifecycle complete.
- Security advisors: no ERROR; existing INFO no-policy and WARN authenticated-definer/leaked-password-protection groups remain.

## Excel and Power BI source import — 2026-10-15
- User supplied KFO_Excel_PowerBI_Interactive (1).html; extracted without running uploaded JavaScript via scripts/import-data-skills.py.
- Native authoring drafts: excel-basics (7 explanation steps + 3 review questions + practical task), power-bi-basics (8 steps + 3 questions + task). Both unpublished, runtime_ready false; eight roadmap units each remain explicitly outline_only.
- Extracted five attachments byte-for-byte (two XLSX, three CSV), recorded source and attachment SHA-256. Confirmed XLSX ZIP/XML integrity (not Excel recalculation or visual QA), sales24/branches3/products4, total29828/Riyadh9028.
- Numeric response questions adapted to multiple choice for current authoring contract. Assessment review/randomization, skills/rubrics, remaining unit authoring, simulations, attachment delivery, database import/activation, progress/certificates and real application/browser QA remain open.
- Files are authoring-only: build does not ship this directory, solution files or answer keys. No database write or frontend deployment this round.

## Eight-unit Excel and Power BI curriculum drafts — 2026-10-15
- Authored all 8 roadmap units per course as editorial drafts: learning outcome, explanation, worked example, exercise and unit multiple-choice review. Added original sample steps as guided labs and one final evidence-review project each: Excel24 and PowerBI25 activities.
- Eight skills per course, every activity mapped; practical review rubrics total100 (Excel40/30/20/10, PowerBI30/30/25/15). Review answers vary across all three positions; fixed first-answer sample questions are not included in expanded curriculum.
- Kept original sample extraction immutable. Separate build-data-skills-drafts.mjs generates expanded curriculum from unit-authoring.json; validation uses existing native activity/design contracts.
- Checked Microsoft sources for XLOOKUP compatibility, PivotTable refresh, star schema/relationships, COUNTROWS granularity and DIVIDE. references.json records official URLs/check date. Training data claims remain verified by local CSV checks.
- No claim of final 6–9-hour duration, Excel recalculation, PBIX execution, visual QA, database import, deployment, learner progress or certificate activation. These are unpublished local authoring drafts; application and pedagogical review remain required.
- Validation result: build and286 local tests passed, including curriculum/design consistency, evidence rubric totals and exclusion of authoring solutions from public build.

## Persisted data-skills drafts in KFO administration — 2026-10-15
- Preflight confirmed excel-basics and power-bi-basics absent. Imported both atomically through existing SA metadata/design functions under authenticated SQL identity saud@hirely.sa. No new schema or migration.
- prepare-data-skills-import.mjs generates reviewable SQL only, with native validators and create-only revision-zero guard. It cannot overwrite an existing course; a conflicting import aborts both. Exact activity/design JSON and returned revision checked inside transaction before commit.
- Independent response: Excel24 activities/8 skills and PowerBI25/8, version1, metadata/lesson revisions1, published=false, runtime_ready=false. These rows now persist as actual administration drafts; not learner-ready releases.
- Rolled-back SQL verification passed: duplicate creation rejected; unready publish rejected; learner cannot read either draft; anonymous cannot read editor; both rows remain unpublished/unready at revisions1.
- Build and286 local tests passed. No actual browser administration test, Excel/PBIX execution or frontend deployment. Attachments remain authoring assets and are not delivered from learner runtime yet. Next: reviewed attachment delivery and learner runtime/release integration; application QA remains open.

## Data-skills practice attachments in player — 2026-10-15
- Added explicit course/version allowlist to player: Excel practice XLSX only, PowerBI Sales/Branches/Products CSV. Files shown only on content/practical_task activities; no change to assessment or completion/evidence mutations.
- Build ships exactly four synthetic practice assets under /assets/practice/data-skills-v1, verifies byte size/SHA-256 against original extraction manifest and recreates that output directory to avoid stale assets. Answer XLSX and authoring JSON remain excluded.
- Fixed download labels/paths rendered via DOM/textContent. Unknown courses, inherited object keys, foreign versions and string versions return no files. Original metadata and data rows unchanged.
- Initial controller tests required injecting the new real renderer dependency into their VM fixtures; corrected fixtures. Final build and289 local tests pass, including asset byte fidelity, solution exclusion and assessment rendering isolation.
- Not deployed or tested in an actual browser. Links become accessible on a built preview; courses remain unpublished/unready. Learner dynamic runtime/release activation, actual Office/PBIX QA and final gate remain open.

## Public course benchmark and KFO lesson pattern — 2026-10-15
- Paused release work per user request to review local/global free/open courses. Public-page research across Doroob, Edraak, Microsoft Learn, OpenLearn, MIT OCW and Saylor. No signed-in course completion or full media audit claimed.
- Saved evidence, reuse distinctions and design decisions in docs/KFO-course-benchmark-20261015.md. Free access is not treated as permission to copy/rebrand; no third-party course content/media imported.
- Implemented first KFO lesson layout: exact authored grammar becomes objective/explanation/example/practice sections. All text escaped, legacy/incomplete labels fall back to paragraphs, linebreaks/formulas retained. Existing brand colors; no logo/font changes or scoring mutations.
- Build +291 tests pass. No browser visual verification, database changes or deployment. Full instructional interaction/feedback, program screenshots and real application QA remain open.

## Formative Excel and Power BI labs — 2026-10-15
- Added Excel quantity/discount prediction exercise on unit2 and PowerBI branch-filter prediction exercise on unit6. Explanations show calculation, discount, row count and average; stale feedback clears on changed input and reset restores baseline.
- Explicit educational simulation, not actual Office/PBIX runtime. No grade, evidence, progress or certification writes. Official assessments untouched. Arabic/Persian digits supported; malformed/range-invalid values rejected.
- Public synthetic branch aggregates derived from reviewed CSV and checked against it (all29828/24; Riyadh9028/8/1128.50). Fixed course/version/activity allowlist; safe DOM labels and feedback.
- Build and295 local tests passed. Visual token check caught a disallowed green; changed to existing approved #205E1E. No browser visual QA, database change or deployment.
- Catalog clarification to user: five main courses (three original public self-study + two unpublished data-skills drafts), plus separate reference customer-service runtime course used for engine QA. Do not count the reference as an additional launch product without catalog review.

## Review release preparation — 2026-10-17
- Prepared real database review snapshots for both data-skills drafts at revisions1/1. Source text/design unchanged; one snapshot per course. See docs/qa/KFO-data-skills-release-review-20261017.md.
- Actual returned bundles validated against native contract and exact local source; all titles/text/options/skills/rubrics match, answer keys absent, every activity mapped.
- SA/learner/anonymous SQL preview boundary tests passed with rollback. Final read confirms both courses unpublished and runtime_ready=false. No deployment, learner activation or browser/Office/PBIX testing claimed.

## Enrollment-specific runtime loader — 2026-10-17
- Added loadEnrolledRelease and player integration: own active enrollment query scoped by ID+user, server bundle identity/course/version contract, answer-key rejection and final identity recheck. Exact reference course/version retains legacy path; unknown/inactive releases fail closed without falling back to another course.
- Proposed private runtime binding table and narrow my_course_release RPC prepared in supabase/proposals/enrolled_course_runtime_binding.sql. No binding rows, activation endpoint or publication included. Proposed server check includes live owner/enrollment, organization membership+enabled tenant, explicit release binding and published/runtime_ready guards.
- Supabase apply_migration returned ProtocolError -32600: "You do not have permission to perform this action". No migration version was assigned and no schema change was applied. Did not retry DDL through execute_sql. Proposal is unexecuted/unverified SQL and requires restored authorization before actual database QA.
- Build and300 local tests passed, including controller loading server course without reference fetch or legacy resolver; ownership/status/version/answer-leak/identity-race denial cases. Tests use mocks, not Browser QA.
- Current operational limit: deployed frontend unchanged, new backend loader unavailable, both data-skills courses remain unpublished/unready. No course completion/certification readiness claim. Backend activation/evidence integration and real browser/mobile/Office/PBIX QA remain open.

## 2026-10-17 — runtime binding applied after reconnection
- Supabase migration `20261017075351_enrolled_course_runtime_binding` applied successfully to KFO project.
- Real transactional SQL checks passed: exact Excel release and owner; unpublished release denied; foreign owner denied; cancelled enrollment denied; anon denied. All fixture enrollment/binding/publication/readiness changes rolled back.
- Binding table remains empty; Excel and Power BI remain unpublished and runtime_ready=false. No frontend deployment or course activation.
- Local frontend build and 300 tests passed before this DDL; SQL checks add separate database evidence, not browser evidence.
- Remaining launch blockers: reviewed activation transaction promoting activities/skills/rubrics/private assessment keys; course/catalog consolidation and content review; certificate download/verification; latest-source browser QA of learner/company/admin and payment boundary; MVP Gate and explicit publication approval.

## 2026-10-17 — operator activation implementation and database QA
- Applied migration `20261017080146_operator_course_release_activation` installs a private SECURITY INVOKER operator function, without API wrapper or anon/authenticated EXECUTE. Invocation also checks platform-admin identity.
- Activation locks the authoring/offer state, requires exact reviewed metadata/lesson revisions, refuses replacing any used course version, and atomically promotes skills, activities, activity-skill links, rubrics, question-skill links, private assessment keys, binding, readiness, publication and audit event.
- Actual SQL tests activated Excel and Power BI inside BEGIN/ROLLBACK only. Verified runtime activity counts, eight skills/question mappings per course, rubric, private keys, no orphan activities, stale/repeat/non-admin/client/anon rejection, learner runtime loading, content progress and practical-task self-completion rejection.
- Separate cleanup query confirms zero bindings and fixture enrollments; both courses remain unpublished/unready. No real course activation or frontend deployment. Human MVP/release approval is still required before operator invocation outside test rollback.
- This closes implementation of first activation; UI/browser QA, content approval and certificate work remain. Actual Excel/Power BI application testing remains open.
