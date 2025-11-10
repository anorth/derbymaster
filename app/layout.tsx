import type { Metadata } from "next";
import "./globals.css";
import { TournamentProvider } from "@/app/contexts/TournamentContext";

export const metadata: Metadata = {
  title: "Derby Master",
  description: "Pinewood Derby race management system",
};

export default function RootLayout({children}: Readonly<{ children: React.ReactNode }>) {
  return (
      <html lang="en">
        <body className={`antialiased`}>
          <TournamentProvider>
            {children}
          </TournamentProvider>
        </body>
      </html>
  );
}
