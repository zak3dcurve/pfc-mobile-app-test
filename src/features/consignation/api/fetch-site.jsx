import { supabase } from "@/features/auth/utils/supabase-client";

export const fetchSites = async () => {
  const { data, error } = await supabase.from("sites").select("*");
  if (error) throw error;
  return data;
};