import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getMemberByMemberId } from "@/utils/memberAuth";

export async function handleMemberIdLogin(memberId: string, password: string, navigate: ReturnType<typeof useNavigate>) {
  // First, look up the member
  const member = await getMemberByMemberId(memberId);
  
  if (!member) {
    throw new Error("Member ID not found");
  }
  
  // Use the email stored in the database
  const email = member.email || `${member.member_number.toLowerCase()}@temp.pwaburton.org`;
  
  console.log("Attempting member ID login with:", { memberId, email });
  
  try {
    // Try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('Sign in error:', signInError);
      
      // If it's the first login attempt, try with default password
      if (signInError.message.includes("Invalid login credentials") && !member.password_changed) {
        console.log("First login attempt, trying with default password");
        const { data: defaultSignInData, error: defaultSignInError } = await supabase.auth.signInWithPassword({
          email,
          password: member.member_number, // Use member number as default password
        });

        if (!defaultSignInError && defaultSignInData?.user) {
          navigate("/admin");
          return;
        }
      }
      
      throw new Error("Invalid member ID or password");
    }

    if (signInData?.user) {
      navigate("/admin");
      return;
    }

    // If sign in fails, create account with provided password
    console.log("Sign in failed, attempting to create account");
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: member.member_number, // Use member number as initial password
      options: {
        data: {
          member_id: member.id,
          member_number: member.member_number,
          full_name: member.full_name
        }
      }
    });

    if (signUpError) {
      console.error('Sign up error:', signUpError);
      throw signUpError;
    }

    if (signUpData?.user) {
      navigate("/admin");
    }
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}