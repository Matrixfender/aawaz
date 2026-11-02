'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Mic,
  Settings,
  LogOut,
  Sparkles,
  Menu,
  X,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isDemo, signOut, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard' || pathname.startsWith('/dashboard/'),
    },
    {
      label: 'Studio',
      href: '/studio',
      icon: Sparkles,
      active: pathname === '/studio',
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      active: pathname === '/settings',
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const displayName = profile?.display_name || user?.fullName || 'User';
  const displayEmail = user?.email || 'user@aawaz.ai';

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Desktop Slim Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border/70 bg-card/60 backdrop-blur-md shrink-0 sticky top-0 h-screen z-30">
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-border/60">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Mic className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-foreground">
                Aawaz
              </span>
              <span className="text-[10px] text-muted-foreground -mt-1 font-mono">
                आवाज़
              </span>
            </div>
          </Link>
          <ThemeToggle />
        </div>

        {/* Demo Mode Notice */}
        {isDemo && (
          <div className="mx-4 mt-3 p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-medium text-foreground">Demo Mode</span>
            <span className="text-[10px] text-muted-foreground ml-auto">Local</span>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                  item.active
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
                {item.href === '/studio' && (
                  <Badge variant="orange" className="ml-auto text-[10px] py-0 px-1.5">
                    New
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-border/60 mt-auto">
          <div className="p-2 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={displayName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  {displayName}
                </p>
                <p className="text-[10px] text-muted-foreground truncate font-mono">
                  {displayEmail}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navbar */}
      <header className="md:hidden sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border/70 h-14 flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Mic className="h-3.5 w-3.5" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-foreground">
            Aawaz
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="h-8 w-8"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* Mobile Slide-down Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 bg-card border-b border-border p-4 z-40 space-y-2 shadow-xl animate-in slide-in-from-top-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  item.active
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar name={displayName} size="sm" />
              <span className="text-xs font-medium text-foreground">{displayName}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="text-xs text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              Log out
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Demo Banner */}
        {isDemo && (
          <div className="bg-primary/10 border-b border-primary/20 px-4 py-1.5 text-center text-xs text-foreground/80 flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span>Running in demo mode with local storage.</span>
            <span className="text-muted-foreground hidden sm:inline">
              Configure Supabase env vars to enable multi-device sync.
            </span>
          </div>
        )}

        <main className="flex-1">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur-md border-t border-border/80 h-14 flex items-center justify-around px-2 z-30">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors',
                item.active
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
