import Footer from "@/components/shared/Footer";
import Header from "@/components/shared/Header";
import SignIn from "../(auth)/sign-up/page"; // 
export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <div className="flex h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    );
  }
