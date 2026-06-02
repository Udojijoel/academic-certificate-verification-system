import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PINATA_API_URL = "https://api.pinata.cloud";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const pinataApiKey = Deno.env.get("PINATA_API_KEY");
    const pinataSecretKey = Deno.env.get("PINATA_SECRET_KEY");

    if (!pinataApiKey || !pinataSecretKey) {
      throw new Error("Pinata API keys not configured");
    }

    const contentType = req.headers.get("content-type") || "";

    // Handle JSON metadata upload
    if (contentType.includes("application/json")) {
      const { metadata, action } = await req.json();

      if (action === "pinJSON") {
        const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataSecretKey,
          },
          body: JSON.stringify({
            pinataContent: metadata.content,
            pinataMetadata: metadata.pinataMetadata,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to upload metadata to IPFS");
        }

        const data = await response.json();
        return new Response(JSON.stringify({ ipfsHash: data.IpfsHash }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Handle file upload (multipart/form-data)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof File)) {
        throw new Error("No file provided");
      }

      const pinataFormData = new FormData();
      pinataFormData.append("file", file);

      const pinataMetadata = JSON.stringify({
        name: file.name,
        keyvalues: {
          type: "certificate",
          timestamp: new Date().toISOString(),
        },
      });
      pinataFormData.append("pinataMetadata", pinataMetadata);

      const pinataOptions = JSON.stringify({ cidVersion: 1 });
      pinataFormData.append("pinataOptions", pinataOptions);

      const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
        method: "POST",
        headers: {
          pinata_api_key: pinataApiKey,
          pinata_secret_api_key: pinataSecretKey,
        },
        body: pinataFormData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload file to IPFS");
      }

      const data = await response.json();
      return new Response(JSON.stringify({ ipfsHash: data.IpfsHash }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid request format");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("IPFS upload error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
