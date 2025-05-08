import React from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Helmet } from "react-helmet";

interface LayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Layout({ title, description, children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>{title} | Moby Comps</title>
        {description && <meta name="description" content={description} />}
      </Helmet>
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}