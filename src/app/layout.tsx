import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grok Cats",
  description: "A cozy pixel-art world where every cat is a Grok.",
};

const themeBoot = `(function(){try{var t=localStorage.getItem("grok-cats-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
        {children}
      </body>
    </html>
  );
}
