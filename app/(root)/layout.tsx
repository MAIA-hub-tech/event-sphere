import Footer from "@/components/shared/Footer";
import Header from "@/components/shared/Header";

// Add these exports for dynamic route support
export const dynamicParams = true; // Allow dynamic routes not defined in generateStaticParams
export const dynamic = 'force-dynamic'; // Ensure client-side dynamic behavior

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Added key to force re-render on route change */}
        <div key={Math.random()}>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
