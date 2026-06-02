import { Contract, JsonRpcSigner } from "ethers";
import { CERT_CHAIN_ABI } from "./contractABI";
import { CONTRACT_ADDRESSES, DEFAULT_NETWORK, NETWORKS, DEMO_MODE } from "./constants";
import {
  getDemoCertificateById,
  getDemoCertificatesByStudent,
  getDemoCertificates,
  addDemoCertificate,
  revokeDemoCertificate,
  isDemoAuthorizedInstitution,
  authorizeDemoInstitution,
  revokeDemoInstitution,
  DEMO_CONTRACT_OWNER,
} from "./demoData";

export interface Certificate {
  ipfsCID: string;
  fileHash: string;
  institution: string;
  institutionName: string;
  studentName: string;
  degreeName: string;
  issuedAt: bigint;
  revoked: boolean;
}

export interface CertificateWithId extends Certificate {
  tokenId: string;
}

// Get contract instance
export function getContract(signer: JsonRpcSigner): Contract {
  const address = CONTRACT_ADDRESSES[DEFAULT_NETWORK];
  return new Contract(address, CERT_CHAIN_ABI, signer);
}

// Check if an address is an authorized institution
export async function isAuthorizedInstitution(
  signer: JsonRpcSigner,
  address: string
): Promise<boolean> {
  if (DEMO_MODE) {
    return isDemoAuthorizedInstitution(address);
  }
  
  try {
    const contract = getContract(signer);
    // Use getInstitution to check if institution is approved
    const institution = await contract.getInstitution(address);
    return institution.isApproved || institution[2]; // isApproved is the 3rd field
  } catch (error) {
    console.error("Error checking institution authorization:", error);
    return false;
  }
}

// Issue a new certificate
export async function issueCertificate(
  signer: JsonRpcSigner,
  studentAddress: string,
  ipfsCID: string,
  fileHash: string,
  tokenURI: string,
  studentName?: string,
  degreeName?: string,
  institutionName?: string
): Promise<{ tokenId: string; transactionHash: string }> {
  if (DEMO_MODE) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const signerAddress = await signer.getAddress();
    return addDemoCertificate(
      studentAddress,
      ipfsCID,
      fileHash,
      signerAddress,
      studentName || "Demo Student",
      degreeName || "Demo Degree",
      institutionName || "Demo Institution"
    );
  }

  const contract = getContract(signer);
  
  // Convert hex string to bytes32
  const fileHashBytes = fileHash.startsWith("0x") ? fileHash : `0x${fileHash}`;
  
  // Call mintCertificate with correct parameters matching the contract
  const tx = await contract.mintCertificate(
    studentAddress,
    studentName || "Student",
    degreeName || "Certificate",
    ipfsCID,
    fileHashBytes,
    tokenURI
  );
  
  const receipt = await tx.wait();
  
  // Get token ID from CertificateMinted event
  const event = receipt.logs.find((log: any) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === "CertificateMinted";
    } catch {
      return false;
    }
  });
  
  let tokenId = "0";
  if (event) {
    const parsed = contract.interface.parseLog(event);
    tokenId = parsed?.args[0].toString() || "0";
  }
  
  return {
    tokenId,
    transactionHash: receipt.hash,
  };
}

