// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ratbjpbgodyvqtjrxozr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhdGJqcGJnb2R5dnF0anJ4b3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg3MTc3NDQsImV4cCI6MjA1NDI5Mzc0NH0.xAcA9Bmz9mxu62TtamQA-Nh9wmaBtdXRFQ4xiIJA-sg";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);