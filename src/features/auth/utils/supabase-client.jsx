// supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kuelypopndnaoqpgjbdy.supabase.co'; // Replace with your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZWx5cG9wbmRuYW9xcGdqYmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2Nzg2NDEsImV4cCI6MjA1NDI1NDY0MX0.EIG4fA0lFRU1xXUalZMkSGoJoV5jkMRDZx1vJxSMbsg'; // Replace with your Supabase anon/public key

export const supabase = createClient(supabaseUrl, supabaseKey);