// Get certificate data by token ID
export async function getCertificate(
  signer: JsonRpcSigner,
  tokenId: string
): Promise<Certificate | null> {
  if (DEMO_MODE) {
    const demoCert = getDemoCertificateById(tokenId);
    if (!demoCert) return null;
    return {
      ipfsCID: demoCert.ipfsCID,
      fileHash: demoCert.fileHash,
      institution: demoCert.institution,
      institutionName: demoCert.institutionName || "Demo Institution",
      studentName: demoCert.studentName || "Demo Student",
      degreeName: demoCert.degreeName || "Demo Certificate",
      issuedAt: BigInt(Math.floor(demoCert.issuedAt)),
      revoked: demoCert.revoked,
    };
  }

  try {
    const contract = getContract(signer);
    
    // Use verifyCertificate which returns a properly structured tuple
    const [isValid, certData] = await contract.verifyCertificate(tokenId);
    
    console.log("Raw certificate data from verifyCertificate:", certData);
    console.log("Certificate fields:", {
      ipfsCid: certData[0],
      fileHash: certData[1],
      institution: certData[2],
      institutionName: certData[3],
      student: certData[4],
      studentName: certData[5],
      degreeName: certData[6],
      issuedAt: certData[7]?.toString(),
      isRevoked: certData[8],
      revokeReason: certData[9]
    });
    
    // Access by index to ensure correct mapping
    // Tuple: (ipfsCid, fileHash, institution, institutionName, student, studentName, degreeName, issuedAt, isRevoked, revokeReason)
    const ipfsCid = certData[0] || certData.ipfsCid || "";
    const fileHash = certData[1] || certData.fileHash || "";
    const institution = certData[2] || certData.institution || "";
    const institutionName = certData[3] || certData.institutionName || "";
    const studentName = certData[5] || certData.studentName || "";
    const degreeName = certData[6] || certData.degreeName || "";
    const issuedAt = certData[7] || certData.issuedAt || BigInt(0);
    const isRevoked = certData[8] ?? certData.isRevoked ?? false;
    
    return {
      ipfsCID: ipfsCid,
      fileHash: fileHash,
      institution: institution,
      institutionName: institutionName || "Unknown Institution",
      studentName: studentName || "Unknown",
      degreeName: degreeName || "Certificate",
      issuedAt: BigInt(issuedAt),
      revoked: Boolean(isRevoked),
    };
  } catch (error) {
    console.error("Error getting certificate:", error);
    return null;
  }
}

// Get all certificates for a student wallet
export async function getStudentCertificates(
  signer: JsonRpcSigner,
  studentAddress: string
): Promise<CertificateWithId[]> {
  if (DEMO_MODE) {
    const demoCerts = getDemoCertificatesByStudent(studentAddress);
    return demoCerts.map((cert) => ({
      ipfsCID: cert.ipfsCID,
      fileHash: cert.fileHash,
      institution: cert.institution,
      institutionName: cert.institutionName || "Demo Institution",
      studentName: cert.studentName || "Demo Student",
      degreeName: cert.degreeName || "Demo Certificate",
      issuedAt: BigInt(Math.floor(cert.issuedAt)),
      revoked: cert.revoked,
      tokenId: cert.tokenId,
    }));
  }

  try {
    const contract = getContract(signer);
    const tokenIds: bigint[] = await contract.getStudentCertificates(studentAddress);
    
    const certificates: CertificateWithId[] = [];
    
    for (const tokenId of tokenIds) {
      const cert = await getCertificate(signer, tokenId.toString());
      if (cert) {
        certificates.push({
          ...cert,
          tokenId: tokenId.toString(),
        });
      }
    }
    
    return certificates;
  } catch (error) {
    console.error("Error getting student certificates:", error);
    return [];
  }
}

// Verify a certificate by comparing file hash
export async function verifyCertificate(
  signer: JsonRpcSigner,
  tokenId: string,
  fileHash?: string
): Promise<{
  isValid: boolean;
  certificate: Certificate | null;
  hashMatch: boolean | null;
}> {
  try {
    const certificate = await getCertificate(signer, tokenId);
    
    if (!certificate) {
      return { isValid: false, certificate: null, hashMatch: null };
    }
    
    if (certificate.revoked) {
      return { isValid: false, certificate, hashMatch: null };
    }
    
    // If file hash provided, verify it matches
    let hashMatch: boolean | null = null;
    if (fileHash) {
      const storedHash = certificate.fileHash.toLowerCase();
      const providedHash = fileHash.toLowerCase();
      hashMatch = storedHash === providedHash;
    }
    
    return {
      isValid: !certificate.revoked && (hashMatch === null || hashMatch),
      certificate,
      hashMatch,
    };
  } catch (error) {
    console.error("Error verifying certificate:", error);
    return { isValid: false, certificate: null, hashMatch: null };
  }
}

