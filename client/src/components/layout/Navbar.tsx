import { useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { 
  ShoppingCart, 
  Menu, 
  User,
  ChevronDown,
  LogOut,
  LogIn,
  Home,
  Trophy,
  Gift,
  Info,
  HelpCircle,
  List,
  Settings,
  ImageIcon
} from "lucide-react";

const NavLink = ({ to, label }: { to: string; label: string }) => {
  const [isActive] = useRoute(to);
  return (
    <Link href={to}>
      <a
        className={`font-medium py-2 border-b-2 ${
          isActive 
            ? "border-secondary text-white" 
            : "border-transparent hover:border-secondary text-white/80 hover:text-white"
        } transition`}
      >
        {label}
      </a>
    </Link>
  );
};

const MobileNavLink = ({ to, label, icon: Icon, onClick }: { 
  to: string; 
  label: string; 
  icon: React.ElementType;
  onClick?: () => void;
}) => {
  const [isActive] = useRoute(to);
  return (
    <SheetClose asChild>
      <Link href={to}>
        <a
          className={`flex items-center gap-3 px-4 py-3 ${
            isActive 
              ? "bg-primary/10 text-primary" 
              : "hover:bg-gray-100"
          } rounded-md`}
          onClick={onClick}
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </a>
      </Link>
    </SheetClose>
  );
};

export default function Navbar() {
  const [, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { totalItems } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/");
  };

  return (
    <header className="bg-primary text-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/">
            <a className="flex items-center">
              <div className="text-2xl font-bold text-white">
                <span className="text-secondary">MOBY</span>
                <span className="text-white text-xl">COMPS</span>
              </div>
            </a>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex space-x-6">
            <NavLink to="/" label="Home" />
            <NavLink to="/competitions" label="Competitions" />
            <NavLink to="/how-to-play" label="How to Play" />
            <NavLink to="/about" label="About Us" />
            <NavLink to="/faqs" label="FAQs" />
            {user && (
              <>
                <NavLink to="/my-entries" label="My Entries" />
                <NavLink to="/my-wins" label="My Wins" />
              </>
            )}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            <Link href="/cart">
              <a className="relative text-white p-2">
                <ShoppingCart className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-secondary text-primary text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </a>
            </Link>

            {user ? (
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{user.role === 'admin' ? "Admin User" : user.username}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/my-entries">My Entries</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/my-wins">My Wins</Link>
                    </DropdownMenuItem>
                    
                    {user.role === 'admin' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin">Admin Dashboard</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/competitions">Manage Competitions</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/users">Manage Users</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/config">Site Configuration</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/site-content">Site Content</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button variant="secondary" className="hidden md:flex items-center gap-2" asChild>
                <Link href="/auth">
                  <LogIn className="h-4 w-4" />
                  <span>Log in</span>
                </Link>
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="py-4">
                  <div className="text-2xl font-bold mb-6">
                    <span className="text-secondary">MOBY</span>
                    <span className="text-primary">COMPS</span>
                  </div>
                  
                  <div className="space-y-1">
                    <MobileNavLink to="/" label="Home" icon={Home} />
                    <MobileNavLink to="/competitions" label="Competitions" icon={Gift} />
                    <MobileNavLink to="/how-to-play" label="How to Play" icon={HelpCircle} />
                    <MobileNavLink to="/about" label="About Us" icon={Info} />
                    <MobileNavLink to="/faqs" label="FAQs" icon={List} />
                    {user && (
                      <>
                        <MobileNavLink to="/my-entries" label="My Entries" icon={Gift} />
                        <MobileNavLink to="/my-wins" label="My Wins" icon={Trophy} />
                      </>
                    )}
                    
                    {user && user.role === 'admin' && (
                      <>
                        <div className="pt-4 mt-4 border-t border-gray-200">
                          <h3 className="px-4 mb-2 text-sm font-medium text-gray-500">Admin</h3>
                          <MobileNavLink to="/admin" label="Dashboard" icon={Home} />
                          <MobileNavLink to="/admin/competitions" label="Competitions" icon={Gift} />
                          <MobileNavLink to="/admin/users" label="Users" icon={User} />
                          <MobileNavLink to="/admin/config" label="Configuration" icon={Settings} />
                          <MobileNavLink to="/admin/site-content" label="Site Content" icon={Image} />
                        </div>
                      </>
                    )}

                    <div className="pt-4 mt-4 border-t border-gray-200">
                      {user ? (
                        <button
                          className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-gray-100 rounded-md"
                          onClick={() => {
                            setIsMenuOpen(false);
                            handleLogout();
                          }}
                        >
                          <LogOut className="h-5 w-5" />
                          <span>Log out</span>
                        </button>
                      ) : (
                        <MobileNavLink to="/auth" label="Log in" icon={LogIn} />
                      )}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
