import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="w-full bg-gradient-to-t from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
        {/* Brand Section */}
        <div className="flex flex-col items-center md:items-start gap-4">
          <Link href="/">
            <Image 
              src="/assets/images/logo.png"
              alt="logo"
              width={128}
              height={38}
            />
          </Link>
          <p className="text-gray-300 text-sm">Event Sphere: Connecting you to the best events worldwide.</p>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col items-center md:items-start gap-4">
          <h3 className="text-lg font-semibold">Quick Links</h3>
          <ul className="flex flex-col gap-2">
            <li>
              <Link href="/" className="text-gray-300 hover:text-cyan-400 transition-colors text-sm">
                Home
              </Link>
            </li>
            <li>
              <Link href="/events/create" className="text-gray-300 hover:text-cyan-400 transition-colors text-sm">
                Create Event
              </Link>
            </li>
            <li>
              <Link href="/profile" className="text-gray-300 hover:text-cyan-400 transition-colors text-sm">
                Profile
              </Link>
            </li>
          </ul>
        </div>

        {/* Social Media & Copyright */}
        <div className="flex flex-col items-center md:items-start gap-4">
          <h3 className="text-lg font-semibold">Follow Us</h3>
          <div className="flex gap-4">
            <Button variant="ghost" size="icon" asChild className="text-gray-300 hover:text-cyan-400 hover:bg-gray-700 transition-colors">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733a4.67 4.67 0 002.048-2.578 9.3 9.3 0 01-2.958 1.13 4.66 4.66 0 00-7.938 4.25 13.229 13.229 0 01-9.602-4.868 4.66 4.66 0 001.442 6.22 4.647 4.647 0 01-2.11-.583v.06a4.66 4.66 0 003.737 4.568 4.692 4.692 0 01-2.104.08 4.661 4.661 0 004.352 3.234 9.348 9.348 0 01-5.776 1.995c-.375 0-.745-.022-1.112-.067a13.19 13.19 0 007.14 2.093c8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.4-.014-.598a9.465 9.465 0 002.315-2.415z" />
                </svg>
              </a>
            </Button>
            <Button variant="ghost" size="icon" asChild className="text-gray-300 hover:text-cyan-400 hover:bg-gray-700 transition-colors">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
            </Button>
            <Button variant="ghost" size="icon" asChild className="text-gray-300 hover:text-cyan-400 hover:bg-gray-700 transition-colors">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.326 3.608 1.301.975.975 1.24 2.242 1.302 3.608.058 1.265.069 1.645.069 4.849s-.012 3.584-.07 4.85c-.062 1.366-.326 2.633-1.301 3.608-.975.975-2.242 1.24-3.608 1.302-1.265.058-1.645.069-4.849.069s-3.584-.012-4.85-.07c-1.366-.062-2.633-.326-3.608-1.301-.975-.975-1.24-2.242-1.302-3.608-.058-1.265-.069-1.645-.069-4.849s.012-3.584.07-4.85c.062-1.366.326-2.633 1.301-3.608.975-.975 2.242-1.24 3.608-1.302 1.265-.058 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-1.44.065-2.866.402-3.928 1.464-1.062 1.062-1.399 2.488-1.464 3.928-.058 1.28-.072 1.689-.072 4.947s.014 3.667.072 4.947c.065 1.44.402 2.866 1.464 3.928 1.062 1.062 2.488 1.399 3.928 1.464 1.28.058 1.689.072 4.947.072s3.667-.014 4.947-.072c1.44-.065 2.866-.402 3.928-1.464 1.062-1.062 1.399-2.488 1.464-3.928.058-1.28.072-1.689.072-4.947s-.014-3.667-.072-4.947c-.065-1.44-.402-2.866-1.464-3.928-1.062-1.062-2.488-1.399-3.928-1.464-1.28-.058-1.689-.072-4.947-.072zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z" />
                </svg>
              </a>
            </Button>
          </div>
          <p className="text-gray-400 text-sm mt-4">2025 Event Sphere. All Rights Reserved. By Mohamed-Amin Abdillahi</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;