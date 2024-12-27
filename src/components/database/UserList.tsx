import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserCheck, Shield } from "lucide-react";
import { useState } from "react";
import { RoleButton } from "./RoleButton";
import { CollectorDialog } from "./CollectorDialog";
import { UserRole, SingleRole } from "@/types/roles";

interface UserListProps {
  users: any[];
  onUpdate: () => void;
  updating: string | null;
  setUpdating: (id: string | null) => void;
}

export function UserList({ users, onUpdate, updating, setUpdating }: UserListProps) {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showCollectorDialog, setShowCollectorDialog] = useState(false);

  const updateUserRole = async (userId: string, roleToToggle: SingleRole, currentRole: UserRole | null) => {
    setUpdating(userId);
    try {
      console.log('Updating user role:', { userId, roleToToggle, currentRole });
      
      // Get user profile first
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Update the role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: roleToToggle,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      toast({
        title: "Role updated",
        description: `User role has been successfully updated to ${roleToToggle}.`,
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role. You might not have permission.",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleCollectorCreation = async (isNew: boolean, collectorName: string, collectorId: string) => {
    if (!selectedUserId) return;

    try {
      setUpdating(selectedUserId);
      
      // Get user profile first
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', selectedUserId)
        .single();

      if (profileError) throw profileError;

      if (isNew) {
        if (!collectorName.trim()) {
          toast({
            title: "Error",
            description: "Please enter a collector name",
            variant: "destructive",
          });
          return;
        }

        // Generate prefix from collector name
        const prefix = collectorName
          .split(/\s+/)
          .map(word => word.charAt(0).toUpperCase())
          .join('');

        // Get the next available number
        const { data: existingCollectors } = await supabase
          .from('collectors')
          .select('number')
          .ilike('prefix', prefix);

        const nextNumber = String(
          Math.max(0, ...existingCollectors?.map(c => parseInt(c.number)) || [0]) + 1
        ).padStart(2, '0');

        // Create new collector
        const { error: createError } = await supabase
          .from('collectors')
          .insert({
            name: collectorName,
            prefix,
            number: nextNumber,
            email: userProfile.email,
            active: true
          });

        if (createError) throw createError;
      }

      // Update user role to collector
      await updateUserRole(selectedUserId, 'collector', userProfile.role);

      setSelectedUserId(null);
      setShowCollectorDialog(false);
      
      toast({
        title: "Success",
        description: isNew 
          ? "New collector created and role updated" 
          : "User role updated to collector",
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error creating collector:', error);
      toast({
        title: "Error",
        description: "Failed to create collector",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleMakeCollector = (userId: string) => {
    setSelectedUserId(userId);
    setShowCollectorDialog(true);
  };

  const handleMakeAdmin = async (userId: string, currentRole: UserRole | null) => {
    await updateUserRole(userId, 'admin', currentRole);
  };

  return (
    <div className="space-y-4">
      {users.map((user) => {
        const isAdmin = user.role === 'admin';
        const isCollector = user.role === 'collector';

        return (
          <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <p className="font-medium">{user.member_number || 'No Member Number'}</p>
              <p className="text-sm text-muted-foreground">
                Email: {user.email}
              </p>
              <p className="text-sm text-muted-foreground">
                Role: {user.role || 'None'}
              </p>
              <p className="text-sm text-muted-foreground">
                Created: {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <RoleButton
                onClick={() => handleMakeCollector(user.id)}
                disabled={updating === user.id}
                isActive={isCollector}
                icon={UserCheck}
                label="Collector"
              />
              <RoleButton
                onClick={() => handleMakeAdmin(user.id, user.role)}
                disabled={updating === user.id}
                isActive={isAdmin}
                icon={Shield}
                label="Admin"
              />
            </div>
          </div>
        );
      })}

      <CollectorDialog
        isOpen={showCollectorDialog}
        onClose={() => setShowCollectorDialog(false)}
        onConfirm={handleCollectorCreation}
        isLoading={!!updating}
      />
    </div>
  );
}