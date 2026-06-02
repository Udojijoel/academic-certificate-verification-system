import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheckIcon } from "@/components/icons/BlockchainIcon";
import { Search, QrCode, Hash, CheckCircle2, XCircle, Loader2, FileText, Calendar, Building2, ExternalLink, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWalletContext } from "@/contexts/WalletContext";
import { verifyCertificate, getCertificate, getTokenOwner, getTokenExplorerUrl } from "@/lib/contract";
import { fetchFromIPFS, getIPFSUrl } from "@/lib/ipfs";
import { useToast } from "@/hooks/use-toast";

type VerificationStatus = "idle" | "loading" | "verified" | "invalid";

interface CertificateData {
  name: string;
  degree: string;
  institution: string;
  issueDate: string;
  tokenId: string;
  ipfsHash: string;
  owner: string;
  isRevoked: boolean;
}

const Verify = () => {
  const wallet = useWalletContext();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [searchType, setSearchType] = useState<"tokenId" | "wallet" | "qr">("tokenId");
  const [searchValue, setSearchValue] = useState("");
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);

  // Auto-fill from URL query parameter (for QR code scans)
  useEffect(() => {
    const tokenIdFromUrl = searchParams.get("tokenId");
    if (tokenIdFromUrl) {
      setSearchValue(tokenIdFromUrl);
      setSearchType("tokenId");
    }
  }, [searchParams]);

  const handleVerify = async () => {
    if (!searchValue.trim()) return;
    
    // If wallet not connected, try to connect first
    if (!wallet.isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to verify certificates on the blockchain",
        variant: "destructive",
      });
      return;
    }

    if (!wallet.signer) {
      toast({
        title: "Error",
        description: "Wallet signer not available",
        variant: "destructive",
      });
      return;
    }
    
    setStatus("loading");
    setCertificateData(null);
    
    try {
      let tokenId = searchValue.trim();
      
      // Remove # if present
      if (tokenId.startsWith("#")) {
        tokenId = tokenId.slice(1);
      }
      
      // Get certificate from blockchain
      const certificate = await getCertificate(wallet.signer, tokenId);
      
      if (!certificate) {
        setStatus("invalid");
        return;
      }
      
      // Get owner
      const owner = await getTokenOwner(wallet.signer, tokenId);
      
      // Try to fetch metadata from IPFS
      let metadata: any = null;
      try {
        metadata = await fetchFromIPFS(certificate.ipfsCID);
      } catch (error) {
        console.warn("Could not fetch IPFS metadata:", error);
      }
      
      // Parse metadata or use defaults
      const studentName = metadata?.attributes?.find((a: any) => a.trait_type === "Student Name")?.value || "Unknown";
      const degree = metadata?.attributes?.find((a: any) => a.trait_type === "Degree")?.value || "Certificate";
      const institution = metadata?.attributes?.find((a: any) => a.trait_type === "Institution")?.value || "Unknown Institution";
      const issueDate = metadata?.attributes?.find((a: any) => a.trait_type === "Issue Date")?.value || 
        new Date(Number(certificate.issuedAt) * 1000).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      
      if (certificate.revoked) {
        setStatus("invalid");
        setCertificateData({
          name: studentName,
          degree,
          institution,
          issueDate,
          tokenId,
          ipfsHash: certificate.ipfsCID,
          owner: owner || "",
          isRevoked: true,
        });
      } else {
        setStatus("verified");
        setCertificateData({
          name: studentName,
          degree,
          institution,
          issueDate,
          tokenId,
          ipfsHash: certificate.ipfsCID,
          owner: owner || "",
          isRevoked: false,
        });
      }
    } catch (error: any) {
      console.error("Verification failed:", error);
      setStatus("invalid");
      toast({
        title: "Verification Failed",
        description: error.message || "Could not verify certificate",
        variant: "destructive",
      });
    }
  };

  const resetVerification = () => {
    setStatus("idle");
    setSearchValue("");
    setCertificateData(null);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Layout>
      <section className="min-h-[80vh] py-8 md:py-12 lg:py-20 relative">
        {/* Background */}
        <div className="absolute inset-0 blockchain-grid opacity-20" />
        <div className="absolute top-20 right-10 md:right-20 w-60 md:w-80 h-60 md:h-80 bg-primary/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-full glass-card mb-4 md:mb-6">
              <ShieldCheckIcon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              <span className="text-xs md:text-sm text-muted-foreground">
                Instant Blockchain Verification
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
              Verify <span className="gradient-text">Certificate</span>
            </h1>
            <p className="text-sm md:text-lg text-muted-foreground">
              Instantly verify the authenticity of any blockchain-issued certificate
            </p>
          </div>

          {/* Wallet Connection */}
          {!wallet.isConnected && (
            <div className="max-w-md mx-auto mb-6 md:mb-8">
              <div className="p-3 md:p-4 rounded-xl glass-card flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 md:gap-3">
                  <Wallet className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                  <span className="text-xs md:text-sm text-muted-foreground">Connect wallet to verify</span>
                </div>
                <Button
                  variant="hero"
                  size="sm"
                  onClick={wallet.connect}
                  disabled={wallet.isConnecting}
                >
                  {wallet.isConnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Connect"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Verification Card */}
          <div className="max-w-2xl mx-auto">
            <div className="p-4 sm:p-6 md:p-8 rounded-2xl glass-card">
              {status === "idle" || status === "loading" ? (
                <>
                  {/* Search Type Tabs */}
                  <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
                    {[
                      { id: "tokenId", icon: <Hash className="w-3 h-3 md:w-4 md:h-4" />, label: "Token ID" },
                      { id: "wallet", icon: <Search className="w-3 h-3 md:w-4 md:h-4" />, label: "Wallet" },
                      { id: "qr", icon: <QrCode className="w-3 h-3 md:w-4 md:h-4" />, label: "QR Code" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setSearchType(tab.id as typeof searchType)}
                        className={cn(
                          "flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all",
                          searchType === tab.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Search Input */}
                  {searchType !== "qr" ? (
                    <div className="space-y-3 md:space-y-4">
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder={
                            searchType === "tokenId"
                              ? "Enter NFT Token ID (e.g., 12345)"
                              : "Enter wallet address (0x...)"
                          }
                          value={searchValue}
                          onChange={(e) => setSearchValue(e.target.value)}
                          className="h-12 md:h-14 pl-10 md:pl-12 pr-4 text-sm md:text-lg bg-secondary/50 border-border focus:border-primary"
                        />
                        <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                      </div>
                      <Button
                        variant="hero"
                        size="lg"
                        className="w-full"
                        onClick={handleVerify}
                        disabled={status === "loading" || !searchValue.trim() || !wallet.isConnected}
                      >
                        {status === "loading" ? (
                          <>
                            <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                            <span className="text-sm md:text-base">Verifying...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheckIcon className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="text-sm md:text-base">Verify Certificate</span>
                          </>
                        )}
                      </Button>
                      
                      {wallet.isConnected && (
                        <p className="text-xs text-center text-muted-foreground">
                          Connected to {wallet.networkName}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 md:py-12">
                      <div className="w-32 h-32 md:w-48 md:h-48 mx-auto mb-4 md:mb-6 rounded-2xl border-2 border-dashed border-border flex items-center justify-center bg-secondary/20">
                        <QrCode className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground" />
                      </div>
                      <p className="text-sm md:text-base text-muted-foreground mb-4">
                        Scan a certificate QR code to verify instantly
                      </p>
                      <Button variant="hero-outline" size="lg">
                        <QrCode className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="text-sm md:text-base">Open Camera</span>
                      </Button>
                    </div>
                  )}
                </>
              ) : status === "verified" && certificateData ? (
                <div className="text-center">
                  {/* Success Icon */}
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center animate-pulse-glow">
                    <CheckCircle2 className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="font-display text-2xl font-bold mb-2 gradient-text">
                    Certificate Verified
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    This certificate is authentic and has not been tampered with
                  </p>

                  {/* Certificate Details */}
                  <div className="text-left space-y-4 p-6 rounded-xl bg-secondary/30 mb-6">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Recipient</p>
                        <p className="font-semibold">{certificateData.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Credential</p>
                        <p className="font-semibold">{certificateData.degree}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Issuing Institution</p>
                        <p className="font-semibold">{certificateData.institution}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Issue Date</p>
                        <p className="font-semibold">{certificateData.issueDate}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Token ID:</span>
                        <a
                          href={getTokenExplorerUrl(certificateData.tokenId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-primary hover:underline flex items-center gap-1"
                        >
                          #{certificateData.tokenId}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Owner:</span>
                        <span className="font-mono text-primary">{formatAddress(certificateData.owner)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">IPFS:</span>
                        <a
                          href={getIPFSUrl(certificateData.ipfsHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-primary hover:underline flex items-center gap-1"
                        >
                          {certificateData.ipfsHash.slice(0, 12)}...
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button variant="secondary" onClick={resetVerification}>
                      Verify Another
                    </Button>
                    <Button
                      variant="hero-outline"
                      onClick={() => window.open(getIPFSUrl(certificateData.ipfsHash), "_blank")}
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Certificate
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  {/* Error Icon */}
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/20 flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-destructive" />
                  </div>
                  <h2 className="font-display text-2xl font-bold mb-2 text-destructive">
                    {certificateData?.isRevoked ? "Certificate Revoked" : "Verification Failed"}
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    {certificateData?.isRevoked
                      ? "This certificate has been revoked by the issuing institution."
                      : "This certificate could not be verified. It may be invalid or tampered with."}
                  </p>
                  <Button variant="secondary" onClick={resetVerification}>
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Verify;
