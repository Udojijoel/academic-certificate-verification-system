// Demo data for testing without a deployed contract

export interface DemoCertificate {
  tokenId: string;
  studentAddress: string;
  ipfsCID: string;
  fileHash: string;
  institution: string;
  issuedAt: number;
  revoked: boolean;
  studentName: string;
  degreeName: string;
  institutionName: string;
}

// In-memory storage for demo mode
let demoCertificates: DemoCertificate[] = [
  {
    tokenId: "1",
    studentAddress: "0x1234567890abcdef1234567890abcdef12345678",
    ipfsCID: "QmDemo123456789",
    fileHash: "0xdemo1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    institution: "0xInstitution123456789abcdef12345678",
    issuedAt: Date.now() / 1000 - 86400 * 30, // 30 days ago
    revoked: false,
    studentName: "John Doe",
    degreeName: "Bachelor of Computer Science",
    institutionName: "Demo University",
  },
  {
    tokenId: "2",
    studentAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    ipfsCID: "QmDemo987654321",
    fileHash: "0xdemo0987654321fedcba0987654321fedcba0987654321fedcba0987654321fe",
    institution: "0xInstitution123456789abcdef12345678",
    issuedAt: Date.now() / 1000 - 86400 * 7, // 7 days ago
    revoked: false,
    studentName: "Jane Smith",
    degreeName: "Master of Business Administration",
    institutionName: "Demo University",
  },
];

let authorizedInstitutions: string[] = [
  "0xInstitution123456789abcdef12345678",
];

let demoAdmins: string[] = [];

let nextTokenId = 3;

// Demo contract owner (for admin access)
export const DEMO_CONTRACT_OWNER = "0xDemoOwner12345678901234567890123456789012";

export function getDemoAdmins(): string[] {
  return [...demoAdmins];
}

export function addDemoAdmin(address: string): void {
  if (!demoAdmins.some((a) => a.toLowerCase() === address.toLowerCase())) {
    demoAdmins.push(address.toLowerCase());
  }
}

export function removeDemoAdmin(address: string): void {
  demoAdmins = demoAdmins.filter((a) => a.toLowerCase() !== address.toLowerCase());
}

export function getDemoCertificates(): DemoCertificate[] {
  return [...demoCertificates];
}

export function getDemoCertificateById(tokenId: string): DemoCertificate | null {
  return demoCertificates.find((c) => c.tokenId === tokenId) || null;
}

export function getDemoCertificatesByStudent(studentAddress: string): DemoCertificate[] {
  return demoCertificates.filter(
    (c) => c.studentAddress.toLowerCase() === studentAddress.toLowerCase()
  );
}

export function addDemoCertificate(
  studentAddress: string,
  ipfsCID: string,
  fileHash: string,
  institutionAddress: string,
  studentName: string,
  degreeName: string,
  institutionName: string
): { tokenId: string; transactionHash: string } {
  const tokenId = String(nextTokenId++);
  const certificate: DemoCertificate = {
    tokenId,
    studentAddress,
    ipfsCID,
    fileHash,
    institution: institutionAddress,
    issuedAt: Date.now() / 1000,
    revoked: false,
    studentName,
    degreeName,
    institutionName,
  };
  demoCertificates.push(certificate);
  return {
    tokenId,
    transactionHash: `0xdemo_tx_${Date.now().toString(16)}`,
  };
}

export function revokeDemoCertificate(tokenId: string): boolean {
  const cert = demoCertificates.find((c) => c.tokenId === tokenId);
  if (cert) {
    cert.revoked = true;
    return true;
  }
  return false;
}

export function isDemoAuthorizedInstitution(address: string): boolean {
  return authorizedInstitutions.some(
    (inst) => inst.toLowerCase() === address.toLowerCase()
  );
}

export function authorizeDemoInstitution(address: string): void {
  if (!isDemoAuthorizedInstitution(address)) {
    authorizedInstitutions.push(address);
  }
}

export function revokeDemoInstitution(address: string): void {
  authorizedInstitutions = authorizedInstitutions.filter(
    (inst) => inst.toLowerCase() !== address.toLowerCase()
  );
}

export function getDemoAuthorizedInstitutions(): string[] {
  return [...authorizedInstitutions];
}
