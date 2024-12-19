import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AuthContextType {
  isLoggedIn: boolean;
  logout: () => Promise<void>;
  checkSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Session check failed:", error);
        setIsLoggedIn(false);
        return false;
      }
      
      const isValid = !!session;
      console.log("Session check:", { isValid, session });
      setIsLoggedIn(isValid);
      return isValid;
    } catch (error) {
      console.error("Session check failed:", error);
      setIsLoggedIn(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Clear local state first to prevent UI flashing
      setIsLoggedIn(false);
      
      // Attempt to sign out without checking session first
      const { error } = await supabase.auth.signOut({
        scope: 'local'  // Only clear the local session first
      });
      
      if (error) {
        console.error("Local logout failed:", error);
      }

      // Then try to clear all sessions globally
      try {
        await supabase.auth.signOut({
          scope: 'global'
        });
      } catch (globalError) {
        console.error("Global logout failed:", globalError);
        // Don't throw here, we already cleared local session
      }

      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Notice",
        description: "Session ended locally",
      });
    } finally {
      // Always navigate to login page and ensure local state is cleared
      setIsLoggedIn(false);
      navigate("/login");
    }
  };

  useEffect(() => {
    // Initial session check
    checkSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, !!session);
      
      switch (event) {
        case "SIGNED_IN":
          if (session) {
            setIsLoggedIn(true);
            toast({
              title: "Welcome back!",
              description: "Signed in successfully",
            });
            navigate('/admin');
          }
          break;
          
        case "SIGNED_OUT":
          setIsLoggedIn(false);
          navigate('/login');
          break;
          
        case "TOKEN_REFRESHED":
          console.log("Token refreshed");
          if (session) setIsLoggedIn(true);
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}