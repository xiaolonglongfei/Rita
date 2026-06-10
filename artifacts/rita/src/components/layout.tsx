import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout, useListNotifications, useMarkAllNotificationsRead, getListNotificationsQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { Bell, User, LogOut, ShieldAlert, Trophy, Users, Calendar, Activity } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function Navbar() {
  const { data: user } = useGetMe({ query: { retry: false, queryKey: getGetMeQueryKey() } });
  const logout = useLogout();
  const [location] = useLocation();
  const queryClient = useQueryClient();

  const { data: notifications } = useListNotifications({ query: { enabled: !!user, queryKey: getListNotificationsQueryKey() } });
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications?.filter(n => !n.read).length || 0;
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      }
    });
  };

  const navLinks = [
    { href: "/instructors", label: "Instructors", icon: <Users size={16} /> },
    { href: "/rankings", label: "Rankings", icon: <Trophy size={16} /> },
  ];

  if (user) {
    navLinks.push({ href: "/sessions", label: "My Sessions", icon: <Calendar size={16} /> });
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 mx-auto max-w-7xl justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <Activity className="text-accent" size={24} />
            <span className="font-black text-2xl tracking-tighter text-primary">RITA</span>
          </Link>
          <div className="hidden md:flex gap-1">
            {navLinks.map(link => {
              const isActive = location.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
            {user?.isAdmin && (
              <Link href="/admin" className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-colors ${location.startsWith('/admin') ? 'bg-destructive/10 text-destructive' : 'text-destructive/70 hover:bg-destructive/10 hover:text-destructive'}`}>
                <ShieldAlert size={16} />
                Admin
              </Link>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="relative">
                <button 
                  onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full relative transition-colors"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-background"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-card border shadow-xl rounded-lg overflow-hidden z-50">
                    <div className="p-4 border-b flex justify-between items-center bg-muted/30">
                      <h3 className="font-bold text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-xs text-accent font-bold hover:underline">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications?.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">No notifications.</div>
                      ) : (
                        notifications?.map(notif => (
                          <div key={notif.id} className={`p-4 border-b last:border-0 ${!notif.read ? 'bg-primary/5' : ''}`}>
                            <div className="text-sm">{notif.message}</div>
                            <div className="text-xs text-muted-foreground mt-1">{new Date(notif.createdAt).toLocaleDateString()}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button 
                  onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                  className="flex items-center gap-2 pl-2 pr-4 py-1.5 border rounded-full hover:bg-muted transition-colors"
                >
                  <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold">{user.name}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border shadow-xl rounded-lg overflow-hidden z-50">
                    <div className="p-4 border-b bg-muted/30">
                      <div className="font-bold truncate">{user.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                    </div>
                    <div className="p-2">
                      <Link href="/profile" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded hover:bg-muted font-medium">
                        <User size={16} />
                        Profile Settings
                      </Link>
                      <button 
                        onClick={() => logout.mutate(undefined, { onSuccess: () => window.location.href = "/" })}
                        className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded hover:bg-destructive/10 text-destructive font-medium mt-1"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 text-sm font-bold">
              <Link href="/login" className="text-muted-foreground hover:text-foreground">Login</Link>
              <Link href="/signup" className="bg-primary text-primary-foreground px-5 py-2.5 rounded hover:bg-primary/90 transition-colors">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background font-sans">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
