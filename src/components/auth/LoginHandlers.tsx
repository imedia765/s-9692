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
    
    // For first time login, always use member number as password
    if (!member.password_changed) {
      console.log("First time login detected, using member number as password");
      
      // Try to sign in first with member number as password
      let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: member.member_number
      });

      if (signInError) {
        console.log('Initial sign in failed, attempting signup:', signInError);
        
        // Only attempt signup if user doesn't exist
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

        // If signup succeeded, try signing in again
        const { data: finalSignInData, error: finalSignInError } = await supabase.auth.signInWithPassword({
          email,
          password: member.member_number
        });

        if (finalSignInError) {
          console.error('Final sign in error:', finalSignInError);
          throw new Error("Failed to sign in after account creation");
        }

        signInData = finalSignInData;
      }

      if (signInData?.user) {
        // Update member record to link it with auth user
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
          throw new Error("Failed to link account");
        }

        navigate("/admin");
        return;
      }
    } else {
      // Regular login with provided password
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        throw new Error("Invalid member ID or password");
      }

      if (signInData?.user) {
        navigate("/admin");
        return;
      }
    }

    throw new Error("Login failed");
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}