// Get owner of a token
export async function getTokenOwner(
  signer: JsonRpcSigner,
  tokenId: string
): Promise<string | null> {
  try {
    const contract = getContract(signer);
    return await contract.ownerOf(tokenId);
  } catch (error) {
    console.error("Error getting token owner:", error);
    return null;
  }
}

// Get PolygonScan URL for a transaction
export function getExplorerUrl(txHash: string): string {
  const network = NETWORKS[DEFAULT_NETWORK];
  return `${network.blockExplorerUrls[0]}/tx/${txHash}`;
}

// Get PolygonScan URL for a token
export function getTokenExplorerUrl(tokenId: string): string {
  const network = NETWORKS[DEFAULT_NETWORK];
  const contractAddress = CONTRACT_ADDRESSES[DEFAULT_NETWORK];
  return `${network.blockExplorerUrls[0]}/token/${contractAddress}?a=${tokenId}`;
}

// Get contract owner
export async function getContractOwner(
  signer: JsonRpcSigner
): Promise<string | null> {
  if (DEMO_MODE) {
    return DEMO_CONTRACT_OWNER;
  }

  try {
    const contract = getContract(signer);
    return await contract.owner();
  } catch (error) {
    console.error("Error getting contract owner:", error);
    return null;
  }
}

// Check if connected wallet is admin (has ADMIN_ROLE)
export async function isContractAdmin(
  signer: JsonRpcSigner,
  address: string
): Promise<boolean> {
  if (DEMO_MODE) {
    // In demo mode, allow the connected wallet to be admin for testing
    return true;
  }

  try {
    const contract = getContract(signer);
    const ADMIN_ROLE = await contract.ADMIN_ROLE();
    return await contract.hasRole(ADMIN_ROLE, address);
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

// Grant admin role to an address
export async function grantAdminRole(
  signer: JsonRpcSigner,
  adminAddress: string
): Promise<{ transactionHash: string }> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { transactionHash: `0xdemo_grant_admin_${Date.now().toString(16)}` };
  }

  const contract = getContract(signer);
  const ADMIN_ROLE = await contract.ADMIN_ROLE();
  const tx = await contract.grantRole(ADMIN_ROLE, adminAddress);
  const receipt = await tx.wait();
  return { transactionHash: receipt.hash };
}

// Revoke admin role from an address
export async function revokeAdminRole(
  signer: JsonRpcSigner,
  adminAddress: string
): Promise<{ transactionHash: string }> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { transactionHash: `0xdemo_revoke_admin_${Date.now().toString(16)}` };
  }

  const contract = getContract(signer);
  const ADMIN_ROLE = await contract.ADMIN_ROLE();
  const tx = await contract.revokeRole(ADMIN_ROLE, adminAddress);
  const receipt = await tx.wait();
  return { transactionHash: receipt.hash };
}

// Get all admin addresses by querying RoleGranted events
export async function getAdminAddresses(
  signer: JsonRpcSigner
): Promise<string[]> {
  if (DEMO_MODE) {
    const address = await signer.getAddress();
    return [address]; // In demo mode, return connected wallet as admin
  }

  try {
    const contract = getContract(signer);
    const ADMIN_ROLE = await contract.ADMIN_ROLE();
    
    // Query RoleGranted events
    const grantedFilter = contract.filters.RoleGranted(ADMIN_ROLE);
    const revokedFilter = contract.filters.RoleRevoked(ADMIN_ROLE);
    
    const currentBlock = await signer.provider?.getBlockNumber() || 0;
    const fromBlock = Math.max(0, currentBlock - 50000);
    
    const grantedEvents = await contract.queryFilter(grantedFilter, fromBlock, currentBlock);
    const revokedEvents = await contract.queryFilter(revokedFilter, fromBlock, currentBlock);
    
    // Build set of current admins
    const adminSet = new Set<string>();
    
    for (const event of grantedEvents) {
      const account = (event as any).args[1].toLowerCase();
      adminSet.add(account);
    }
    
    for (const event of revokedEvents) {
      const account = (event as any).args[1].toLowerCase();
      adminSet.delete(account);
    }
    
    return Array.from(adminSet);
  } catch (error) {
    console.error("Error getting admin addresses:", error);
    return [];
  }
}

