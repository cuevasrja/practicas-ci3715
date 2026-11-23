import type { Metadata } from "next";
import { Caladea, Carlito, Geist_Mono } from "next/font/google";
import "./globals.css";

// Equivalentes libres de Calibri y Cambria, las tipografías de las láminas.
const carlito = Carlito({
  variable: "--font-carlito",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const caladea = Caladea({
  variable: "--font-caladea",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CI-3715 · Ingeniería de Software",
    template: "%s · CI-3715",
  },
  description:
    "Las clases de CI-3715 Ingeniería de Software explicadas paso a paso con diagramas animados.",
};

// Aplica el tema guardado antes del primer pintado para evitar el parpadeo.
const themeScript = `(function(){try{var t=localStorage.getItem("sa:tema");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${carlito.variable} ${caladea.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: script fijo, sin datos externos; debe ejecutarse antes del primer pintado */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
