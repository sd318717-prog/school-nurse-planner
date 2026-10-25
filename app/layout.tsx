import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'המתכננת שלי | בריאות התלמיד',
  description: 'מערכת אישית לתכנון פעילויות, בתי ספר, יעדים ותזכורות',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="he" dir="rtl"><body>{children}</body></html>;
}