// Authorize an institution (approveInstitution in the contract)
export async function authorizeInstitution(
  signer: JsonRpcSigner,
  institutionAddress: string,
  institutionName: string = "Institution",
  country: string = "Unknown"
): Promise<{ transactionHash: string }> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    authorizeDemoInstitution(institutionAddress);
    return { transactionHash: `0xdemo_auth_${Date.now().toString(16)}` };
  }

  const contract = getContract(signer);
  // Contract uses approveInstitution(address, string name, string country)
  const tx = await contract.approveInstitution(institutionAddress, institutionName, country);
  const receipt = await tx.wait();
  return { transactionHash: receipt.hash };
}

// Revoke an institution
export async function revokeInstitution(
  signer: JsonRpcSigner,
  institutionAddress: string,
  reason: string = "Revoked by admin"
): Promise<{ transactionHash: string }> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    revokeDemoInstitution(institutionAddress);
    return { transactionHash: `0xdemo_revoke_${Date.now().toString(16)}` };
  }

  const contract = getContract(signer);
  // Contract uses revokeInstitution(address, string reason)
  const tx = await contract.revokeInstitution(institutionAddress, reason);
  const receipt = await tx.wait();
  return { transactionHash: receipt.hash };
}

// Get all certificates by listening to events (for admin view)
export async function getAllCertificates(
  signer: JsonRpcSigner
): Promise<CertificateWithId[]> {
  if (DEMO_MODE) {
    const demoCerts = getDemoCertificates();
    return demoCerts.map((cert) => ({
      ipfsCID: cert.ipfsCID,
      fileHash: cert.fileHash,
      institution: cert.institution,
      institutionName: cert.institutionName || "Demo Institution",
      studentName: cert.studentName || "Demo Student",
      degreeName: cert.degreeName || "Demo Certificate",
      issuedAt: BigInt(Math.floor(cert.issuedAt)),
      revoked: cert.revoked,
      tokenId: cert.tokenId,
    }));
  }

  try {
    const contract = getContract(signer);
    
    // Get CertificateMinted events from the last 10000 blocks
    const filter = contract.filters.CertificateMinted();
    const currentBlock = await signer.provider?.getBlockNumber() || 0;
    const fromBlock = Math.max(0, currentBlock - 10000);
    
    const events = await contract.queryFilter(filter, fromBlock, currentBlock);
    
    const certificates: CertificateWithId[] = [];
    
    for (const event of events) {
      const tokenId = (event as any).args[0].toString();
      const cert = await getCertificate(signer, tokenId);
      if (cert) {
        certificates.push({
          ...cert,
          tokenId,
        });
      }
    }
    
    return certificates;
  } catch (error) {
    console.error("Error getting all certificates:", error);
    return [];
  }
}

// Revoke a certificate
export async function revokeCertificate(
  signer: JsonRpcSigner,
  tokenId: string,
  reason: string = "Revoked"
): Promise<{ transactionHash: string }> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    revokeDemoCertificate(tokenId);
    return { transactionHash: `0xdemo_revoke_cert_${Date.now().toString(16)}` };
  }

  const contract = getContract(signer);
  // Contract uses revokeCertificate(uint256, string reason)
  const tx = await contract.revokeCertificate(tokenId, reason);
  const receipt = await tx.wait();
  return { transactionHash: receipt.hash };
}
