import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState, useEffect } from "react";
import { supabase } from "../integrations/supabase/client";
import { useToast } from "./ui/use-toast";

export function NavigationMenu() {
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Initialize session state
    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Session initialization error:", error);
          return;
        }
        setIsLoggedIn(!!session);
        
        // If we're on the login page but have a session, redirect to admin
        if (session && window.location.pathname === '/login') {
          navigate('/admin');
        }
      } catch (error) {
        console.error("Session initialization failed:", error);
      }
    };

    initializeSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, !!session);
      
      switch (event) {
        case "SIGNED_IN":
          if (session) {
            setIsLoggedIn(true);
            toast({
              title: "Signed in successfully",
              description: "Welcome back!",
            });
            navigate('/admin');
          }
          break;
          
        case "SIGNED_OUT":
          setIsLoggedIn(false);
          navigate('/login');
          break;
          
        case "TOKEN_REFRESHED":
          console.log("Token refreshed successfully");
          if (session) {
            setIsLoggedIn(true);
          }
          break;
          
        case "USER_UPDATED":
          console.log("User data updated");
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  const handleLogout = async () => {
    try {
      // Get current session first
      const { data: { session } } = await supabase.auth.getSession();
      
      // Clear local state
      setIsLoggedIn(false);
      
      if (!session) {
        console.log("No active session found");
        navigate('/login');
        return;
      }

      // Attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Logout error:", error);
        toast({
          title: "Logout error",
          description: "An error occurred during logout, but you've been signed out locally.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Logged out successfully",
          description: "Come back soon!",
        });
      }

      // Always navigate to login page
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Ensure user is logged out locally even if remote logout fails
      setIsLoggedIn(false);
      toast({
        title: "Session ended",
        description: "You have been logged out.",
      });
      navigate('/login');
    }
  };

  const handleNavigation = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            PWA Burton
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-2">
          {isLoggedIn ? (
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
          )}
          <Link to="/register">
            <Button variant="default" size="sm">
              Register
            </Button>
          </Link>
          {isLoggedIn && (
            <Link to="/admin">
              <Button variant="outline" size="sm">
                Admin Panel
              </Button>
            </Link>
          )}
          <ThemeToggle />
        </div>

        {/* Mobile Navigation */}
        <div className="flex items-center space-x-2 md:hidden">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80%] sm:w-[385px] p-0">
              <div className="flex flex-col gap-4 p-6">
                <div className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4">
                  Menu
                </div>
                {isLoggedIn ? (
                  <Button
                    variant="outline"
                    className="justify-start bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="justify-start bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    onClick={() => handleNavigation("/login")}
                  >
                    Login
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="justify-start bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                  onClick={() => handleNavigation("/register")}
                >
                  Register
                </Button>
                {isLoggedIn && (
                  <Button
                    variant="outline"
                    className="justify-start bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                    onClick={() => handleNavigation("/admin")}
                  >
                    Admin Panel
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}