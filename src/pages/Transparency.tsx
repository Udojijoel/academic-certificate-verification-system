import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWallet } from "@/hooks/useWallet";
import { getAllCertificates, getExplorerUrl, getTokenExplorerUrl, type CertificateWithId } from "@/lib/contract";
import { getActivityLogs, getActionLabel, getActionColor, type ActivityLog } from "@/hooks/useActivityLog";
import { 
  Shield, 
  Search, 
  ExternalLink, 
  FileCheck, 
  Building2, 
  Clock,
  Activity,
  TrendingUp,
  Award,
  Link2
} from "lucide-react";
import { format } from "date-fns";

export default function Transparency() {
  const { signer, isConnected } = useWallet();
  const [certificates, setCertificates] = useState<CertificateWithId[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch activity logs (doesn't require wallet)
        const logs = await getActivityLogs(100);
        setActivityLogs(logs);

        // Fetch certificates if wallet connected
        if (signer) {
          const certs = await getAllCertificates(signer);
          setCertificates(certs);
        }
      } catch (error) {
        console.error("Failed to fetch transparency data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [signer]);

  const validCertificates = certificates.filter(c => !c.revoked);
  const revokedCertificates = certificates.filter(c => c.revoked);
  
  const filteredCertificates = certificates.filter(cert => 
    cert.tokenId.includes(searchQuery) ||
    cert.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.ipfsCID.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (timestamp: bigint) => {
    return format(new Date(Number(timestamp) * 1000), "MMM dd, yyyy HH:mm");
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 md:space-y-4">
          <div className="flex items-center justify-center gap-2 md:gap-3">
            <Shield className="h-8 w-8 md:h-10 md:w-10 text-primary" />
            <h1 className="text-2xl md:text-4xl font-bold">Public Transparency</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-2">
            All certificate activities are recorded on the blockchain for complete transparency. 
            Anyone can verify the authenticity of certificates issued through CertChain.
          </p>
        </div>

        {/* How It Works Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Link2 className="h-4 w-4 md:h-5 md:w-5" />
              How Physical Certificates Link to NFTs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="flex flex-col items-center text-center p-3 md:p-4 bg-background rounded-lg">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <span className="text-primary font-bold text-sm md:text-base">1</span>
                </div>
                <h4 className="font-semibold text-sm md:text-base">Upload</h4>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Certificate uploaded to IPFS
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-3 md:p-4 bg-background rounded-lg">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <span className="text-primary font-bold text-sm md:text-base">2</span>
                </div>
                <h4 className="font-semibold text-sm md:text-base">Hash</h4>
                <p className="text-xs md:text-sm text-muted-foreground">
                  SHA-256 hash generated
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-3 md:p-4 bg-background rounded-lg">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <span className="text-primary font-bold text-sm md:text-base">3</span>
                </div>
                <h4 className="font-semibold text-sm md:text-base">Mint</h4>
                <p className="text-xs md:text-sm text-muted-foreground">
                  NFT minted on-chain
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-3 md:p-4 bg-background rounded-lg">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <span className="text-primary font-bold text-sm md:text-base">4</span>
                </div>
                <h4 className="font-semibold text-sm md:text-base">Verify</h4>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Compare hashes to verify
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="flex items-center gap-2 md:gap-4">
                <div className="p-2 md:p-3 rounded-lg bg-primary/10">
                  <Award className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Total Certs</p>
                  <p className="text-xl md:text-2xl font-bold">{certificates.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="flex items-center gap-2 md:gap-4">
                <div className="p-2 md:p-3 rounded-lg bg-green-500/10">
                  <FileCheck className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Valid</p>
                  <p className="text-xl md:text-2xl font-bold">{validCertificates.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="flex items-center gap-2 md:gap-4">
                <div className="p-2 md:p-3 rounded-lg bg-orange-500/10">
                  <Building2 className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Institutions</p>
                  <p className="text-xl md:text-2xl font-bold">
                    {new Set(certificates.map(c => c.institution)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="flex items-center gap-2 md:gap-4">
                <div className="p-2 md:p-3 rounded-lg bg-blue-500/10">
                  <Activity className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Actions</p>
                  <p className="text-xl md:text-2xl font-bold">{activityLogs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Certificate Registry</CardTitle>
            <CardDescription>
              Search and verify any certificate by Token ID, Institution, or IPFS CID
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Token ID, Institution Address, or IPFS CID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {!isConnected ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Connect your wallet to view the certificate registry</p>
              </div>
            ) : loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Token ID</TableHead>
                      <TableHead>Institution</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>IPFS</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCertificates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {searchQuery ? "No certificates match your search" : "No certificates found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCertificates.map((cert) => (
                        <TableRow key={cert.tokenId}>
                          <TableCell className="font-mono font-medium">
                            #{cert.tokenId}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {truncateAddress(cert.institution)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatTimestamp(cert.issuedAt)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={cert.revoked ? "destructive" : "default"}>
                              {cert.revoked ? "Revoked" : "Valid"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {cert.ipfsCID.slice(0, 12)}...
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(getTokenExplorerUrl(cert.tokenId), "_blank")}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Administrative Activity
            </CardTitle>
            <CardDescription>
              All administrative actions are logged for transparency
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No administrative activity recorded yet</p>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {activityLogs.slice(0, 20).map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-card gap-2"
                  >
                    <div className="flex flex-wrap items-center gap-2 md:gap-4">
                      <Badge className={`${getActionColor(log.action_type as any)} text-xs`}>
                        {getActionLabel(log.action_type as any)}
                      </Badge>
                      <div className="text-xs md:text-sm">
                        <span className="text-muted-foreground">By: </span>
                        <span className="font-mono">{truncateAddress(log.admin_address)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 text-xs">
                      <span className="text-muted-foreground">
                        {format(new Date(log.created_at), "MMM dd, HH:mm")}
                      </span>
                      {log.transaction_hash && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => window.open(getExplorerUrl(log.transaction_hash!), "_blank")}
                        >
                          <ExternalLink className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verification CTA */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <TrendingUp className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="text-xl font-semibold">Verify a Certificate</h3>
                  <p className="text-muted-foreground">
                    Have a certificate? Verify its authenticity instantly
                  </p>
                </div>
              </div>
              <Button asChild size="lg">
                <a href="/verify">Go to Verification</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
