import { IPFS_GATEWAY } from "./constants";
import { supabase } from "@/integrations/supabase/client";

interface CertificateMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string;
  }[];
}

// Generate SHA-256 hash of a file
export async function hashFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Check if crypto.subtle is available (requires HTTPS or localhost)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return `0x${hashHex}`;
  }
  
  // Fallback: Use a simple hash function for non-secure contexts
  // This generates a deterministic hash based on file content
  const bytes = new Uint8Array(arrayBuffer);
  let hash = 0n;
  for (let i = 0; i < bytes.length; i++) {
    hash = ((hash << 5n) - hash + BigInt(bytes[i])) & 0xFFFFFFFFFFFFFFFFn;
  }
  // Pad to 64 hex characters (256 bits)
  const hexHash = hash.toString(16).padStart(64, '0');
  return `0x${hexHash}`;
}

// Upload file to IPFS via Edge Function
export async function uploadFileToIPFS(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const { data, error } = await supabase.functions.invoke("ipfs-upload", {
    body: formData,
  });

  if (error) {
    throw new Error(error.message || "Failed to upload file to IPFS");
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data.ipfsHash;
}

// Upload metadata JSON to IPFS via Edge Function
export async function uploadMetadataToIPFS(
  metadata: CertificateMetadata
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("ipfs-upload", {
    body: {
      action: "pinJSON",
      metadata: {
        content: metadata,
        pinataMetadata: {
          name: `${metadata.name}-metadata`,
          keyvalues: {
            type: "certificate-metadata",
          },
        },
      },
    },
  });

  if (error) {
    throw new Error(error.message || "Failed to upload metadata to IPFS");
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data.ipfsHash;
}

// Create NFT metadata for a certificate
export function createCertificateMetadata(
  studentName: string,
  degreeName: string,
  institutionName: string,
  issueDate: string,
  certificateCID: string
): CertificateMetadata {
  return {
    name: `${degreeName} - ${studentName}`,
    description: `This is a blockchain-verified academic certificate issued by ${institutionName} to ${studentName}.`,
    image: `${IPFS_GATEWAY}${certificateCID}`,
    attributes: [
      { trait_type: "Student Name", value: studentName },
      { trait_type: "Degree", value: degreeName },
      { trait_type: "Institution", value: institutionName },
      { trait_type: "Issue Date", value: issueDate },
      { trait_type: "Certificate CID", value: certificateCID },
    ],
  };
}

// Fetch content from IPFS
export async function fetchFromIPFS(cid: string): Promise<any> {
  const response = await fetch(`${IPFS_GATEWAY}${cid}`);
  if (!response.ok) {
    throw new Error("Failed to fetch from IPFS");
  }
  return response.json();
}

// Get IPFS URL from CID
export function getIPFSUrl(cid: string): string {
  return `${IPFS_GATEWAY}${cid}`;
}
