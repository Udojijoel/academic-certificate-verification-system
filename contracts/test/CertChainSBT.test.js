const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertChainSBT", function () {
  let contract;
  let owner;
  let institution;
  let student;
  let unauthorized;

  const INSTITUTION_NAME = "Stanford University";
  const INSTITUTION_COUNTRY = "United States";
  const STUDENT_NAME = "John Doe";
  const DEGREE_NAME = "Bachelor of Computer Science";
  const IPFS_CID = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
  const FILE_HASH = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-certificate"));
  const TOKEN_URI = "ipfs://QmMetadata123";

  beforeEach(async function () {
    [owner, institution, student, unauthorized] = await ethers.getSigners();
    
    const CertChainSBT = await ethers.getContractFactory("CertChainSBT");
    contract = await CertChainSBT.deploy();
    await contract.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await contract.name()).to.equal("CertChain Academic Certificate");
      expect(await contract.symbol()).to.equal("CERT");
    });

    it("Should grant admin role to deployer", async function () {
      const ADMIN_ROLE = await contract.ADMIN_ROLE();
      expect(await contract.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Institution Management", function () {
    it("Should allow admin to approve institution", async function () {
      await expect(
        contract.approveInstitution(institution.address, INSTITUTION_NAME, INSTITUTION_COUNTRY)
      )
        .to.emit(contract, "InstitutionApproved")
        .withArgs(institution.address, INSTITUTION_NAME, INSTITUTION_COUNTRY);

      const inst = await contract.getInstitution(institution.address);
      expect(inst.name).to.equal(INSTITUTION_NAME);
      expect(inst.isApproved).to.be.true;
    });

    it("Should reject institution approval from non-admin", async function () {
      await expect(
        contract.connect(unauthorized).approveInstitution(
          institution.address,
          INSTITUTION_NAME,
          INSTITUTION_COUNTRY
        )
      ).to.be.reverted;
    });

    it("Should allow admin to revoke institution", async function () {
      await contract.approveInstitution(institution.address, INSTITUTION_NAME, INSTITUTION_COUNTRY);
      
      await expect(
        contract.revokeInstitution(institution.address, "Fraudulent activity")
      )
        .to.emit(contract, "InstitutionRevoked")
        .withArgs(institution.address, "Fraudulent activity");

      const inst = await contract.getInstitution(institution.address);
      expect(inst.isApproved).to.be.false;
    });
  });

  describe("Certificate Minting", function () {
    beforeEach(async function () {
      await contract.approveInstitution(institution.address, INSTITUTION_NAME, INSTITUTION_COUNTRY);
    });

    it("Should allow approved institution to mint certificate", async function () {
      await expect(
        contract.connect(institution).mintCertificate(
          student.address,
          STUDENT_NAME,
          DEGREE_NAME,
          IPFS_CID,
          FILE_HASH,
          TOKEN_URI
        )
      )
        .to.emit(contract, "CertificateMinted")
        .withArgs(1, institution.address, student.address, IPFS_CID, FILE_HASH);

      expect(await contract.ownerOf(1)).to.equal(student.address);
      expect(await contract.tokenURI(1)).to.equal(TOKEN_URI);
    });

    it("Should reject minting from unapproved institution", async function () {
      await expect(
        contract.connect(unauthorized).mintCertificate(
          student.address,
          STUDENT_NAME,
          DEGREE_NAME,
          IPFS_CID,
          FILE_HASH,
          TOKEN_URI
        )
      ).to.be.revertedWithCustomError(contract, "NotApprovedInstitution");
    });

    it("Should prevent duplicate certificates with same hash", async function () {
      await contract.connect(institution).mintCertificate(
        student.address,
        STUDENT_NAME,
        DEGREE_NAME,
        IPFS_CID,
        FILE_HASH,
        TOKEN_URI
      );

      await expect(
        contract.connect(institution).mintCertificate(
          student.address,
          "Another Student",
          "Another Degree",
          "DifferentCID",
          FILE_HASH, // Same hash
          TOKEN_URI
        )
      ).to.be.revertedWithCustomError(contract, "CertificateAlreadyExists");
    });

    it("Should store certificate data correctly", async function () {
      await contract.connect(institution).mintCertificate(
        student.address,
        STUDENT_NAME,
        DEGREE_NAME,
        IPFS_CID,
        FILE_HASH,
        TOKEN_URI
      );

      const cert = await contract.certificates(1);
      expect(cert.ipfsCid).to.equal(IPFS_CID);
      expect(cert.fileHash).to.equal(FILE_HASH);
      expect(cert.student).to.equal(student.address);
      expect(cert.studentName).to.equal(STUDENT_NAME);
      expect(cert.degreeName).to.equal(DEGREE_NAME);
      expect(cert.isRevoked).to.be.false;
    });
  });

  describe("Soulbound Restrictions", function () {
    beforeEach(async function () {
      await contract.approveInstitution(institution.address, INSTITUTION_NAME, INSTITUTION_COUNTRY);
      await contract.connect(institution).mintCertificate(
        student.address,
        STUDENT_NAME,
        DEGREE_NAME,
        IPFS_CID,
        FILE_HASH,
        TOKEN_URI
      );
    });

    it("Should prevent token transfers", async function () {
      await expect(
        contract.connect(student).transferFrom(student.address, unauthorized.address, 1)
      ).to.be.revertedWithCustomError(contract, "SoulboundTokenNotTransferable");
    });

    it("Should prevent approvals", async function () {
      await expect(
        contract.connect(student).approve(unauthorized.address, 1)
      ).to.be.revertedWithCustomError(contract, "SoulboundTokenNotTransferable");
    });

    it("Should prevent setApprovalForAll", async function () {
      await expect(
        contract.connect(student).setApprovalForAll(unauthorized.address, true)
      ).to.be.revertedWithCustomError(contract, "SoulboundTokenNotTransferable");
    });
  });

  describe("Certificate Verification", function () {
    beforeEach(async function () {
      await contract.approveInstitution(institution.address, INSTITUTION_NAME, INSTITUTION_COUNTRY);
      await contract.connect(institution).mintCertificate(
        student.address,
        STUDENT_NAME,
        DEGREE_NAME,
        IPFS_CID,
        FILE_HASH,
        TOKEN_URI
      );
    });

    it("Should verify valid certificate by token ID", async function () {
      const [isValid, cert] = await contract.verifyCertificate(1);
      expect(isValid).to.be.true;
      expect(cert.studentName).to.equal(STUDENT_NAME);
    });

    it("Should verify valid certificate by hash", async function () {
      const [isValid, tokenId, cert] = await contract.verifyCertificateByHash(FILE_HASH);
      expect(isValid).to.be.true;
      expect(tokenId).to.equal(1);
      expect(cert.degreeName).to.equal(DEGREE_NAME);
    });

    it("Should return invalid for non-existent certificate", async function () {
      const [isValid] = await contract.verifyCertificate(999);
      expect(isValid).to.be.false;
    });
  });

  describe("Certificate Revocation", function () {
    beforeEach(async function () {
      await contract.approveInstitution(institution.address, INSTITUTION_NAME, INSTITUTION_COUNTRY);
      await contract.connect(institution).mintCertificate(
        student.address,
        STUDENT_NAME,
        DEGREE_NAME,
        IPFS_CID,
        FILE_HASH,
        TOKEN_URI
      );
    });

    it("Should allow issuing institution to revoke certificate", async function () {
      await expect(
        contract.connect(institution).revokeCertificate(1, "Fraudulent submission")
      )
        .to.emit(contract, "CertificateRevoked")
        .withArgs(1, "Fraudulent submission");

      const cert = await contract.certificates(1);
      expect(cert.isRevoked).to.be.true;
      expect(cert.revokeReason).to.equal("Fraudulent submission");
    });

    it("Should allow admin to revoke any certificate", async function () {
      await expect(
        contract.revokeCertificate(1, "Admin revocation")
      ).to.emit(contract, "CertificateRevoked");
    });

    it("Should mark revoked certificate as invalid in verification", async function () {
      await contract.connect(institution).revokeCertificate(1, "Test");
      
      const [isValid] = await contract.verifyCertificate(1);
      expect(isValid).to.be.false;
    });

    it("Should prevent unauthorized revocation", async function () {
      await expect(
        contract.connect(unauthorized).revokeCertificate(1, "Unauthorized")
      ).to.be.revertedWithCustomError(contract, "NotApprovedInstitution");
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      await contract.approveInstitution(institution.address, INSTITUTION_NAME, INSTITUTION_COUNTRY);
      
      // Mint multiple certificates
      for (let i = 0; i < 3; i++) {
        const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`cert-${i}`));
        await contract.connect(institution).mintCertificate(
          student.address,
          STUDENT_NAME,
          DEGREE_NAME,
          `CID-${i}`,
          hash,
          TOKEN_URI
        );
      }
    });

    it("Should return all student certificates", async function () {
      const certs = await contract.getStudentCertificates(student.address);
      expect(certs.length).to.equal(3);
    });

    it("Should return all institution certificates", async function () {
      const certs = await contract.getInstitutionCertificates(institution.address);
      expect(certs.length).to.equal(3);
    });

    it("Should return total certificate count", async function () {
      expect(await contract.totalCertificates()).to.equal(3);
    });
  });
});
