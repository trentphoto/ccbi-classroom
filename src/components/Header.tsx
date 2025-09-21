'use client';

import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MoreVertical, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { CURRENT_BRAND } from '@/lib/brand';

interface HeaderProps {
  subtitle?: string;
  className?: string;
}

export default function Header({ subtitle, className = "" }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  return (
    <header className={`bg-brand-gradient shadow-lg flex-shrink-0 ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title Section */}
          <div className="flex items-center space-x-4">
            <div className="bg-white rounded-full aspect-square w-24 h-24 flex items-center justify-center p-2">
              <Image
                src={CURRENT_BRAND.logoUrl}
                alt={`${CURRENT_BRAND.name} Logo`}
                width={80}
                height={80}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {CURRENT_BRAND.name}
              </h1>
              {subtitle && (
                <p className="text-sm text-brand-accent">{subtitle}</p>
              )}
            </div>
          </div>

          {/* User Menu */}
          {user && (
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="h-auto p-2 text-white hover:bg-white/10 data-[state=open]:bg-white/10"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src="" alt={user.name} />
                      <AvatarFallback className="rounded-lg bg-white/20 text-white">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight ml-3">
                      <span className="truncate font-medium text-white">{user.name}</span>
                      <span className="text-[#d2ac47] truncate text-xs">
                        {user.email}
                      </span>
                    </div>
                    <MoreVertical className="ml-auto h-4 w-4 text-white" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => {}}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {}}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
