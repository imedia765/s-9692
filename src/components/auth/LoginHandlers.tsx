import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getMemberByMemberId } from "@/utils/memberAuth";

export async function handleMemberIdLogin(memberId: string, password: string, navigate: ReturnType<typeof useNavigate>) {
  try {
    // First, look up the member
    const member = await getMemberByMemberId(memberId);
    
    if (!member) {
      throw new Error("Member ID not found");
    }
    
    // Use the email stored in the database
    const email = member.email;
    
    console.log("Attempting member ID login with:", { memberId, email });
    
    // For first time login, use member number as password
    const isFirstLogin = !member.password_changed;
    const loginPassword = isFirstLogin ? member.member_number : password;

    // Try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: loginPassword,
    });

    if (signInError) {
      console.error('Sign in error:', signInError);
      
      // If it's not first login or sign in failed with default password
      if (!isFirstLogin || signInError.message !== "Invalid login credentials") {
        throw new Error("Invalid member ID or password");
      }

      // If first login failed, try to create account
      console.log("First login, creating account with default password");
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: member.member_number,
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
        throw new Error("Failed to create account");
      }

      if (signUpData?.user) {
        // Update member record to link it with auth user
        const { error: updateError } = await supabase
          .from('members')
          .update({ 
            auth_user_id: signUpData.user.id,
            email_verified: true 
          })
          .eq('id', member.id)
          .single();

        if (updateError) {
          console.error('Error updating member:', updateError);
          throw new Error("Failed to link account");
        }

        navigate("/admin");
        return;
      }
    }

    if (signInData?.user) {
      // Update member record if needed
      if (!member.auth_user_id) {
        const { error: updateError } = await supabase
          .from('members')
          .update({ 
            auth_user_id: signInData.user.id,
            email_verified: true 
          })
          .eq('id', member.id)
          .single();

        if (updateError) {
          console.error('Error updating member:', updateError);
        }
      }

      navigate("/admin");
      return;
    }

    throw new Error("Login failed");
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}