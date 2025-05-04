import { headerLinks } from '@/constants';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";

function NavItems({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();

  // Filter out the "Events" link
  const filteredLinks = headerLinks.filter(link => link.label !== 'Events');

  return (
    <ul className={isMobile ? "flex flex-col gap-4" : "flex items-center gap-2 md:gap-4"}>
      {filteredLinks.map((link) => {
        const isActive = pathname === link.route;
        return (
          <li key={link.route}>
            <Button
              variant="ghost"
              asChild
              className={
                isActive 
                  ? `${isMobile ? "text-cyan-500 font-semibold" : "text-white font-semibold border-b-2 border-white pb-1 hover:bg-cyan-600/20"}`
                  : `${isMobile ? "text-gray-800 hover:text-cyan-500" : "text-gray-200 hover:text-white hover:bg-cyan-600/20 transition-colors"}`
              }
            >
              <Link href={link.route} className={isMobile ? "text-lg font-medium" : ""}>
                {link.label}
              </Link>
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

export default NavItems;