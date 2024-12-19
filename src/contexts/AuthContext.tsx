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
    console.log("Starting logout process...");
    
    // Immediately clear local state
    setIsLoggedIn(false);
    
    try {
      // First try local logout
      console.log("Attempting local logout...");
      try {
        const { error: localError } = await supabase.auth.signOut({ scope: 'local' });
        if (localError) {
          console.warn("Local logout error:", localError);
        }
      } catch (localError) {
        console.warn("Local logout failed:", localError);
      }

      // Then try global logout
      console.log("Attempting global logout...");
      try {
        const { error: globalError } = await supabase.auth.signOut({ scope: 'global' });
        if (globalError) {
          console.warn("Global logout error:", globalError);
        }
      } catch (globalError) {
        console.warn("Global logout failed:", globalError);
      }

      // Clear any remaining session data
      await supabase.auth.clearSession();
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      console.error("Logout process error:", error);
      toast({
        title: "Notice",
        description: "Session ended",
      });
    } finally {
      // Always ensure we navigate to login and clear local state
      console.log("Finalizing logout...");
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