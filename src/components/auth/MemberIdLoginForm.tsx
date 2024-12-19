import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface MemberIdLoginFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading?: boolean;
}

export const MemberIdLoginForm = ({ onSubmit, isLoading }: MemberIdLoginFormProps) => {
  const [memberId, setMemberId] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanMemberId = memberId.toUpperCase().trim();
    console.log("Login attempt with:", {
      memberId: cleanMemberId,
      passwordLength: password.length
    });
    await onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert className="bg-blue-50 border-blue-200">
        <InfoIcon className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-sm text-blue-700">
          If you're a new member, use your Member ID (e.g. TM20001) as both your username and password.
          You'll be prompted to update your email and password after logging in.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Input
          id="memberId"
          name="memberId"
          type="text"
          placeholder="Member ID (e.g. TM20001)"
          value={memberId}
          onChange={(e) => setMemberId(e.target.value.toUpperCase().trim())}
          required
          disabled={isLoading}
          className="uppercase"
        />
      </div>
      <div className="space-y-2">
        <Input
          id="memberPassword"
          name="memberPassword"
          type="password"
          placeholder="Password (same as Member ID)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login with Member ID"}
      </Button>
    </form>
  );
};