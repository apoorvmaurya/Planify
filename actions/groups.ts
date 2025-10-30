'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createGroup(formData: { name: string; description?: string }) {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, error: 'User not authenticated' };
  }

  // Create the group
  const { data: newGroup, error: groupError } = await supabase
    .from('groups')
    .insert({
      name: formData.name,
      description: formData.description || null,
      owner_id: user.id,
    })
    .select()
    .single();

  if (groupError) {
    console.error('Error creating group:', groupError);
    return { success: false, error: groupError.message };
  }

  // Add the creator as a member
  const { error: memberError } = await supabase
    .from('users_groups')
    .insert({
      user_id: user.id,
      group_id: newGroup.id,
    });

  if (memberError) {
    console.error('Error adding creator to group:', memberError);
    return { success: false, error: memberError.message };
  }

  revalidatePath('/dashboard');
  return { success: true, data: newGroup };
}

export async function acceptInvite(groupId: string) {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, error: 'You must be logged in to accept an invite.' };
  }

  // Check if the group exists
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id, name')
    .eq('id', groupId)
    .single();

  if (groupError || !group) {
    return { success: false, error: 'Group not found.' };
  }

  // Add the user to the group
  const { error } = await supabase
    .from('users_groups')
    .insert({
      user_id: user.id,
      group_id: groupId,
    });

  if (error) {
    // Check for unique constraint violation (already a member)
    if (error.code === '23505') {
      return { success: true, message: 'You are already a member of this group.' };
    }
    console.error('Error joining group:', error);
    return { success: false, error: 'Failed to join group.' };
  }

  revalidatePath(`/dashboard/group/${groupId}`);
  revalidatePath('/dashboard');
  return { success: true, message: `Successfully joined ${group.name}!` };
}

