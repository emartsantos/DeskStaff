import { createClient } from "@supabase/supabase-js";

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

const supabaseUrl = "https://zmkgfngbmyzewbkhxffe.supabase.co";
const supabaseAnonKey = "sb_publishable_QQR1p7r0-ZoxvQ6r0DR1gQ_pWSOebv8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
