import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { NFTIcon, ShieldCheckIcon } from "@/components/icons/BlockchainIcon";
import { 
  GraduationCap, 
  Wallet, 
  ExternalLink, 
  Download, 
  Share2, 
  QrCode,
  RefreshCw,
  AlertCircle,
  XCircle
} from "lucide-react";
import { useWalletContext } from "@/contexts/WalletContext";
import { getStudentCertificates, CertificateWithId, getTokenExplorerUrl } from "@/lib/contract";
import { fetchFromIPFS, getIPFSUrl } from "@/lib/ipfs";
import { toast } from "sonner";
import { CertificateQRModal } from "@/components/CertificateQRModal";

interface EnrichedCertificate extends CertificateWithId {
  name?: string;
  degree?: string;
  issueDate: string;
  imageUrl?: string;
}

const Student = () => {
  const { isConnected, address, signer, connect, isConnecting } = useWalletContext();
  const [certificates, setCertificates] = useState<EnrichedCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedCertForQR, setSelectedCertForQR] = useState<EnrichedCertificate | null>(null);

  const fetchCertificates = async () => {
    if (!signer || !address) return;

    setIsLoading(true);
    setError(null);

    try {
      const certs = await getStudentCertificates(signer, address);
      
      // Enrich certificates with IPFS metadata
      const enrichedCerts: EnrichedCertificate[] = await Promise.all(
        certs.map(async (cert) => {
          const issueDate = new Date(Number(cert.issuedAt) * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          // Try to fetch metadata from IPFS
          let metadata: any = null;
          try {
            metadata = await fetchFromIPFS(cert.ipfsCID);
          } catch (e) {
            console.warn(`Could not fetch metadata for token ${cert.tokenId}:`, e);
          }

          return {
            ...cert,
            name: metadata?.name || cert.studentName || `Certificate #${cert.tokenId}`,
            degree: metadata?.attributes?.find((a: any) => a.trait_type === 'Degree')?.value || cert.degreeName || 'Academic Certificate',
            issueDate,
            imageUrl: metadata?.image ? getIPFSUrl(metadata.image.replace('ipfs://', '')) : undefined,
          };
        })
      );

      setCertificates(enrichedCerts);
      
      if (enrichedCerts.length === 0) {
        toast.info("No certificates found for this wallet");
      }
    } catch (err) {
      console.error("Error fetching certificates:", err);
      setError("Failed to fetch certificates. Please try again.");
      toast.error("Failed to fetch certificates");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && signer && address) {
      fetchCertificates();
    }
  }, [isConnected, signer, address]);

  const handleViewOnExplorer = (tokenId: string) => {
    const url = getTokenExplorerUrl(tokenId);
    window.open(url, '_blank');
  };

  const handleShare = async (cert: EnrichedCertificate) => {
    const verifyUrl = `${window.location.origin}/verify?tokenId=${cert.tokenId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: cert.name,
          text: `Verify my ${cert.degree} certificate from ${cert.institutionName}`,
          url: verifyUrl,
        });
      } catch (err) {
        // User cancelled or share failed, copy to clipboard instead
        await navigator.clipboard.writeText(verifyUrl);
        toast.success("Verification link copied to clipboard!");
      }
    } else {
      await navigator.clipboard.writeText(verifyUrl);
      toast.success("Verification link copied to clipboard!");
    }
  };

  const handleDownload = async (cert: EnrichedCertificate) => {
    if (cert.imageUrl) {
      window.open(cert.imageUrl, '_blank');
    } else {
      const ipfsUrl = getIPFSUrl(cert.ipfsCID);
      window.open(ipfsUrl, '_blank');
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleShowQR = (cert: EnrichedCertificate) => {
    setSelectedCertForQR(cert);
    setQrModalOpen(true);
  };

  if (!isConnected) {
    return (
      <Layout>
        <section className="min-h-[80vh] py-12 md:py-20 flex items-center relative">
          <div className="absolute inset-0 blockchain-grid opacity-20" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-lg mx-auto text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-accent/10 flex items-center justify-center">
                <GraduationCap className="w-10 h-10 text-accent" />
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
                My <span className="gradient-text-gold">Certificates</span>
              </h1>
              <p className="text-muted-foreground mb-8">
                Connect your wallet to view and manage your blockchain-verified academic credentials.
              </p>
              
              <Button 
                variant="gold" 
                size="lg" 
                className="w-full max-w-xs" 
                onClick={connect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Wallet className="w-5 h-5" />
                )}
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
              
              <p className="text-sm text-muted-foreground mt-4">
                Supported: MetaMask, WalletConnect
              </p>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="min-h-[80vh] py-12 md:py-20 relative">
        <div className="absolute inset-0 blockchain-grid opacity-10" />
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
                My <span className="gradient-text-gold">Certificates</span>
              </h1>
              <p className="text-muted-foreground">
                {certificates.length} certificate{certificates.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchCertificates}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg glass-card">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm font-mono">{formatAddress(address || '')}</span>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <p className="text-destructive">{error}</p>
              <Button variant="ghost" size="sm" onClick={fetchCertificates}>
                Retry
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="p-6 rounded-2xl glass-card animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-muted" />
                    <div className="w-20 h-6 rounded-full bg-muted" />
                  </div>
                  <div className="h-6 w-3/4 bg-muted rounded mb-2" />
                  <div className="h-4 w-1/2 bg-muted rounded mb-4" />
                  <div className="h-4 w-2/3 bg-muted rounded mb-6" />
                  <div className="flex gap-2">
                    <div className="h-9 w-20 bg-muted rounded" />
                    <div className="h-9 w-20 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && certificates.length === 0 && !error && (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted/50 flex items-center justify-center">
                <GraduationCap className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-2">No Certificates Yet</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                You don't have any certificates associated with this wallet. 
                Certificates will appear here once an institution issues them to your wallet address.
              </p>
            </div>
          )}

          {/* Certificates Grid */}
          {!isLoading && certificates.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {certificates.map((cert) => (
                <div
                  key={cert.tokenId}
                  className="group p-4 md:p-6 rounded-2xl glass-card hover:border-primary/50 transition-all duration-300"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3 md:mb-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
                      <NFTIcon className="w-6 h-6 md:w-7 md:h-7 text-primary-foreground" />
                    </div>
                    {cert.revoked ? (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/20 text-destructive text-xs font-medium">
                        <XCircle className="w-3 h-3" />
                        Revoked
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                        <ShieldCheckIcon className="w-3 h-3" />
                        Verified
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <h3 className="font-display text-lg md:text-xl font-semibold mb-1 line-clamp-1">
                    {cert.degree}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3 md:mb-4 line-clamp-1">
                    {cert.institutionName}
                  </p>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs md:text-sm text-muted-foreground mb-4 md:mb-6">
                    <span>Issued: {cert.issueDate}</span>
                    <span>Token: #{cert.tokenId}</span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-4 gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="gap-1 text-xs px-2"
                      onClick={() => handleViewOnExplorer(cert.tokenId)}
                    >
                      <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="gap-1 text-xs px-2"
                      onClick={() => handleDownload(cert)}
                    >
                      <Download className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="gap-1 text-xs px-2"
                      onClick={() => handleShare(cert)}
                    >
                      <Share2 className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="hidden sm:inline">Share</span>
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="gap-1 text-xs px-2"
                      onClick={() => handleShowQR(cert)}
                    >
                      <QrCode className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="hidden sm:inline">QR</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* QR Code Modal */}
        <CertificateQRModal
          open={qrModalOpen}
          onOpenChange={setQrModalOpen}
          tokenId={selectedCertForQR?.tokenId || ""}
          certificateName={selectedCertForQR?.degree}
        />
      </section>
    </Layout>
  );
};

export default Student;
