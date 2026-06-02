// CertChainSBT Contract ABI - Matches deployed contract
export const CERT_CHAIN_ABI = [
  // Events
  "event CertificateMinted(uint256 indexed tokenId, address indexed institution, address indexed student, string ipfsCid, bytes32 fileHash)",
  "event CertificateRevoked(uint256 indexed tokenId, string reason)",
  "event InstitutionApproved(address indexed institution, string name, string country)",
  "event InstitutionRevoked(address indexed institution, string reason)",
  
  // Access Control
  "function ADMIN_ROLE() view returns (bytes32)",
  "function INSTITUTION_ROLE() view returns (bytes32)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function grantRole(bytes32 role, address account)",
  "function revokeRole(bytes32 role, address account)",
  "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
  "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)",
  
  // ERC721 Standard
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  
  // Institution Management
  "function approveInstitution(address _institution, string _name, string _country)",
  "function revokeInstitution(address _institution, string _reason)",
  "function getInstitution(address _institution) view returns (tuple(string name, string country, bool isApproved, uint256 approvedAt, uint256 certificatesIssued))",
  
  // Certificate Functions
  "function mintCertificate(address _student, string _studentName, string _degreeName, string _ipfsCid, bytes32 _fileHash, string _tokenUri) returns (uint256)",
  "function revokeCertificate(uint256 _tokenId, string _reason)",
  "function verifyCertificate(uint256 _tokenId) view returns (bool isValid, tuple(string ipfsCid, bytes32 fileHash, address institution, string institutionName, address student, string studentName, string degreeName, uint256 issuedAt, bool isRevoked, string revokeReason))",
  "function verifyCertificateByHash(bytes32 _fileHash) view returns (bool isValid, uint256 tokenId, tuple(string ipfsCid, bytes32 fileHash, address institution, string institutionName, address student, string studentName, string degreeName, uint256 issuedAt, bool isRevoked, string revokeReason))",
  
  // Query Functions  
  "function getStudentCertificates(address _student) view returns (uint256[])",
  "function getInstitutionCertificates(address _institution) view returns (uint256[])",
  "function certificates(uint256 tokenId) view returns (string ipfsCid, bytes32 fileHash, address institution, string institutionName, address student, string studentName, string degreeName, uint256 issuedAt, bool isRevoked, string revokeReason)",
  "function totalCertificates() view returns (uint256)",
] as const;
