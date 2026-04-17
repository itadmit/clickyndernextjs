import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  Calendar, 
  Clock, 
  Users, 
  Building2, 
  Settings, 
  Zap,
  CheckCircle,
  TrendingUp,
  Smartphone,
  Shield,
  Star,
  ArrowLeft,
  Scissors,
  Stethoscope,
  Sparkles,
  Activity,
  Scale,
  Car,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Send,
  MessageCircle,
  Bell,
  CheckCheck,
  HelpCircle,
  ChevronDown,
  BookOpen,
  CreditCard,
  UserPlus,
  Repeat,
  ShieldCheck,
  Tag,
  ClipboardList,
  FileSignature,
  BellRing,
} from 'lucide-react';

const BookingPhoneDemo = dynamic(
  () => import('@/components/landing/BookingPhoneDemo'),
  { ssr: false }
);

// App Store · Google Play (רשימות רשמיות)
const APP_STORE_URL =
  'https://apps.apple.com/us/app/%D7%A7%D7%9C%D7%99%D7%A7%D7%99%D7%A0%D7%93%D7%A8-%D7%9E%D7%A2%D7%A8%D7%9B%D7%AA-%D7%9C%D7%A0%D7%99%D7%94%D7%95%D7%9C-%D7%AA%D7%95%D7%A8%D7%99%D7%9D/id6446245664';
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.clickynder';
/** תג Google Play רשמי (PNG) – יציב יותר מ-SVG חיצוני */
const GOOGLE_PLAY_BADGE_URL =
  'https://play.google.com/intl/iw_il/badges/static/images/badges/iw_badge_web_generic.png';

