import { headerLinks } from '@/constants';
import Link from 'next/link';
import { usePathname } from 'next/navigation';


// Define the type for your link objects (if not already in constants.ts)
type NavLink = {
  label: string;
  route: string;
};


function NavItems() {
  const pathname = usePathname();
  
  return (
    <ul className="flex items-center gap-5">
      {headerLinks.map((link: NavLink) => {
        const isActive = pathname === link.route;
        return (
          <li key={link.route}>
            <Link
              href={link.route}
              className={
                isActive 
                  ? "text-blue-500 font-medium" 
                  : "text-gray-600 hover:text-blue-400 transition-colors"
              }
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}


export default NavItems;
