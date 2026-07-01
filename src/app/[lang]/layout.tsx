import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import NavHeader from "@/components/NavHeader";
import { getDictionary } from "@/i18n/get-dictionary";
import { I18nProvider } from "@/i18n/I18nContext";
import { getAllSubjects, getAllLessonsWithFallback } from "@/lib/content/catalog";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solvio",
  description: "Learn mathematics through step-by-step transformations",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "th" }];
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  
  const subjects = getAllSubjects(lang).map(s => ({ id: s.id, title: s.title }));
  const lessons = getAllLessonsWithFallback(lang).map(l => ({ id: l.id, subject: l.subject, title: l.title }));

  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider locale={lang} messages={dict}>
          <NavHeader subjects={subjects} lessons={lessons} />
          <main className="flex-1">
            {children}
          </main>
        </I18nProvider>
      </body>
    </html>
  );
}

