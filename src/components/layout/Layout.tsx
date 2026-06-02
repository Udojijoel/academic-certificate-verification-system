import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { DemoModeBanner } from "./DemoModeBanner";
import { DEMO_MODE } from "@/lib/constants";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <DemoModeBanner />
      <main className={`flex-1 ${DEMO_MODE ? "pt-24 md:pt-28" : "pt-16 md:pt-20"}`}>{children}</main>
      <Footer />
    </div>
  );
};
