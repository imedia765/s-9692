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
    
    try {
      // First get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("No active session found");
        setIsLoggedIn(false);
        navigate("/login");
        return;
      }

      // Attempt to sign out
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Logout error:", error);
        throw error;
      }

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
      // Always ensure we clean up and redirect
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