import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PasswordChangeForm } from "@/components/auth/PasswordChangeForm";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Check authentication and get user email
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      console.log("Session found:", session);
      setUserEmail(session.user.email);
    };

    checkAuth();
  }, [navigate]);

  // Fetch member profile data
  const { data: memberData, isLoading: memberLoading } = useQuery({
    queryKey: ['member-profile', userEmail],
    enabled: !!userEmail,
    queryFn: async () => {
      console.log('Fetching profile for email:', userEmail);
      
      const { data, error } = await supabase
        .from('members')
        .select('*, family_members(*)')
        .eq('email', userEmail)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error fetching profile",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      console.log('Found profile:', data);
      return data;
    },
  });

  if (memberLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto p-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-6">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
        Member Profile
      </h1>

      <div className="space-y-6">
        <PasswordChangeForm />
      </div>
    </div>
  );
}