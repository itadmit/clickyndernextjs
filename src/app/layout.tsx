import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://clickynder.com'),
  title: {
    default: 'Clickinder | קליקינדר - מערכת ניהול תורים מתקדמת לעסקים בישראל',
    template: '%s | Clickinder - קליקינדר',
  },
  description:
    'קליקינדר (Clickinder) - מערכת ניהול תורים ואפליקציה רשמית ל-iPhone ול-Android. עדכוני פוש לבעלי עסק, קביעת תורים אונליין, תזכורות WhatsApp ללקוחות, יומן דיגיטלי. 30 יום ניסיון חינם.',
  keywords: [
    'מערכת ניהול תורים',
    'מערכת לניהול תורים',
    'אפליקציה לניהול תורים',
    'ניהול תורים',
    'קליקינדר',
    'Clickinder',
    'Clickynder',
    'תוכנה לניהול תורים',
    'קביעת תורים אונליין',
    'יומן תורים דיגיטלי',
    'מערכת תורים לעסקים',
    'זימון תורים',
    'תזכורות תורים וואטסאפ',
    'מערכת הזמנת תורים',
    'ניהול תורים למספרות',
    'ניהול תורים לקליניקות',
    'אפליקציית תורים לעסקים קטנים',
    'ניהול תורים חינם',
    'מערכת תורים אונליין',
    'שיעורים קבוצתיים',
    'ניהול שיעורי קבוצה',
    'רשימת המתנה',
    'תשלום מקדמה',
    'סליקת אשראי לתורים',
    'תורים חוזרים',
    'מדיניות ביטול',
    'קופונים והנחות',
    'אפליקציה לאייפון',
    'אפליקציה לאנדרואיד',
    'App Store',
    'Google Play',
    'עדכוני פוש',
    'התראות פוש לעסק',
  ],
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    url: 'https://clickynder.com',
    siteName: 'Clickinder - קליקינדר',
    title: 'Clickinder | קליקינדר - מערכת ניהול תורים מתקדמת לעסקים',
    description:
      'מערכת ניהול תורים לעסקים בישראל. אפליקציה ל-iOS ול-Android עם פוש לבעלי עסק, תזכורות WhatsApp ללקוחות, לוח שנה חכם וניהול סניפים. התחילו חינם!',
    images: [
      {
        url: '/assets/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Clickinder - קליקינדר מערכת ניהול תורים',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clickinder | קליקינדר - מערכת ניהול תורים לעסקים',
    description:
      'אפליקציה ל-iPhone ול-Android עם פוש לבעלי עסק. קביעת תורים אונליין ותזכורות WhatsApp ללקוחות. 30 יום חינם!',
    images: ['/assets/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: 'https://clickynder.com',
  },
  verification: {},
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@100;200;300;400;500;600;700;800;900&family=Assistant:wght@200;300;400;500;600;700;800&family=Heebo:wght@100;200;300;400;500;600;700;800;900&family=Rubik:wght@300;400;500;600;700;800;900&family=Varela+Round:wght@400&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
