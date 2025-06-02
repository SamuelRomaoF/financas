import { User } from '@supabase/supabase-js';
import { Database } from './supabase';

export type SubscriptionPlan = Database['public']['Enums']['subscription_plan'];

export interface AppUser extends User {
  plan?: SubscriptionPlan;
} 