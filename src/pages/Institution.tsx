import { useState, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CertificateIcon } from "@/components/icons/BlockchainIcon";
import { Upload, FileText, X, Loader2, CheckCircle2, Wallet, AlertCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWalletContext } from "@/contexts/WalletContext";
import { useToast } from "@/hooks/use-toast";
import { hashFile, uploadFileToIPFS, uploadMetadataToIPFS, createCertificateMetadata, getIPFSUrl } from "@/lib/ipfs";
import { issueCertificate, isAuthorizedInstitution, getExplorerUrl } from "@/lib/contract";

interface UploadedFile {
  file: File;
  preview: string;
}

interface MintResult {
  tokenId: string;
  transactionHash: string;
  ipfsCID: string;
}


const Institution = () => {
  const wallet = useWalletContext();
  const { toast } = useToast();
  
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [studentWallet, setStudentWallet] = useState("");
  const [studentName, setStudentName] = useState("");
  const [degreeName, setDegreeName] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState<MintResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [mintingStep, setMintingStep] = useState("");

  // Check institution authorization when wallet connects
  const checkAuthorization = useCallback(async () => {
    if (wallet.signer && wallet.address) {
      const authorized = await isAuthorizedInstitution(wallet.signer, wallet.address);
      setIsAuthorized(authorized);
    }
  }, [wallet.signer, wallet.address]);

  // Check authorization when wallet connects
  useState(() => {
    if (wallet.isConnected) {
      checkAuthorization();
    }
  });

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.type === "application/pdf" || file.type.startsWith("image/"))) {
      setUploadedFile({
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
      });
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile({
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
      });
    }
  };

  const handleMint = async () => {
    if (!uploadedFile || !wallet.signer || !studentWallet || !studentName || !degreeName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }


    setIsMinting(true);

    try {
      // Step 1: Hash the file
      setMintingStep("Generating file hash...");
      const fileHash = await hashFile(uploadedFile.file);

      // Step 2: Upload file to IPFS
      setMintingStep("Uploading certificate to IPFS...");
      const fileCID = await uploadFileToIPFS(uploadedFile.file);

      // Step 3: Create and upload metadata
      setMintingStep("Creating NFT metadata...");
      const metadata = createCertificateMetadata(
        studentName,
        degreeName,
        institutionName || "CertChain Institution",
        new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        fileCID
      );
      const metadataCID = await uploadMetadataToIPFS(metadata);
      const tokenURI = getIPFSUrl(metadataCID);

      // Step 4: Mint the NFT
      setMintingStep("Minting certificate NFT on blockchain...");
      const result = await issueCertificate(
        wallet.signer,
        studentWallet,
        fileCID,
        fileHash,
        tokenURI,
        studentName,
        degreeName,
        institutionName || "CertChain Institution"
      );

      setMintResult({
        tokenId: result.tokenId,
        transactionHash: result.transactionHash,
        ipfsCID: fileCID,
      });

      toast({
        title: "Certificate Minted!",
        description: `Token ID: ${result.tokenId}`,
      });
    } catch (error: any) {
      console.error("Minting failed:", error);
      toast({
        title: "Minting Failed",
        description: error.message || "Failed to mint certificate",
        variant: "destructive",
      });
    } finally {
      setIsMinting(false);
      setMintingStep("");
    }
  };

  const resetForm = () => {
    setUploadedFile(null);
    setStudentWallet("");
    setStudentName("");
    setDegreeName("");
    setInstitutionName("");
    setMintResult(null);
  };

  // Not connected state
  if (!wallet.isConnected) {
    return (
      <Layout>
        <section className="min-h-[80vh] py-12 md:py-20 flex items-center relative">
          <div className="absolute inset-0 blockchain-grid opacity-20" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-lg mx-auto text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <CertificateIcon className="w-10 h-10 text-primary" />
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Institution <span className="gradient-text">Portal</span>
              </h1>
              <p className="text-muted-foreground mb-8">
                Connect your institution wallet to issue blockchain-verified certificates to students.
              </p>
              
              <div className="p-6 rounded-2xl glass-card mb-6">
                <div className="flex items-start gap-3 text-left mb-6">
                  <AlertCircle className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Only authorized institution wallets can mint certificates. 
                    Contact support to get your institution registered.
                  </p>
                </div>
                
                {wallet.error && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
                    {wallet.error}
                  </div>
                )}

                {!wallet.isMetaMaskInstalled ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      MetaMask is required to connect your wallet.
                    </p>
                    <Button
                      variant="hero"
                      size="lg"
                      className="w-full"
                      onClick={() => window.open("https://metamask.io/download/", "_blank")}
                    >
                      <ExternalLink className="w-5 h-5" />
                      Install MetaMask
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full"
                    onClick={wallet.connect}
                    disabled={wallet.isConnecting}
                  >
                    {wallet.isConnecting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-5 h-5" />
                        Connect Institution Wallet
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground">
                Network: {wallet.networkName}
              </p>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  // Success state
  if (mintResult) {
    return (
      <Layout>
        <section className="min-h-[80vh] py-12 md:py-20 flex items-center relative">
          <div className="absolute inset-0 blockchain-grid opacity-20" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-lg mx-auto text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center animate-pulse-glow">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-4 gradient-text">
                Certificate Minted Successfully!
              </h2>
              <p className="text-muted-foreground mb-8">
                The certificate NFT has been minted and sent to the student's wallet.
              </p>
              
              <div className="p-6 rounded-xl glass-card text-left mb-8 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Token ID:</span>
                  <span className="font-mono text-primary">#{mintResult.tokenId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transaction:</span>
                  <a
                    href={getExplorerUrl(mintResult.transactionHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-primary hover:underline flex items-center gap-1"
                  >
                    {mintResult.transactionHash.slice(0, 10)}...
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IPFS CID:</span>
                  <a
                    href={getIPFSUrl(mintResult.ipfsCID)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-primary hover:underline flex items-center gap-1"
                  >
                    {mintResult.ipfsCID.slice(0, 12)}...
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" onClick={resetForm}>
                  Issue Another Certificate
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.open(getExplorerUrl(mintResult.transactionHash), "_blank")}
                >
                  <ExternalLink className="w-4 h-4" />
                  View on PolygonScan
                </Button>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  // Main form
  return (
    <Layout>
      <section className="py-12 md:py-20 relative">
        <div className="absolute inset-0 blockchain-grid opacity-20" />
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Issue <span className="gradient-text">Certificate</span>
            </h1>
            <p className="text-muted-foreground">
              Upload a certificate and mint it as an NFT on the Polygon blockchain
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="p-6 md:p-8 rounded-2xl glass-card">
              {/* Connected Wallet Badge */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-sm text-muted-foreground">Connected:</span>
                  <span className="text-sm font-mono">{wallet.formatAddress(wallet.address!)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isAuthorized === null ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      Checking...
                    </span>
                  ) : isAuthorized ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                      Authorized
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent">
                      Demo Mode
                    </span>
                  )}
                  <Button variant="ghost" size="sm" onClick={wallet.disconnect}>
                    Disconnect
                  </Button>
                </div>
              </div>


              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Certificate File (PDF or Image)
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  className={cn(
                    "relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                    dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                    uploadedFile && "border-primary bg-primary/5"
                  )}
                >
                  {uploadedFile ? (
                    <div className="flex items-center justify-center gap-4">
                      {uploadedFile.preview ? (
                        <img
                          src={uploadedFile.preview}
                          alt="Preview"
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <FileText className="w-12 h-12 text-primary" />
                      )}
                      <div className="text-left">
                        <p className="font-medium">{uploadedFile.file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-2">
                        Drag and drop your certificate here
                      </p>
                      <p className="text-sm text-muted-foreground">
                        or click to browse (PDF, JPG, PNG)
                      </p>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Certificate Details */}
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Student Name
                  </label>
                  <Input
                    placeholder="Enter student's full name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="bg-secondary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Degree / Credential
                  </label>
                  <Input
                    placeholder="e.g., Bachelor of Computer Science"
                    value={degreeName}
                    onChange={(e) => setDegreeName(e.target.value)}
                    className="bg-secondary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Institution Name
                  </label>
                  <Input
                    placeholder="e.g., Stanford University"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    className="bg-secondary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Student Wallet Address
                  </label>
                  <Input
                    placeholder="0x..."
                    value={studentWallet}
                    onChange={(e) => setStudentWallet(e.target.value)}
                    className="bg-secondary/50 font-mono"
                  />
                </div>
              </div>

              {/* Mint Button */}
              <Button
                variant="hero"
                size="lg"
                className="w-full"
                onClick={handleMint}
                disabled={!uploadedFile || !studentWallet || !studentName || !degreeName || isMinting}
              >
                {isMinting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {mintingStep || "Processing..."}
                  </>
                ) : (
                  <>
                    <CertificateIcon className="w-5 h-5" />
                    Mint Certificate NFT
                  </>
                )}
              </Button>

              {/* Info */}
              <p className="text-xs text-muted-foreground text-center mt-4">
                This will upload the certificate to IPFS and mint an NFT on {wallet.networkName}
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Institution;
