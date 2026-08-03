import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SnackbarProvider } from "@/components/Snackbar/SnackbarProvider";
import "@/styles/globals.scss";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sanne — Planning",
  description: "Design planning timeline",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body>
        <SnackbarProvider>{children}</SnackbarProvider>
      </body>
    </html>
  );
}
