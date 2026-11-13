/* Sarf — FR / AR strings, full RTL parity. */

const STRINGS = {
  fr: {
    appName: 'Sarf',
    masthead: 'Le cours du jour',
    stamp: (d) => `Relevé du ${d} (Alger)`,
    square: 'Square',
    bank: 'Banque d’Algérie',
    buy: 'Achat',
    sell: 'Vente',
    official: 'Officiel',
    premium: (p) => `+${p} % vs officiel`,
    gapTitle: 'L’écart',
    gapCaption: (g) => `Pour 1 €, le square donne ${g} DA de plus que la banque.`,
    boardTitle: 'Toutes les devises',
    asOf: (d) => `relevé ${d}`,
    noData: '—',
    convTitle: 'Convertisseur',
    convHave: 'J’ai',
    convDir1: (c) => `${c} → dinars`,
    convDir2: (c) => `Dinars → ${c}`,
    convAtSquare: 'Au square',
    convAtBank: 'À la banque (taux officiel)',
    convDiff: (v) => `Différence : ${v} DA`,
    convBuyNote: 'Taux d’achat du cambiste (vous vendez votre devise).',
    convSellNote: 'Taux de vente du cambiste (vous achetez la devise).',
    histTitle: 'Historique — EUR au square (vente)',
    histRange30: '30 derniers jours :',
    histBuilding: 'L’historique se construit automatiquement, un relevé par jour.',
    histEmpty: 'Pas encore assez de relevés pour tracer une courbe.',
    alertsTitle: 'Alertes',
    alertsSub: 'Fixez un seuil ; Sarf vous le signale dès l’ouverture.',
    alertWhen: 'Me signaler si',
    alertAbove: 'dépasse',
    alertBelow: 'passe sous',
    alertSet: 'Activer',
    alertRemove: 'Retirer',
    alertFired: (c, dir, t, v) => `${c} ${dir === 'above' ? 'a dépassé' : 'est passé sous'} votre seuil de ${t} DA : ${v} DA aujourd’hui.`,
    alertNone: 'Aucune alerte active.',
    da: 'DA',
    sourcesTitle: 'Sources',
    legal: 'Informations à titre indicatif, agrégées de sources publiques. Les taux du marché parallèle varient selon la ville et se négocient. Sarf n’achète, ne vend et ne met en relation pour aucune opération de change.',
    updated: 'Dernière mise à jour',
    langSwitch: 'العربية',
    trendUp: 'en hausse',
    trendDown: 'en baisse',
    trendFlat: 'stable',
    vsPrev: (d) => `vs ${d}`,
  },
  ar: {
    appName: 'صرف',
    masthead: 'سعر اليوم',
    stamp: (d) => `تسعيرة ${d} (الجزائر)`,
    square: 'السكوار',
    bank: 'بنك الجزائر',
    buy: 'شراء',
    sell: 'بيع',
    official: 'الرسمي',
    premium: (p) => `‎+${p}٪ مقارنة بالرسمي`,
    gapTitle: 'الفارق',
    gapCaption: (g) => `مقابل 1 أورو، يعطيك السكوار ${g} دج زيادة على البنك.`,
    boardTitle: 'كل العملات',
    asOf: (d) => `تسعيرة ${d}`,
    noData: '—',
    convTitle: 'المحوّل',
    convHave: 'عندي',
    convDir1: (c) => `${c} ← دينار`,
    convDir2: (c) => `دينار ← ${c}`,
    convAtSquare: 'في السكوار',
    convAtBank: 'في البنك (السعر الرسمي)',
    convDiff: (v) => `الفرق: ${v} دج`,
    convBuyNote: 'سعر شراء الصرّاف (أنت تبيع العملة).',
    convSellNote: 'سعر بيع الصرّاف (أنت تشتري العملة).',
    histTitle: 'المنحنى — الأورو في السكوار (بيع)',
    histRange30: 'آخر 30 يومًا:',
    histBuilding: 'المنحنى يتكوّن تلقائيًا، تسعيرة كل يوم.',
    histEmpty: 'لا توجد تسعيرات كافية بعد لرسم المنحنى.',
    alertsTitle: 'التنبيهات',
    alertsSub: 'حدّد عتبة؛ صرف ينبّهك عند فتح التطبيق.',
    alertWhen: 'نبّهني إذا',
    alertAbove: 'تجاوز',
    alertBelow: 'نزل تحت',
    alertSet: 'تفعيل',
    alertRemove: 'حذف',
    alertFired: (c, dir, t, v) => `${c} ${dir === 'above' ? 'تجاوز' : 'نزل تحت'} عتبتك ${t} دج: ‏${v} دج اليوم.`,
    alertNone: 'لا تنبيهات مفعّلة.',
    da: 'دج',
    sourcesTitle: 'المصادر',
    legal: 'معلومات إرشادية مجمّعة من مصادر عمومية. أسعار السوق الموازية تختلف حسب المدينة وقابلة للتفاوض. صرف لا يشتري ولا يبيع ولا يتوسّط في أي عملية صرف.',
    updated: 'آخر تحديث',
    langSwitch: 'Français',
    trendUp: 'في ارتفاع',
    trendDown: 'في انخفاض',
    trendFlat: 'مستقر',
    vsPrev: (d) => `مقارنة بـ${d}`,
  },
};

const CURRENCY_META = {
  EUR: { fr: 'Euro', ar: 'أورو', sym: '€' },
  USD: { fr: 'Dollar US', ar: 'دولار أمريكي', sym: '$' },
  GBP: { fr: 'Livre sterling', ar: 'جنيه إسترليني', sym: '£' },
  CAD: { fr: 'Dollar canadien', ar: 'دولار كندي', sym: 'C$' },
};

let LANG = localStorage.getItem('sarf.lang') || 'fr';
function t(key, ...args) {
  const v = (STRINGS[LANG] && STRINGS[LANG][key]) ?? STRINGS.fr[key] ?? key;
  return typeof v === 'function' ? v(...args) : v;
}
function setLang(lang) {
  LANG = lang;
  localStorage.setItem('sarf.lang', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}
function fmtDA(n, digits = 0) {
  return n.toLocaleString(LANG === 'ar' ? 'ar-DZ' : 'fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function fmtDate(iso) {
  return new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString(
    LANG === 'ar' ? 'ar-DZ' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtDateShort(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString(LANG === 'ar' ? 'ar-DZ' : 'fr-FR', { day: 'numeric', month: 'short' });
}
