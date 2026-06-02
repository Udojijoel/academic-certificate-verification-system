// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CertChainSBT
 * @author CertChain Protocol
 * @notice Soulbound (non-transferable) Academic Certificate NFTs on Polygon
 * @dev ERC-721 with transfer restrictions, institution access control, and revocation
 */
contract CertChainSBT is ERC721, ERC721URIStorage, AccessControl {
    using Counters for Counters.Counter;

    // ============ Roles ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant INSTITUTION_ROLE = keccak256("INSTITUTION_ROLE");

    // ============ State Variables ============
    Counters.Counter private _tokenIdCounter;

    // Certificate metadata structure
    struct Certificate {
        string ipfsCid;           // IPFS Content Identifier for the certificate file
        bytes32 fileHash;         // SHA-256 hash of the certificate file
        address institution;      // Issuing institution's address
        string institutionName;   // Human-readable institution name
        address student;          // Student's wallet address
        string studentName;       // Student's name
        string degreeName;        // Degree/Certificate title
        uint256 issuedAt;         // Timestamp of issuance
        bool isRevoked;           // Revocation status
        string revokeReason;      // Reason for revocation (if applicable)
    }

    // Institution metadata
    struct Institution {
        string name;
        string country;
        bool isApproved;
        uint256 approvedAt;
        uint256 certificatesIssued;
    }

    // Mappings
    mapping(uint256 => Certificate) public certificates;
    mapping(address => Institution) public institutions;
    mapping(bytes32 => uint256) public hashToTokenId;  // Prevent duplicate certificates
    mapping(address => uint256[]) public studentCertificates;  // Student's certificate list
    mapping(address => uint256[]) public institutionCertificates;  // Institution's issued certificates

    // ============ Events ============
    event InstitutionApproved(address indexed institution, string name, string country);
    event InstitutionRevoked(address indexed institution, string reason);
    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed institution,
        address indexed student,
        string ipfsCid,
        bytes32 fileHash
    );
    event CertificateRevoked(uint256 indexed tokenId, string reason);

    // ============ Errors ============
    error NotApprovedInstitution();
    error CertificateAlreadyExists();
    error CertificateNotFound();
    error CertificateAlreadyRevoked();
    error SoulboundTokenNotTransferable();
    error InvalidAddress();
    error InvalidHash();
    error InvalidCid();

    // ============ Constructor ============
    constructor() ERC721("CertChain Academic Certificate", "CERT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // ============ Modifiers ============
    modifier onlyApprovedInstitution() {
        if (!institutions[msg.sender].isApproved) {
            revert NotApprovedInstitution();
        }
        _;
    }

    // ============ Admin Functions ============

    /**
     * @notice Approve an institution to mint certificates
     * @param _institution Address of the institution
     * @param _name Name of the institution
     * @param _country Country of the institution
     */
    function approveInstitution(
        address _institution,
        string calldata _name,
        string calldata _country
    ) external onlyRole(ADMIN_ROLE) {
        if (_institution == address(0)) revert InvalidAddress();
        
        institutions[_institution] = Institution({
            name: _name,
            country: _country,
            isApproved: true,
            approvedAt: block.timestamp,
            certificatesIssued: 0
        });

        emit InstitutionApproved(_institution, _name, _country);
    }

    /**
     * @notice Revoke an institution's minting privileges
     * @param _institution Address of the institution
     * @param _reason Reason for revocation
     */
    function revokeInstitution(
        address _institution,
        string calldata _reason
    ) external onlyRole(ADMIN_ROLE) {
        institutions[_institution].isApproved = false;
        emit InstitutionRevoked(_institution, _reason);
    }

    // ============ Institution Functions ============

    /**
     * @notice Mint a new soulbound certificate NFT
     * @param _student Student's wallet address
     * @param _studentName Student's full name
     * @param _degreeName Name of the degree/certificate
     * @param _ipfsCid IPFS Content Identifier of the certificate file
     * @param _fileHash SHA-256 hash of the certificate file
     * @param _tokenUri Metadata URI for the NFT
     * @return tokenId The ID of the minted certificate
     */
    function mintCertificate(
        address _student,
        string calldata _studentName,
        string calldata _degreeName,
        string calldata _ipfsCid,
        bytes32 _fileHash,
        string calldata _tokenUri
    ) external onlyApprovedInstitution returns (uint256) {
        if (_student == address(0)) revert InvalidAddress();
        if (_fileHash == bytes32(0)) revert InvalidHash();
        if (bytes(_ipfsCid).length == 0) revert InvalidCid();
        if (hashToTokenId[_fileHash] != 0) revert CertificateAlreadyExists();

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        // Store certificate data
        certificates[tokenId] = Certificate({
            ipfsCid: _ipfsCid,
            fileHash: _fileHash,
            institution: msg.sender,
            institutionName: institutions[msg.sender].name,
            student: _student,
            studentName: _studentName,
            degreeName: _degreeName,
            issuedAt: block.timestamp,
            isRevoked: false,
            revokeReason: ""
        });

        // Update mappings
        hashToTokenId[_fileHash] = tokenId;
        studentCertificates[_student].push(tokenId);
        institutionCertificates[msg.sender].push(tokenId);
        institutions[msg.sender].certificatesIssued++;

        // Mint the NFT
        _safeMint(_student, tokenId);
        _setTokenURI(tokenId, _tokenUri);

        emit CertificateMinted(tokenId, msg.sender, _student, _ipfsCid, _fileHash);

        return tokenId;
    }

    /**
     * @notice Revoke a certificate (only by issuing institution)
     * @param _tokenId Token ID of the certificate
     * @param _reason Reason for revocation
     */
    function revokeCertificate(
        uint256 _tokenId,
        string calldata _reason
    ) external {
        Certificate storage cert = certificates[_tokenId];
        
        if (cert.institution == address(0)) revert CertificateNotFound();
        if (cert.institution != msg.sender && !hasRole(ADMIN_ROLE, msg.sender)) {
            revert NotApprovedInstitution();
        }
        if (cert.isRevoked) revert CertificateAlreadyRevoked();

        cert.isRevoked = true;
        cert.revokeReason = _reason;

        emit CertificateRevoked(_tokenId, _reason);
    }

    // ============ View Functions ============

    /**
     * @notice Verify a certificate by its token ID
     * @param _tokenId Token ID to verify
     * @return isValid Whether the certificate is valid (exists and not revoked)
     * @return certificate The certificate data
     */
    function verifyCertificate(uint256 _tokenId) 
        external 
        view 
        returns (bool isValid, Certificate memory certificate) 
    {
        certificate = certificates[_tokenId];
        isValid = certificate.institution != address(0) && !certificate.isRevoked;
        return (isValid, certificate);
    }

    /**
     * @notice Verify a certificate by its file hash
     * @param _fileHash SHA-256 hash of the certificate file
     * @return isValid Whether the certificate is valid
     * @return tokenId The token ID if found
     * @return certificate The certificate data
     */
    function verifyCertificateByHash(bytes32 _fileHash)
        external
        view
        returns (bool isValid, uint256 tokenId, Certificate memory certificate)
    {
        tokenId = hashToTokenId[_fileHash];
        if (tokenId == 0) {
            return (false, 0, certificate);
        }
        certificate = certificates[tokenId];
        isValid = !certificate.isRevoked;
        return (isValid, tokenId, certificate);
    }

    /**
     * @notice Get all certificates for a student
     * @param _student Student's wallet address
     * @return tokenIds Array of token IDs
     */
    function getStudentCertificates(address _student)
        external
        view
        returns (uint256[] memory)
    {
        return studentCertificates[_student];
    }

    /**
     * @notice Get all certificates issued by an institution
     * @param _institution Institution's wallet address
     * @return tokenIds Array of token IDs
     */
    function getInstitutionCertificates(address _institution)
        external
        view
        returns (uint256[] memory)
    {
        return institutionCertificates[_institution];
    }

    /**
     * @notice Get institution details
     * @param _institution Institution's wallet address
     * @return Institution data
     */
    function getInstitution(address _institution)
        external
        view
        returns (Institution memory)
    {
        return institutions[_institution];
    }

    /**
     * @notice Get total number of certificates minted
     * @return Total count
     */
    function totalCertificates() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    // ============ Soulbound Implementation ============

    /**
     * @notice Override transfer to make tokens soulbound (non-transferable)
     * @dev Reverts all transfer attempts except minting (from address(0))
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override {
        // Allow minting (from == address(0)) and burning (to == address(0))
        if (from != address(0) && to != address(0)) {
            revert SoulboundTokenNotTransferable();
        }
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    /**
     * @notice Override approve to prevent approvals (soulbound)
     */
    function approve(address, uint256) public virtual override(ERC721, IERC721) {
        revert SoulboundTokenNotTransferable();
    }

    /**
     * @notice Override setApprovalForAll to prevent approvals (soulbound)
     */
    function setApprovalForAll(address, bool) public virtual override(ERC721, IERC721) {
        revert SoulboundTokenNotTransferable();
    }

    // ============ Required Overrides ============

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
