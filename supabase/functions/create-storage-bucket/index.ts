
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Starting bucket creation process");
    
    // Get Supabase credentials from environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase credentials");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Server configuration error: Missing required credentials" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      { auth: { persistSession: false } }
    );

    // Check if bucket already exists
    const { data: existingBuckets, error: listError } = await supabaseAdmin
      .storage
      .listBuckets();
    
    if (listError) {
      console.error("Error listing buckets:", listError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to check existing buckets", details: listError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const bucketExists = existingBuckets.some(bucket => bucket.name === "quiz-files");
    
    if (bucketExists) {
      console.log("Bucket 'quiz-files' already exists");
      return new Response(
        JSON.stringify({ success: true, message: "Bucket already exists" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Creating new bucket 'quiz-files'");
    
    // Create the bucket with public access
    const { data, error } = await supabaseAdmin
      .storage
      .createBucket("quiz-files", {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });

    if (error) {
      console.error("Error creating bucket:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message, code: error.code }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Set up public access policy for the bucket
    try {
      const createPolicyResponse = await supabaseAdmin.rpc('create_storage_policy', {
        bucket_name: 'quiz-files',
        policy_name: 'Public Access',
        definition: 'true',
        policy_for: 'SELECT'
      });
      
      console.log("Public access policy created:", createPolicyResponse);
    } catch (policyError) {
      console.error("Error creating policy, but bucket was created:", policyError);
      // Continue since the bucket was created
    }

    console.log("Bucket created successfully");
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
