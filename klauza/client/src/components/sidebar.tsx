import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  FileText,
  Users,
  Receipt,
  Shield,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/templates", label: "Contracts", icon: FileText },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/chase", label: "Chase", icon: Shield },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = (user as any)?.role === "admin";

  const allNavItems = [
    ...navItems,
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }] : []),
  ];

  const NavLink = ({ item, forceLabel }: { item: typeof allNavItems[0]; forceLabel?: boolean }) => {
    const isActive = location === item.href;
    return (
      <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors cursor-pointer",
            isActive
              ? "bg-sidebar-accent text-white"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white/80"
          )}
          data-testid={`nav-${item.label.toLowerCase()}`}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {(forceLabel || !collapsed) && <span>{item.label}</span>}
        </div>
      </Link>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ─── MOBILE TOP BAR ─── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 bg-sidebar border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/klauza-logo.png" alt="Klauza" className="w-7 h-7 object-contain" />
          <span className="font-display text-sm tracking-[0.25em] text-sidebar-foreground/90">KLAUZA</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(prev => !prev)}
          className="flex items-center justify-center w-9 h-9 rounded-md text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* ─── MOBILE OVERLAY DRAWER ─── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setMobileOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" />
          {/* Drawer */}
          <div
            className="absolute top-14 left-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
              {allNavItems.map(item => (
                <NavLink key={item.href} item={item} forceLabel />
              ))}
            </nav>
            <div className="p-3 border-t border-sidebar-border">
              {user && (
                <div className="mb-3 px-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-sidebar-foreground/70 truncate flex-1">{user.fullName || user.username}</p>
                    <Badge
                      variant={(user as any).plan === 'pro' || (user as any).plan === 'enterprise' ? 'default' : 'secondary'}
                      className="text-[10px] shrink-0"
                    >
                      {((user as any).plan || 'free').toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-sidebar-foreground/40 truncate">{user.username}</p>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent/50"
                onClick={() => { logout.mutate(); setMobileOpen(false); }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200 shrink-0",
          collapsed ? "w-16" : "w-60"
        )}
        data-testid="app-sidebar"
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border">
          {!collapsed ? (
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <img src="/klauza-logo.png" alt="Klauza" className="w-7 h-7 object-contain" />
              <span className="font-display text-sm tracking-[0.25em] text-sidebar-foreground/90">KLAUZA</span>
            </Link>
          ) : (
            <Link href="/dashboard" className="mx-auto">
              <img src="/klauza-logo.png" alt="Klauza" className="w-8 h-8 object-contain" />
            </Link>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {allNavItems.map(item => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* User & Logout */}
        <div className="p-3 border-t border-sidebar-border">
          {!collapsed && user && (
            <div className="mb-2 px-2">
              <div className="flex items-center gap-2">
                <p className="text-xs text-sidebar-foreground/70 truncate flex-1">{user.fullName || user.username}</p>
                <Badge
                  variant={(user as any).plan === 'pro' || (user as any).plan === 'enterprise' ? 'default' : 'secondary'}
                  className="text-[10px] shrink-0"
                >
                  {((user as any).plan || 'free').toUpperCase()}
                </Badge>
              </div>
              <p className="text-[10px] text-sidebar-foreground/40 truncate">{user.username}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent/50"
            onClick={() => logout.mutate()}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {!collapsed && "Sign Out"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/40 hover:text-white hover:bg-sidebar-accent/50 mt-1"
            onClick={() => setCollapsed(!collapsed)}
            data-testid="button-collapse-sidebar"
          >
            {collapsed
              ? <ChevronRight className="h-4 w-4" />
              : <><ChevronLeft className="h-4 w-4 mr-2" /><span>Collapse</span></>
            }
          </Button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 overflow-auto bg-background md:pt-0 pt-14">
        {children}
      </main>
    </div>
  );
}