const faqItems = [
  {
    question: 'מהי מערכת ניהול תורים?',
    answer:
      'מערכת ניהול תורים היא תוכנה מקצועית המאפשרת לעסקים לנהל את יומן התורים שלהם בצורה דיגיטלית ואוטומטית. המערכת כוללת לוח שנה חכם, קביעת תורים אונליין על ידי הלקוחות, שליחת תזכורות אוטומטיות בוואטסאפ או SMS, וניהול מלא של לקוחות ועובדים. קליקינדר (Clickinder) היא מערכת ניהול תורים מתקדמת שפותחה במיוחד לעסקים בישראל, עם ממשק בעברית ותמיכה מלאה בשפה העברית.',
  },
  {
    question: 'כמה עולה מערכת ניהול תורים של קליקינדר?',
    answer:
      'קליקינדר מציעה 60 יום ניסיון חינם ו-3 תוכניות מחיר. חבילת עסקים קטנים עולה ₪99 לחודש וכוללת עד 3 עובדים, סניף אחד ו-100 תורים בחודש. חבילת עסקים עולה ₪199 לחודש וכוללת עד 10 עובדים, 5 סניפים ו-500 תורים. חבילת אנלימיטד עולה ₪499 לחודש עם עובדים, סניפים ותורים ללא הגבלה.',
  },
  {
    question: 'איך עובדת קביעת תורים אונליין?',
    answer:
      'עם קליקינדר, הלקוחות שלך מקבלים קישור ייחודי לדף הזמנת התורים של העסק. הם יכולים לבחור שירות, עובד, תאריך ושעה פנויה – והכל קורה אונליין, 24 שעות ביממה, 7 ימים בשבוע. לאחר קביעת התור, הלקוח מקבל אישור אוטומטי בוואטסאפ, ותזכורת נשלחת 24 שעות לפני התור. זימון תורים מעולם לא היה כל כך פשוט.',
  },
  {
    question: 'האם קליקינדר מתאימה לעסק שלי?',
    answer:
      'קליקינדר מתאימה לכל עסק שעובד עם תורים ופגישות. המערכת משמשת מספרות, מכוני יופי וספא, קליניקות רפואיות ומרפאות שיניים, אולפני כושר, יועצים עסקיים ומשפטיים, בתי ספר לנהיגה ועוד. אם העסק שלך דורש ניהול תורים – קליקינדר היא הפתרון. המערכת תומכת בסניפים מרובים, מספר עובדים, ושירותים מגוונים.',
  },
  {
    question: 'איך מערכת התזכורות עובדת?',
    answer:
      'מערכת התזכורות של קליקינדר שולחת הודעות אוטומטיות ללקוחות דרך WhatsApp. הלקוחות מקבלים אישור מיידי לאחר קביעת תור, תזכורת 24 שעות לפני התור, ועדכונים על שינויים או ביטולים. התזכורות מפחיתות באופן משמעותי את אחוז ה"לא הגיעו" (no-shows) ומשפרות את ניצולת הזמנים בעסק שלך.',
  },
  {
    question: 'האם צריך להוריד אפליקציה?',
    answer:
      'ללקוחות שלך – לא חובה. הם יכולים לקבוע תור מהדפדפן בכל מכשיר, בלי התקנה. לבעלי עסק ולצוות – מומלץ מאוד להוריד את האפליקציה הרשמית ל-iPhone (App Store) ול-Android (Google Play): תקבלו עדכונים חשובים כהתראות פוש (תור חדש, ביטול, שינוי) – מרוכז, שקט ומקצועי, בלי להסתמך על הודעות וואטסאפ לניהול השוטף.',
  },
  {
    question: 'האם בעלי העסק מקבלים עדכונים בוואטסאפ?',
    answer:
      'ניהול השוטף לבעל העסק ולצוות מתוכנן דרך האפליקציה לנייד עם עדכוני פוש – כך נשמרת חוויה יוקרתית ונקייה, בלי שרשרת הודעות בצ׳אט. וואטסאפ נשאר ממוקד בלקוחות: אישורי הזמנה, תזכורות לפני התור והצעות מרשימת המתנה – מה שמפחית ביטולים ומשפר שירות.',
  },
  {
    question: 'מה ההבדל בין קליקינדר למערכות ניהול תורים אחרות?',
    answer:
      'קליקינדר תוכננה מהיסוד לעסקים בישראל, עם ממשק בעברית מלאה וכיוון RTL. יש אפליקציה רשמית ל-iOS ול-Android עם עדכוני פוש לבעלי עסק, אינטגרציית WhatsApp ללקוחות (תזכורות), שיעורים קבוצתיים, רשימת המתנה חכמה, סליקת אשראי ומקדמות, תורים חוזרים, מדיניות ביטול, קופונים, חתימה דיגיטלית, תמיכה בסניפים מרובים, לוח שנה חכם עם גרירה ושחרור, וניתוח נתונים מתקדם. בנוסף, אנו מציעים 60 יום ניסיון חינם.',
  },
  {
    question: 'האם המערכת מאובטחת?',
    answer:
      'בהחלט. קליקינדר משתמשת בהצפנת נתונים מתקדמת (SSL/TLS) להגנה על כל המידע. הנתונים מגובים באופן אוטומטי, והמערכת עומדת בתקני אבטחת מידע מחמירים. פרטיות הלקוחות שלך והמידע העסקי שלך מוגנים תמיד.',
  },
  {
    question: 'האם אפשר לנהל שיעורים קבוצתיים כמו פילאטיס ויוגה?',
    answer:
      'כן! קליקינדר תומכת בשיעורים קבוצתיים ב-100%. ניתן להגדיר שירות כ"קבוצתי" עם מספר מקסימלי ומינימלי של משתתפים, ליצור סשנים עם מדריך ושעה מסוימים, ולאפשר ללקוחות להירשם אונליין. המערכת מציגה כמה מקומות פנויים נותרו בכל סשן ומונעת רישום יתר אוטומטית. מתאים לסטודיו ליוגה, פילאטיס, קרוספיט, חוגים ועוד.',
  },
  {
    question: 'מה זה רשימת המתנה ואיך זה עובד?',
    answer:
      'רשימת המתנה מאפשרת ללקוחות להירשם לרשימה כאשר כל המועדים תפוסים. כשתור מתבטל, המערכת שולחת אוטומטית הודעת WhatsApp לממתין הבא ומציעה לו את המקום שהתפנה. זה עוזר למקסם את ניצולת לוח הזמנים ולמנוע חורים ביומן. ניתן להפעיל רשימת המתנה לכל שירות בנפרד.',
  },
  {
    question: 'האם אפשר לגבות תשלום או מקדמה בעת קביעת התור?',
    answer:
      'כן! קליקינדר משלבת סליקת אשראי מאובטחת דרך Quick Payments (PayMe). ניתן לדרוש תשלום מלא מראש, מקדמה בסכום קבוע, או מקדמה באחוז מהמחיר. ניתן להגדיר חובת תשלום לכל שירות בנפרד. הלקוחות מזינים את פרטי כרטיס האשראי בצורה מאובטחת ומקבלים אישור מיידי.',
  },
  {
    question: 'האם יש אפשרות לתורים חוזרים?',
    answer:
      'בהחלט! ניתן ליצור סדרת תורים חוזרים (שבועיים, דו-שבועיים, חודשיים) ללקוח – לדוגמה, שיעור פילאטיס כל שבוע באותו יום ושעה. המערכת מייצרת את כל התורים בסדרה אוטומטית, ואפשר לבטל את כל הסדרה או תור בודד לפי הצורך.',
  },
  {
    question: 'האם אפשר להגדיר מדיניות ביטול?',
    answer:
      'כן. קליקינדר מאפשרת להגדיר מדיניות ביטול מותאמת אישית: מועד אחרון לביטול (למשל 24 שעות לפני התור), עמלת ביטול מאוחר באחוזים, ועמלת אי-הגעה (no-show). המדיניות מוצגת ללקוחות לפני אישור ההזמנה.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Clickinder - קליקינדר',
      alternateName: ['Clickynder', 'קליקינדר'],
      description:
        'מערכת ניהול תורים מתקדמת לעסקים בישראל. אפליקציה רשמית ל-iOS ול-Android עם עדכוני פוש לבעלי עסק, קביעת תורים אונליין, תזכורות WhatsApp ללקוחות, לוח שנה חכם, ניהול סניפים, שיעורים קבוצתיים, רשימת המתנה, סליקת אשראי, תורים חוזרים ומדיניות ביטול.',
      url: 'https://clickynder.com',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, iOS, Android',
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: '0',
        highPrice: '999',
        priceCurrency: 'ILS',
        offerCount: 4,
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '150',
        bestRating: '5',
        worstRating: '1',
      },
      inLanguage: 'he',
      screenshot: 'https://clickynder.com/assets/og-image.png',
    },
    {
      '@type': 'Organization',
      name: 'Clickinder',
      alternateName: 'קליקינדר',
      url: 'https://clickynder.com',
      logo: 'https://clickynder.com/assets/logo.png',
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'Clickinder@gmail.com',
        contactType: 'customer service',
        availableLanguage: ['Hebrew', 'English'],
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Tel Aviv',
        addressCountry: 'IL',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ],
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <img
              src="/assets/logo.png"
              alt="Clickinder - קליקינדר מערכת ניהול תורים"
              className="h-8 md:h-10"
            />
          </Link>
          <div className="flex gap-2 md:gap-4">
            <Link
              href="/auth/signin"
              className="px-3 md:px-4 py-2 text-sm md:text-base text-gray-700 hover:text-primary-600 transition-colors border border-transparent hover:border-gray-300 rounded-lg"
            >
              התחברות
            </Link>
            <Link
              href="/auth/register"
              className="btn btn-primary text-sm md:text-base px-3 md:px-4"
            >
              הרשמה חינם
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Zap className="w-4 h-4" />
          <span>60 יום ניסיון חינם - ללא כרטיס אשראי</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
          קליקינדר – מערכת ניהול תורים<br />
          <span className="text-primary-600">מתקדמת לעסקים</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
          מערכת ניהול תורים שמחליפה את הבלאגן ביומן – עם{' '}
          <strong className="text-gray-800 font-semibold">אפליקציה רשמית ל-iPhone ול-Android</strong>{' '}
          לבעלי עסק ולצוות: עדכונים חשובים מגיעים כ<strong className="text-gray-800 font-semibold">התראות פוש</strong>{' '}
          (תור חדש, ביטול, שינוי) – נקי, מרוכז ויוקרתי, בלי לנהל את העסק בוואטסאפ. הלקוחות שלך עדיין מקבלים תזכורות בוואטסאפ לפני התור. 
          בנוסף: שיעורים קבוצתיים, סליקת אשראי, רשימת המתנה ותורים חוזרים – הכל במקום אחד.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            href="/auth/register"
            className="btn btn-primary text-lg px-10 py-4 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all"
          >
            התחל בחינם - 60 יום ללא התחייבות
            <ArrowLeft className="w-5 h-5 inline mr-2" />
          </Link>
          <a
            href="#features"
            className="btn btn-secondary text-lg px-10 py-4"
          >
            גלה את היכולות
          </a>
        </div>

        <p className="text-sm text-gray-500">
          ✓ ללא כרטיס אשראי  ✓ התקנה מיידית  ✓ ביטול בכל עת
        </p>

      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16 bg-white rounded-3xl shadow-lg -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl md:text-5xl font-bold text-primary-600 mb-2">98%</div>
            <div className="text-gray-600">שביעות רצון לקוחות</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold text-primary-600 mb-2">50%</div>
            <div className="text-gray-600">חיסכון בזמן ניהול</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold text-primary-600 mb-2">70%</div>
            <div className="text-gray-600">הפחתת ביטולים עם סליקה</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold text-primary-600 mb-2">24/7</div>
            <div className="text-gray-600">קביעת תורים אונליין מסביב לשעון</div>
          </div>
        </div>
      </section>

      {/* Booking Phone Demo */}
      <BookingPhoneDemo />

      {/* Native apps – flagship strip */}
      <section className="container mx-auto px-4 py-16 md:py-20" aria-labelledby="native-apps-heading">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-10 md:px-14 md:py-14 text-white shadow-2xl border border-slate-700/50">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="relative flex flex-col gap-10 lg:gap-12">
            <div className="text-right space-y-5 max-w-3xl mx-auto w-full">
              <p className="text-xs font-semibold tracking-widest text-slate-400">
                אייפון · אנדרואיד
              </p>
              <h2 id="native-apps-heading" className="text-3xl md:text-4xl font-bold leading-tight">
                ניהול עסק מהנייד – ברמת אפליקציה יוקרתית
              </h2>
              <p className="text-slate-300 text-base md:text-lg leading-relaxed">
                האפליקציה הרשמית של קליקינדר זמינה ב-<strong className="text-white font-semibold">App Store</strong> וב-{' '}
                <strong className="text-white font-semibold">Google Play</strong>. בעלי עסק וצוות מקבלים עדכונים חיוניים כ-{' '}
                <strong className="text-white font-semibold">התראות פוש</strong> – ממוקד, שקט ומקצועי, בלי לבזבז זמן על הודעות וואטסאפ פנימיות.
              </p>
              <ul className="space-y-3 text-sm md:text-base text-slate-200">
                <li className="flex items-start gap-3">
                  <BellRing className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" aria-hidden />
                  <span>תור חדש, ביטול, שינוי שעה – נכנס ישר לפוש</span>
                </li>
                <li className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" aria-hidden />
                  <span>וואטסאפ נשאר ללקוחות: אישורים ותזכורות לפני התור</span>
                </li>
              </ul>
            </div>
            <div className="flex w-full flex-col items-center justify-center gap-5 border-t border-slate-600/60 pt-8">
              <p className="text-slate-200 text-base md:text-lg font-semibold text-center w-full">
                הורידו עכשיו
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4">
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-90 transition-opacity"
                >
                  <img
                    src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/white/he-il?size=250x83&releaseDate=1316044800"
                    alt="הורד אפליקציית קליקינדר ל-iPhone מ-App Store"
                    className="h-14 md:h-16 w-auto"
                  />
                </a>
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-90 transition-opacity"
                >
                  <img
                    src={GOOGLE_PLAY_BADGE_URL}
                    alt="הורד אפליקציית קליקינדר ל-Android מ-Google Play"
                    className="h-14 md:h-16 w-auto"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <BookOpen className="w-4 h-4" />
            <span>למה צריך מערכת ניהול תורים?</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            מהי מערכת ניהול תורים?
          </h2>
          <div className="text-lg text-gray-700 leading-relaxed space-y-4 text-center">
            <p>
              <strong>מערכת ניהול תורים</strong> היא תוכנה דיגיטלית שמחליפה את היומן הישן ומאפשרת לעסקים 
              לנהל את כל התורים, הפגישות ולוחות הזמנים שלהם במקום אחד ובצורה אוטומטית. 
              במקום לענות לטלפונים ולתאם ידנית, <strong>מערכת לניהול תורים</strong> מאפשרת ללקוחות לקבוע 
              תורים בעצמם דרך האינטרנט, בכל שעה ומכל מכשיר.
            </p>
            <p>
              <strong>תוכנה לניהול תורים</strong> כמו קליקינדר (Clickinder) כוללת <strong>יומן תורים דיגיטלי</strong> חכם, 
              שליחת תזכורות אוטומטיות בוואטסאפ ו-SMS, ניהול לקוחות ועובדים, תמיכה בסניפים מרובים, 
              ודוחות ביצועים מפורטים. המערכת מפחיתה משמעותית את אחוז הביטולים וה-"לא הגיעו" (no-shows), 
              חוסכת שעות עבודה יומיות, ומשפרת את חוויית הלקוח.
            </p>
            <p>
              קליקינדר כוללת גם <strong>אפליקציה רשמית ל-iPhone ול-Android</strong> לבעלי עסק ולצוות, עם{' '}
              <strong>עדכוני פוש</strong> לתורים חדשים וביטולים – חוויה מקצועית בלי לנהל הכל בוואטסאפ פנימי, 
              בנוסף ל-<strong>ניהול שיעורים קבוצתיים</strong> כמו פילאטיס ויוגה, 
              <strong> רשימת המתנה חכמה</strong>, <strong>סליקת אשראי ומקדמות</strong>, <strong>תורים חוזרים</strong> 
              ו<strong>מדיניות ביטול</strong> גמישה שמגינה על ההכנסות שלכם.
            </p>
            <p>
              בין אם אתם מחפשים <strong>אפליקציה לניהול תורים</strong> למספרה, <strong>מערכת תורים לקליניקה</strong>, 
              <strong>מערכת תורים לשיעורי קבוצה</strong>, או <strong>מערכת הזמנת תורים</strong> לכל סוג של עסק מבוסס-פגישות – 
              קליקינדר מספקת את הפתרון המלא עם <strong>קביעת תורים אונליין</strong>, סליקה מאובטחת, 
              ממשק בעברית, ותמיכה ישראלית מלאה.
            </p>
          </div>
        </div>
      </section>

      {/* New Features Highlight */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-100 to-purple-100 text-primary-700 px-5 py-2 rounded-full text-sm font-bold mb-6">
              <Sparkles className="w-4 h-4" />
              <span>חדש! תכונות מתקדמות</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4"> כל מה שצריך לניהול עסק מקצועי – במערכת אחת </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              מעבר לניהול תורים בסיסי – קליקינדר מציעה חבילת כלים שלמה כולל שיעורים קבוצתיים, 
              סליקת אשראי, רשימת המתנה, תורים חוזרים, קופונים ומדיניות ביטול
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
              <Users className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">שיעורים קבוצתיים</h3>
              <p className="text-gray-700 text-sm">פילאטיס, יוגה, קרוספיט – ניהול סשנים עם מגבלת משתתפים, רישום אונליין ומקומות פנויים בזמן אמת.</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
              <CreditCard className="w-10 h-10 text-green-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">סליקת אשראי ומקדמות</h3>
              <p className="text-gray-700 text-sm">גבייה מראש או מקדמה בעת ההזמנה. סליקה מאובטחת דרך Quick Payments – פחות ביטולים, יותר הכנסות.</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
              <UserPlus className="w-10 h-10 text-purple-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">רשימת המתנה חכמה</h3>
              <p className="text-gray-700 text-sm">תור התבטל? המערכת מציעה את המקום אוטומטית לממתין הבא דרך WhatsApp. אפס חורים ביומן.</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
              <Repeat className="w-10 h-10 text-orange-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">תורים חוזרים</h3>
              <p className="text-gray-700 text-sm">סדרות תורים שבועיות או חודשיות ללקוחות קבועים. המערכת מייצרת את כל הסדרה בלחיצה אחת.</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
              <ShieldCheck className="w-10 h-10 text-red-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">מדיניות ביטול</h3>
              <p className="text-gray-700 text-sm">הגדרת מועד אחרון לביטול, עמלת ביטול מאוחר ועמלת no-show. הגנה אוטומטית על ההכנסות שלך.</p>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-6 border border-teal-200">
              <Tag className="w-10 h-10 text-teal-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">קופונים ומבצעים</h3>
              <p className="text-gray-700 text-sm">קודי הנחה באחוזים או בסכום קבוע. הגדרת תוקף, מגבלת שימוש – כלי שיווקי רב-עוצמה.</p>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-3xl p-8 md:p-12 border-2 border-green-200">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full mb-6">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-bold">WhatsApp Business</span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  תזכורות תורים אוטומטיות בוואטסאפ
                </h2>
                
                <p className="text-lg text-gray-700 mb-6">
                  מערכת התזכורות של קליקינדר שולחת ללקוחות שלך התראות ישירות לוואטסאפ – 
                  אישור הזמנה, תזכורת לפני התור ועדכונים על שינויים. הפחת "לא הגיעו" בעד 70%!
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-500 text-white p-2 rounded-lg flex-shrink-0">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">תזכורות אוטומטיות</div>
                      <div className="text-gray-600 text-sm">תזכורת 24 שעות לפני התור – מפחיתה ביטולים ומשפרת ניצולת</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-green-500 text-white p-2 rounded-lg flex-shrink-0">
                      <CheckCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">אישורי הזמנה</div>
                      <div className="text-gray-600 text-sm">אישור מיידי לאחר קביעת תור עם כל הפרטים</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-green-500 text-white p-2 rounded-lg flex-shrink-0">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">עדכונים בזמן אמת</div>
                      <div className="text-gray-600 text-sm">שינויים, ביטולים והודעות חשובות – הכל ישירות לוואטסאפ של הלקוח</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                    <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                      C
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Clickinder</div>
                      <div className="text-xs text-gray-500">מערכת ניהול תורים</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-green-100 rounded-2xl rounded-tr-sm p-4 mr-auto max-w-[85%]">
                      <p className="text-sm text-gray-800">
                        👋 שלום! התור שלך אצל <strong>מספרת סטייל</strong> מחר ב-<strong>14:00</strong>
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        📍 רחוב הרצל 25, תל אביב
                      </p>
                    </div>

                    <div className="bg-green-100 rounded-2xl rounded-tr-sm p-4 mr-auto max-w-[85%]">
                      <p className="text-sm text-gray-800">
                        💇‍♂️ שירות: <strong>תספורת גברים</strong>
                      </p>
                      <p className="text-sm text-gray-800 mt-1">
                        👤 מעצב: <strong>דני כהן</strong>
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                        ביטול
                      </button>
                      <button className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                        אישור
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 text-center mt-4">
                    <MessageCircle className="w-3 h-3 inline mr-1" />
                    WhatsApp Business
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20 mt-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            למה לבחור ב-Clickinder לניהול התורים?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            מערכת ניהול תורים מקיפה עם 18 כלים מתקדמים – מקביעת תורים ועד סליקה, שיעורים קבוצתיים וניתוח נתונים
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Calendar className="w-8 h-8" />}
            title="לוח שנה חכם לניהול תורים"
            description="יומן תורים דיגיטלי עם תצוגה יומית, שבועית וחודשית. גררו ושחררו תורים בקלות, צפו בזמינות בזמן אמת, וקבלו תמונה מלאה של לוח הפגישות – הכל ממשק אחד אינטואיטיבי."
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="ניהול עובדים ושירותים"
            description="הגדירו שעות עבודה ייחודיות לכל עובד, שייכו שירותים מתאימים ועקבו אחר זמינות בזמן אמת. כל עובד מקבל לוח תורים אישי ושליטה מלאה ביומן שלו."
          />
          <FeatureCard
            icon={<Building2 className="w-8 h-8" />}
            title="ניהול סניפים מרובים"
            description="מנהלים רשת עסקים? נהלו מספר סניפים ממקום אחד עם הגדרות נפרדות לכל סניף – שעות פעילות, עובדים, שירותים ומחירים שונים. מערכת תורים לעסקים עם מספר מיקומים."
          />
          <FeatureCard
            icon={<Clock className="w-8 h-8" />}
            title="קביעת תורים אונליין 24/7"
            description="הלקוחות שלך קובעים תורים בכל שעה, מכל מכשיר, ללא צורך בטלפון. דף הזמנה ייעודי מותאם לעסק שלך מאפשר זימון תורים אונליין פשוט ומהיר."
          />
          <FeatureCard
            icon={<Settings className="w-8 h-8" />}
            title="התאמה אישית מלאה"
            description="עצבו את עמוד ההזמנה בצבעים ובלוגו שלכם, הגדירו שירותים עם מחירים ומשך זמן, וצרו תבניות הודעות מותאמות אישית. מערכת הזמנת תורים שמשקפת את המותג שלכם."
          />
          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="תזכורות תורים אוטומטיות"
            description="שליחת תזכורות אוטומטיות בוואטסאפ, SMS ואימייל. הפחיתו 'לא הגיעו' ביותר מ-70% עם תזכורות חכמות שנשלחות לפני כל תור. תזכורות תורים וואטסאפ ללא מאמץ."
          />
          <FeatureCard
            icon={<Smartphone className="w-8 h-8" />}
            title="אפליקציה ל-iPhone ול-Android + פוש לבעלי עסק"
            description="אפליקציה רשמית ב-App Store וב-Google Play. בעלי עסק וצוות מקבלים עדכונים חשובים כהתראות פוש – נקי ויוקרתי, בלי לנהל את היומן בוואטסאפ. גם מהדפדפן: ממשק מלא במחשב ובטאבלט."
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8" />}
            title="אבטחת מידע מתקדמת"
            description="הצפנת נתונים SSL/TLS מלאה, גיבויים אוטומטיים ועמידה בתקני אבטחה מחמירים. המידע שלך ושל הלקוחות שלך מוגן בצורה המקסימלית."
          />
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="דוחות וניתוח ביצועים"
            description="מעקב אחר מגמות הזמנה, תובנות עסקיות והחלטות מבוססות נתונים. ראו אילו שירותים הכי פופולריים, מהן שעות השיא, ואיך לייעל את לוח הזמנים שלכם."
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="שיעורים קבוצתיים"
            description="ניהול שיעורי קבוצה כמו פילאטיס, יוגה, קרוספיט וחוגים. הגדירו מספר משתתפים מקסימלי, צרו סשנים קבוצתיים ואפשרו ללקוחות להירשם אונליין. המערכת מציגה מקומות פנויים בזמן אמת."
          />
          <FeatureCard
            icon={<UserPlus className="w-8 h-8" />}
            title="רשימת המתנה חכמה"
            description="כשהתורים מלאים – לקוחות יכולים להירשם לרשימת המתנה. ברגע שמתפנה מקום, המערכת שולחת הצעה אוטומטית בוואטסאפ לממתין הבא. מקסמו ניצולת וצמצמו חורים ביומן."
          />
          <FeatureCard
            icon={<CreditCard className="w-8 h-8" />}
            title="סליקת אשראי ומקדמות"
            description="גבו תשלום מראש או מקדמה בעת קביעת התור עם סליקה מאובטחת דרך Quick Payments. הגדירו חובת תשלום לכל שירות, סכום מקדמה קבוע או באחוזים. הפחיתו ביטולים והבטיחו הכנסות."
          />
          <FeatureCard
            icon={<Repeat className="w-8 h-8" />}
            title="תורים חוזרים"
            description="צרו סדרות תורים חוזרים לקוחות קבועים – שבועיים, דו-שבועיים או חודשיים. המערכת מייצרת את כל התורים בסדרה אוטומטית. מושלם לטיפולים סדרתיים, שיעורים קבועים ולקוחות נאמנים."
          />
          <FeatureCard
            icon={<ShieldCheck className="w-8 h-8" />}
            title="מדיניות ביטול אוטומטית"
            description="הגדירו מועד אחרון לביטול, עמלת ביטול מאוחר ועמלת אי-הגעה. המדיניות נאכפת אוטומטית ומוצגת ללקוחות לפני אישור ההזמנה. הגנו על ההכנסות שלכם מביטולים ברגע האחרון."
          />
          <FeatureCard
            icon={<Tag className="w-8 h-8" />}
            title="קופונים ומבצעים"
            description="צרו קודי קופון עם הנחות באחוזים או בסכום קבוע. הגדירו תאריכי תוקף, מגבלת שימוש וסטטוס פעיל. כלי שיווקי מצוין למשיכת לקוחות חדשים ושימור קיימים."
          />
          <FeatureCard
            icon={<FileSignature className="w-8 h-8" />}
            title="טפסי קבלה וחתימה דיגיטלית"
            description="הציגו טפסי PDF ישירות במהלך ההזמנה וקבלו חתימה דיגיטלית מהלקוחות. מושלם להסכמות טיפול, ויתורים רפואיים ותנאי שירות. הכל דיגיטלי וללא ניירת."
          />
          <FeatureCard
            icon={<ClipboardList className="w-8 h-8" />}
            title="פורטל לקוחות ומעקב"
            description="הלקוחות יכולים לצפות בתורים שלהם – עתידיים ועברים – מדף ייעודי. מעקב אחר אי-הגעות (no-shows), עמלות עובדים, וניהול משאבים ומתקנים. שקיפות מלאה ללקוחות ולצוות."
          />
        </div>
      </section>

      {/* Who is it for Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            למי מתאימה מערכת ניהול התורים של קליקינדר?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            אפליקציית התורים של Clickinder מושלמת לכל עסק שמבוסס על תורים, פגישות וקביעת זמנים
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <BusinessTypeCard 
            title="מספרות ועיצוב שיער"
            description="מערכת ניהול תורים למספרות – ניהול תספורות, צבעים וטיפולים. לקוחות קובעים תור למספרה אונליין ומקבלים תזכורת אוטומטית."
            icon={<Scissors className="w-12 h-12" />}
          />
          <BusinessTypeCard 
            title="קליניקות רפואיות"
            description="ניהול תורים לקליניקות ומרפאות – ניהול חולים, שירותים רפואיים וזמני קבלה. תוכנה לניהול תורים שמתאימה לרופאים ומטפלים."
            icon={<Stethoscope className="w-12 h-12" />}
          />
          <BusinessTypeCard 
            title="מכוני יופי וספא"
            description="אפליקציית תורים למכוני יופי – ניהול טיפולי פנים, מסאז׳, ציפורניים ועוד. לקוחות בוחרים שירות ומטפלת ומזמינים תור בקלות."
            icon={<Sparkles className="w-12 h-12" />}
          />
          <BusinessTypeCard 
            title="מרפאות שיניים"
            description="מערכת תורים למרפאות שיניים – ניהול טיפולים, רופאים וחדרי טיפול. תזכורות אוטומטיות שמפחיתות ביטולים ומשפרות ניצולת."
            icon={<Activity className="w-12 h-12" />}
          />
          <BusinessTypeCard 
            title="אולפני כושר ושיעורי קבוצה"
            description="מערכת תורים לאולפני כושר – ניהול אימונים אישיים, שיעורי קבוצה כמו פילאטיס ויוגה עם מגבלת משתתפים, רשימת המתנה וסליקת מקדמות."
            icon={<TrendingUp className="w-12 h-12" />}
          />
          <BusinessTypeCard 
            title="יעוץ משפטי ועסקי"
            description="ניהול תורים ליועצים – קביעת פגישות ייעוץ, ניהול לקוחות וזמני קבלה. מתאים ליועצי עסקים, עורכי דין ורואי חשבון."
            icon={<Scale className="w-12 h-12" />}
          />
          <BusinessTypeCard 
            title="בתי ספר לנהיגה"
            description="מערכת תורים לבתי ספר לנהיגה – ניהול שיעורי נהיגה, מורים ותלמידים. קביעת שיעור נהיגה אונליין עם ניהול משולב."
            icon={<Car className="w-12 h-12" />}
          />
          <BusinessTypeCard 
            title="ועוד עסקים רבים..."
            description="כל עסק שדורש ניהול תורים ופגישות – טיפולים אלטרנטיביים, סטודיו לצילום, שיעורים פרטיים ועוד."
            icon={<MoreHorizontal className="w-12 h-12" />}
          />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              איך מתחילים לנהל תורים עם קליקינדר?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              3 צעדים פשוטים להתחיל לנהל את התורים שלך עם מערכת ניהול תורים חכמה
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <StepCard
              number="1"
              title="הרשמה מהירה"
              description="צור חשבון חינם תוך פחות מדקה. ללא צורך בכרטיס אשראי. התחל עם 60 יום ניסיון חינם של מערכת ניהול התורים המתקדמת."
            />
            <StepCard
              number="2"
              title="הגדר את העסק"
              description="הוסף שירותים, עובדים וסניפים. הגדר סליקה ומקדמות, מדיניות ביטול, שיעורים קבוצתיים, תזכורות בוואטסאפ ורשימת המתנה."
            />
            <StepCard
              number="3"
              title="שתף והתחל לקבל תורים"
              description="שתף את קישור ההזמנה עם הלקוחות שלך ותתחיל לקבל תורים אונליין! הלקוחות קובעים בעצמם ואתה מנהל הכל ממקום אחד."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20 overflow-visible">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            מחירי מערכת ניהול התורים – פשוטים ושקופים
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            התחל עם 60 יום ניסיון חינם – ללא כרטיס אשראי!
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <PricingCard
            name="עסקים קטנים"
            price="₪99"
            period="לחודש"
            features={[
              "עד 3 עובדים",
              "סניף אחד",
              "עד 100 תורים בחודש",
              "התראות מתקדמות",
              "אינטגרציות יומן",
              "דוחות ואנליטיקה"
            ]}
            isFree={false}
          />
          <PricingCard
            name="עסקים"
            price="₪199"
            period="לחודש"
            features={[
              "עד 10 עובדים",
              "עד 5 סניפים",
              "עד 500 תורים בחודש",
              "כל התכונות של עסקים קטנים",
              "שיעורים קבוצתיים",
              "רשימת המתנה",
              "סליקת אשראי ומקדמות",
              "תורים חוזרים",
              "מדיניות ביטול",
              "תמיכה מועדפת"
            ]}
            isPopular={true}
          />
          <PricingCard
            name="אנלימיטד"
            price="₪499"
            period="לחודש"
            features={[
              "עובדים וסניפים ללא הגבלה",
              "תורים ללא הגבלה",
              "כל התכונות",
              "קופונים ומבצעים",
              "טפסי קבלה וחתימה דיגיטלית",
              "פורטל לקוחות",
              "ניהול משאבים",
              "תמיכה 24/7",
              "מנהל חשבון ייעודי",
              "API מותאם אישית",
              "White label"
            ]}
          />
        </div>

        {/* Enterprise CTA */}
        <div className="mt-12 max-w-5xl mx-auto">
          <div className="card bg-gradient-to-br from-primary-600 to-primary-700 text-white text-center p-8 md:p-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-right flex-1">
                <h3 className="text-3xl font-bold mb-3 text-white">צריכים יותר?</h3>
                <p className="text-white text-lg mb-6">
                  פתרון מותאם אישית לארגונים גדולים ורשתות עסקים – מעבר לחבילת אנלימיטד
                </p>
                <ul className="mt-4 space-y-3 text-base text-white">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                    <span>עובדים וסניפים ללא הגבלה</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                    <span>תמיכה 24/7 ומנהל חשבון ייעודי</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                    <span>התאמות מיוחדות והדרכה מלאה</span>
                  </li>
                </ul>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1 text-white">מחיר בהתאמה אישית</div>
                </div>
                <Link
                  href="/contact"
                  className="btn bg-white text-primary-600 hover:bg-gray-50 px-10 py-4 text-lg font-bold whitespace-nowrap shadow-xl"
                >
                  צור קשר למידע נוסף
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              מה אומרים עסקים שמשתמשים בקליקינדר
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <TestimonialCard
              name="דני כהן"
              business="מספרת 'סטייל'"
              text="Clickinder שינה לי את העסק! החסכתי שעות של טלפונים ותיאומים. הלקוחות מזמינים בעצמם והכל מסודר ומאורגן. מערכת ניהול תורים שממש עובדת."
              rating={5}
            />
            <TestimonialCard
              name="רונית לוי"
              business="קליניקה לפיזיותרפיה"
              text="המערכת קלה מאוד לשימוש והתמיכה מעולה. הלקוחות שלי אוהבים את האפשרות לקבוע תורים אונליין 24/7. התזכורות בוואטסאפ הפחיתו את הביטולים ב-80%."
              rating={5}
            />
            <TestimonialCard
              name="אמיר בן דוד"
              business="רשת מכוני כושר"
              text="מנהל 3 סניפים דרך מערכת התורים של קליקינדר בקלות. הדוחות עוזרים לי להבין את הביקושים ולתכנן נכון. הפתרון הכי טוב שמצאתי לניהול תורים."
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              שאלות נפוצות על מערכת ניהול תורים
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              כל מה שרציתם לדעת על קליקינדר ועל ניהול תורים דיגיטלי
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <FAQItem
                key={index}
                question={item.question}
                answer={item.answer}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl p-12 md:p-16 text-center text-white shadow-2xl">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            מוכנים להתחיל לנהל תורים בצורה חכמה?
          </h2>
          <p className="text-xl md:text-2xl mb-4 opacity-90">
            הצטרפו לעסקים רבים שכבר משתמשים במערכת ניהול התורים של קליקינדר
          </p>
          <p className="text-lg mb-10 opacity-80">
            60 יום ניסיון חינם - ללא כרטיס אשראי - ביטול בכל עת
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-white text-primary-600 px-10 py-5 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
          >
            התחל את התקופת הניסיון החינמית
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm opacity-90">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>ללא כרטיס אשראי</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>התקנה מיידית</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>תמיכה בעברית</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                צור קשר
              </h2>
              <p className="text-lg text-gray-600">
                יש לך שאלות על מערכת ניהול התורים? נשמח לעזור!
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <div className="card">
                <h3 className="text-2xl font-bold mb-6">שלח לנו הודעה</h3>
                <form className="space-y-4">
                  <div>
                    <label className="form-label">שם מלא</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="הכנס את שמך המלא"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">אימייל</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">טלפון</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="050-1234567"
                    />
                  </div>
                  <div>
                    <label className="form-label">הודעה</label>
                    <textarea
                      className="form-input"
                      rows={5}
                      placeholder="ספר לנו איך נוכל לעזור..."
                      required
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary w-full flex items-center justify-center gap-2">
                    <Send className="w-5 h-5" />
                    <span>שלח הודעה</span>
                  </button>
                </form>
              </div>

              <div className="space-y-6">
                <div className="card">
                  <h3 className="text-2xl font-bold mb-6">פרטי התקשרות</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary-100 text-primary-600 p-3 rounded-lg">
                        <Mail className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">אימייל</div>
                        <a href="mailto:Clickinder@gmail.com" className="text-primary-600 hover:underline">
                          Clickinder@gmail.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="bg-primary-100 text-primary-600 p-3 rounded-lg">
                        <Phone className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">טלפון</div>
                        <a href="tel:+972501234567" className="text-primary-600 hover:underline">
                          050-123-4567
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="bg-primary-100 text-primary-600 p-3 rounded-lg">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">כתובת</div>
                        <p className="text-gray-600">
                          רחוב ההי-טק 1<br />
                          תל אביב, ישראל
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card bg-primary-50 border-primary-200">
                  <h4 className="font-bold text-lg mb-3">שעות פעילות</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ראשון - חמישי</span>
                      <span className="font-semibold">9:00 - 18:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">שישי</span>
                      <span className="font-semibold">9:00 - 13:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">שבת</span>
                      <span className="font-semibold">סגור</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <img
                src="/assets/logo.png"
                alt="Clickinder - קליקינדר מערכת ניהול תורים לעסקים"
                className="h-8 mb-4 brightness-0 invert"
              />
              <p className="text-sm mb-4">
                קליקינדר – מערכת ניהול תורים מתקדמת לעסקים בישראל. אפליקציה ל-iPhone ול-Android עם פוש לבעלי עסק, קביעת תורים אונליין, שיעורים קבוצתיים, סליקת אשראי, רשימת המתנה, תורים חוזרים, תזכורות WhatsApp ללקוחות וניהול סניפים.
              </p>
              <div className="flex flex-col gap-2 mt-4">
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <img
                    src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/white/he-il?size=250x83&releaseDate=1316044800"
                    alt="הורד אפליקציית ניהול תורים קליקינדר מ-App Store"
                    className="h-10"
                  />
                </a>
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity inline-block"
                >
                  <img
                    src={GOOGLE_PLAY_BADGE_URL}
                    alt="הורד אפליקציית ניהול תורים קליקינדר מ-Google Play"
                    className="h-10 w-auto"
                  />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">המוצר</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">יכולות מערכת ניהול התורים</a></li>
                <li><a href="#native-apps-heading" className="hover:text-white transition-colors">אפליקציה ל-iPhone ול-Android</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">מחירים</a></li>
                <li><Link href="/auth/register" className="hover:text-white transition-colors">התחל חינם</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">דמו</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">החברה</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">אודות קליקינדר</a></li>
                <li><a href="#" className="hover:text-white transition-colors">בלוג</a></li>
                <li><a href="#" className="hover:text-white transition-colors">קריירה</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">צור קשר</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">משפטי</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">תנאי שימוש</a></li>
                <li><a href="#" className="hover:text-white transition-colors">מדיניות פרטיות</a></li>
                <li><a href="#" className="hover:text-white transition-colors">עוגיות</a></li>
                <li><a href="#" className="hover:text-white transition-colors">נגישות</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2026 Clickinder (קליקינדר). כל הזכויות שמורות. V.3.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="card hover:shadow-xl transition-all hover:-translate-y-1">
      <div className="text-primary-600 mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function BusinessTypeCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card text-center hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer">
      <div className="text-primary-600 mb-4 flex justify-center">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-full text-2xl font-bold mb-6 shadow-lg">
        {number}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  features,
  isPopular,
  isFree,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  isPopular?: boolean;
  isFree?: boolean;
}) {
  return (
    <div 
      className={`card relative ${isPopular ? 'ring-2 ring-primary-600 shadow-2xl transform scale-105' : ''}`}
      style={isPopular ? { overflow: 'unset' } : {}}
    >
      {isPopular && (
        <div className="absolute -top-4 right-1/2 translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-bold z-10">
          הכי פופולרי
        </div>
      )}
      
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">{name}</h3>
        <div className="flex items-end justify-center gap-1 mb-2">
          <span className="text-4xl font-bold text-primary-600">{price}</span>
          <span className="text-gray-600 mb-1">{period}</span>
        </div>
        {isFree && (
          <div className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
            60 יום חינם
          </div>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/auth/register"
        className={`btn w-full ${isPopular ? 'btn-primary' : 'btn-secondary'}`}
      >
        התחל עכשיו
      </Link>
    </div>
  );
}

function TestimonialCard({
  name,
  business,
  text,
  rating,
}: {
  name: string;
  business: string;
  text: string;
  rating: number;
}) {
  return (
    <div className="card bg-white">
      <div className="flex gap-1 mb-4">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-gray-700 mb-6 italic">&quot;{text}&quot;</p>
      <div>
        <div className="font-bold text-gray-900">{name}</div>
        <div className="text-sm text-gray-600">{business}</div>
      </div>
    </div>
  );
}

function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <details className="group bg-white rounded-xl border border-gray-200 overflow-hidden">
      <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
          <h3 className="text-lg font-semibold text-gray-900">{question}</h3>
        </div>
        <ChevronDown className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180 flex-shrink-0" />
      </summary>
      <div className="px-6 pb-6 pt-0 text-gray-700 leading-relaxed border-t border-gray-100">
        <p className="mt-4">{answer}</p>
      </div>
    </details>
  );
}
