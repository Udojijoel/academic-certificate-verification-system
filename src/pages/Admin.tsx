import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Building2,
  Award,
  Plus,
  Trash2,
  Loader2,
  Wallet,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Users,
  History,
  UserPlus,
  UserMinus,
  BarChart3,
} from "lucide-react";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { useWalletContext } from "@/contexts/WalletContext";
import { useToast } from "@/hooks/use-toast";
import {
  isContractAdmin,
  isAuthorizedInstitution,
  authorizeInstitution,
  revokeInstitution,
  getAllCertificates,
  revokeCertificate,
  getExplorerUrl,
  getTokenExplorerUrl,
  CertificateWithId,
  grantAdminRole,
  revokeAdminRole,
  getAdminAddresses,
} from "@/lib/contract";
import { fetchFromIPFS } from "@/lib/ipfs";
import {
  logActivity,
  getActivityLogs,
  getActionLabel,
  getActionColor,
  ActivityLog,
} from "@/hooks/useActivityLog";
import { formatDistanceToNow } from "date-fns";

interface InstitutionEntry {
  address: string;
  isAuthorized: boolean;
  name?: string;
}

interface EnrichedCertificate extends CertificateWithId {
  issueDate?: string;
}

const Admin = () => {
  const wallet = useWalletContext();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [institutions, setInstitutions] = useState<InstitutionEntry[]>([]);
  const [certificates, setCertificates] = useState<EnrichedCertificate[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [newInstitutionAddress, setNewInstitutionAddress] = useState("");
  const [newAdminAddress, setNewAdminAddress] = useState("");
  const [checkAddress, setCheckAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isLoadingCerts, setIsLoadingCerts] = useState(false);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Check if connected wallet is admin
  const checkAdminStatus = useCallback(async () => {
    if (wallet.signer && wallet.address) {
      const admin = await isContractAdmin(wallet.signer, wallet.address);
      setIsAdmin(admin);
    }
  }, [wallet.signer, wallet.address]);

  // Load admin addresses
  const loadAdmins = useCallback(async () => {
    if (!wallet.signer) return;
    
    setIsLoadingAdmins(true);
    try {
      const adminList = await getAdminAddresses(wallet.signer);
      setAdmins(adminList);
    } catch (error) {
      console.error("Error loading admins:", error);
    } finally {
      setIsLoadingAdmins(false);
    }
  }, [wallet.signer]);

  // Load activity logs
  const loadActivityLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const logs = await getActivityLogs(50);
      setActivityLogs(logs);
    } catch (error) {
      console.error("Error loading activity logs:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  // Load certificates
  const loadCertificates = useCallback(async () => {
    if (!wallet.signer) return;
    
    setIsLoadingCerts(true);
    try {
      const certs = await getAllCertificates(wallet.signer);
      
      // Enrich with metadata
      const enrichedCerts: EnrichedCertificate[] = await Promise.all(
        certs.map(async (cert) => {
          try {
            const contract = await import("@/lib/contract");
            const tokenURI = await contract.getContract(wallet.signer!).tokenURI(cert.tokenId);
            const metadata = await fetchFromIPFS(tokenURI.replace("ipfs://", "").replace("https://gateway.pinata.cloud/ipfs/", ""));
            
            return {
              ...cert,
              studentName: metadata?.name || `Certificate #${cert.tokenId}`,
              degreeName: metadata?.attributes?.find((a: any) => a.trait_type === "Degree")?.value,
              institutionName: metadata?.attributes?.find((a: any) => a.trait_type === "Institution")?.value,
              issueDate: metadata?.attributes?.find((a: any) => a.trait_type === "Issue Date")?.value,
            };
          } catch {
            return {
              ...cert,
              studentName: `Certificate #${cert.tokenId}`,
            };
          }
        })
      );
      
      setCertificates(enrichedCerts);
    } catch (error) {
      console.error("Error loading certificates:", error);
    } finally {
      setIsLoadingCerts(false);
    }
  }, [wallet.signer]);

  useEffect(() => {
    if (wallet.isConnected) {
      checkAdminStatus();
    }
  }, [wallet.isConnected, checkAdminStatus]);

  useEffect(() => {
    if (isAdmin && wallet.signer) {
      loadCertificates();
      loadAdmins();
      loadActivityLogs();
    }
  }, [isAdmin, wallet.signer, loadCertificates, loadAdmins, loadActivityLogs]);

  const handleCheckInstitution = async () => {
    if (!checkAddress || !wallet.signer) return;
    
    setIsLoading(true);
    try {
      const authorized = await isAuthorizedInstitution(wallet.signer, checkAddress);
      
      // Add to list if not already present
      setInstitutions((prev) => {
        const exists = prev.find((i) => i.address.toLowerCase() === checkAddress.toLowerCase());
        if (exists) {
          return prev.map((i) =>
            i.address.toLowerCase() === checkAddress.toLowerCase()
              ? { ...i, isAuthorized: authorized }
              : i
          );
        }
        return [...prev, { address: checkAddress, isAuthorized: authorized }];
      });
      
      toast({
        title: authorized ? "Institution Authorized" : "Institution Not Authorized",
        description: `Address: ${checkAddress.slice(0, 10)}...${checkAddress.slice(-8)}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check institution",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setCheckAddress("");
    }
  };

  const handleAuthorizeInstitution = async () => {
    if (!newInstitutionAddress || !wallet.signer || !wallet.address) return;
    
    setLoadingAction("authorize");
    try {
      const result = await authorizeInstitution(wallet.signer, newInstitutionAddress);
      
      // Log activity
      await logActivity("INSTITUTION_AUTHORIZED", wallet.address, {
        targetAddress: newInstitutionAddress,
        transactionHash: result.transactionHash,
      });
      
      setInstitutions((prev) => {
        const exists = prev.find((i) => i.address.toLowerCase() === newInstitutionAddress.toLowerCase());
        if (exists) {
          return prev.map((i) =>
            i.address.toLowerCase() === newInstitutionAddress.toLowerCase()
              ? { ...i, isAuthorized: true }
              : i
          );
        }
        return [...prev, { address: newInstitutionAddress, isAuthorized: true }];
      });
      
      toast({
        title: "Institution Authorized",
        description: (
          <a
            href={getExplorerUrl(result.transactionHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline"
          >
            View transaction <ExternalLink className="w-3 h-3" />
          </a>
        ),
      });
      setNewInstitutionAddress("");
      loadActivityLogs();
    } catch (error: any) {
      toast({
        title: "Authorization Failed",
        description: error.message || "Failed to authorize institution",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRevokeInstitution = async (address: string) => {
    if (!wallet.signer || !wallet.address) return;
    
    setLoadingAction(`revoke-${address}`);
    try {
      const result = await revokeInstitution(wallet.signer, address);
      
      // Log activity
      await logActivity("INSTITUTION_REVOKED", wallet.address, {
        targetAddress: address,
        transactionHash: result.transactionHash,
      });
      
      setInstitutions((prev) =>
        prev.map((i) =>
          i.address.toLowerCase() === address.toLowerCase()
            ? { ...i, isAuthorized: false }
            : i
        )
      );
      
      toast({
        title: "Institution Revoked",
        description: (
          <a
            href={getExplorerUrl(result.transactionHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline"
          >
            View transaction <ExternalLink className="w-3 h-3" />
          </a>
        ),
      });
      loadActivityLogs();
    } catch (error: any) {
      toast({
        title: "Revocation Failed",
        description: error.message || "Failed to revoke institution",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRevokeCertificate = async (tokenId: string) => {
    if (!wallet.signer || !wallet.address) return;
    
    setLoadingAction(`revoke-cert-${tokenId}`);
    try {
      const result = await revokeCertificate(wallet.signer, tokenId);
      
      // Log activity
      await logActivity("CERTIFICATE_REVOKED", wallet.address, {
        targetId: tokenId,
        transactionHash: result.transactionHash,
      });
      
      setCertificates((prev) =>
        prev.map((c) =>
          c.tokenId === tokenId ? { ...c, revoked: true } : c
        )
      );
      
      toast({
        title: "Certificate Revoked",
        description: (
          <a
            href={getExplorerUrl(result.transactionHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline"
          >
            View transaction <ExternalLink className="w-3 h-3" />
          </a>
        ),
      });
      loadActivityLogs();
    } catch (error: any) {
      toast({
        title: "Revocation Failed",
        description: error.message || "Failed to revoke certificate",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminAddress || !wallet.signer || !wallet.address) return;
    
    setLoadingAction("add-admin");
    try {
      const result = await grantAdminRole(wallet.signer, newAdminAddress);
      
      // Log activity
      await logActivity("ADMIN_ADDED", wallet.address, {
        targetAddress: newAdminAddress,
        transactionHash: result.transactionHash,
      });
      
      setAdmins((prev) => [...prev, newAdminAddress.toLowerCase()]);
      
      toast({
        title: "Admin Added",
        description: (
          <a
            href={getExplorerUrl(result.transactionHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline"
          >
            View transaction <ExternalLink className="w-3 h-3" />
          </a>
        ),
      });
      setNewAdminAddress("");
      loadActivityLogs();
    } catch (error: any) {
      toast({
        title: "Failed to Add Admin",
        description: error.message || "Failed to grant admin role",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRemoveAdmin = async (address: string) => {
    if (!wallet.signer || !wallet.address) return;
    
    // Prevent removing self
    if (address.toLowerCase() === wallet.address.toLowerCase()) {
      toast({
        title: "Cannot Remove Self",
        description: "You cannot remove your own admin privileges",
        variant: "destructive",
      });
      return;
    }
    
    setLoadingAction(`remove-admin-${address}`);
    try {
      const result = await revokeAdminRole(wallet.signer, address);
      
      // Log activity
      await logActivity("ADMIN_REMOVED", wallet.address, {
        targetAddress: address,
        transactionHash: result.transactionHash,
      });
      
      setAdmins((prev) => prev.filter((a) => a.toLowerCase() !== address.toLowerCase()));
      
      toast({
        title: "Admin Removed",
        description: (
          <a
            href={getExplorerUrl(result.transactionHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline"
          >
            View transaction <ExternalLink className="w-3 h-3" />
          </a>
        ),
      });
      loadActivityLogs();
    } catch (error: any) {
      toast({
        title: "Failed to Remove Admin",
        description: error.message || "Failed to revoke admin role",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(null);
    }
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
                <Shield className="w-10 h-10 text-primary" />
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Admin <span className="gradient-text">Dashboard</span>
              </h1>
              <p className="text-muted-foreground mb-8">
                Connect an admin wallet to manage institutions, certificates, and other admins.
              </p>
              
              <div className="p-6 rounded-2xl glass-card">
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
                      Connect Admin Wallet
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  // Not admin state
  if (isAdmin === false) {
    return (
      <Layout>
        <section className="min-h-[80vh] py-12 md:py-20 flex items-center relative">
          <div className="absolute inset-0 blockchain-grid opacity-20" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-lg mx-auto text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-destructive" />
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Access Denied
              </h1>
              <p className="text-muted-foreground mb-4">
                This wallet does not have admin privileges. Only wallets with ADMIN_ROLE can access this dashboard.
              </p>
              <p className="text-sm font-mono text-muted-foreground mb-8">
                Connected: {wallet.formatAddress(wallet.address!)}
              </p>
              <Button variant="secondary" onClick={wallet.disconnect}>
                Disconnect & Try Another Wallet
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  // Loading admin check
  if (isAdmin === null) {
    return (
      <Layout>
        <section className="min-h-[80vh] py-12 md:py-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </section>
      </Layout>
    );
  }

  // Admin dashboard
  return (
    <Layout>
      <section className="py-8 md:py-12 lg:py-20 relative">
        <div className="absolute inset-0 blockchain-grid opacity-20" />
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
              <Shield className="w-4 h-4" />
              Admin Dashboard
            </div>
            <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
              Multi-Admin <span className="gradient-text">Control Panel</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Manage institutions, certificates, admin access, and view activity logs
            </p>
          </div>

          {/* Connected Wallet */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mb-6 md:mb-8">
            <div className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-xs md:text-sm font-mono">{wallet.formatAddress(wallet.address!)}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={wallet.disconnect}>
              Disconnect
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="analytics" className="max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-5 mb-6 md:mb-8 h-auto p-1">
              <TabsTrigger value="analytics" className="gap-1 md:gap-2 py-2 md:py-2.5 text-xs md:text-sm">
                <BarChart3 className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="institutions" className="gap-1 md:gap-2 py-2 md:py-2.5 text-xs md:text-sm">
                <Building2 className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Institutions</span>
              </TabsTrigger>
              <TabsTrigger value="certificates" className="gap-1 md:gap-2 py-2 md:py-2.5 text-xs md:text-sm">
                <Award className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Certificates</span>
              </TabsTrigger>
              <TabsTrigger value="admins" className="gap-1 md:gap-2 py-2 md:py-2.5 text-xs md:text-sm">
                <Users className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Admins</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-1 md:gap-2 py-2 md:py-2.5 text-xs md:text-sm">
                <History className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Activity</span>
              </TabsTrigger>
            </TabsList>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <AnalyticsDashboard 
                certificates={certificates} 
                institutions={institutions} 
              />
            </TabsContent>

            {/* Institutions Tab */}
            <TabsContent value="institutions" className="space-y-6">
              {/* Authorize New Institution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Authorize Institution
                  </CardTitle>
                  <CardDescription>
                    Add a new wallet address to the list of authorized institutions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                    <Input
                      placeholder="0x... institution wallet address"
                      value={newInstitutionAddress}
                      onChange={(e) => setNewInstitutionAddress(e.target.value)}
                      className="flex-1 font-mono text-xs md:text-sm"
                    />
                    <Button
                      onClick={handleAuthorizeInstitution}
                      disabled={!newInstitutionAddress || loadingAction === "authorize"}
                      className="w-full sm:w-auto"
                    >
                      {loadingAction === "authorize" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Authorize
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Check Institution */}
              <Card>
                <CardHeader>
                  <CardTitle>Check Institution Status</CardTitle>
                  <CardDescription>
                    Verify if a wallet address is authorized
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                    <Input
                      placeholder="0x... wallet address to check"
                      value={checkAddress}
                      onChange={(e) => setCheckAddress(e.target.value)}
                      className="flex-1 font-mono text-xs md:text-sm"
                    />
                    <Button
                      variant="secondary"
                      onClick={handleCheckInstitution}
                      disabled={!checkAddress || isLoading}
                      className="w-full sm:w-auto"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Check"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Institution List */}
              {institutions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Checked Institutions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Address</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {institutions.map((institution) => (
                          <TableRow key={institution.address}>
                            <TableCell className="font-mono text-sm">
                              {institution.address.slice(0, 10)}...{institution.address.slice(-8)}
                            </TableCell>
                            <TableCell>
                              {institution.isAuthorized ? (
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Authorized
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Not Authorized
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {institution.isAuthorized ? (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleRevokeInstitution(institution.address)}
                                  disabled={loadingAction === `revoke-${institution.address}`}
                                >
                                  {loadingAction === `revoke-${institution.address}` ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Trash2 className="w-4 h-4" />
                                      Revoke
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setNewInstitutionAddress(institution.address);
                                  }}
                                >
                                  <Plus className="w-4 h-4" />
                                  Authorize
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Certificates Tab */}
            <TabsContent value="certificates" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>All Issued Certificates</CardTitle>
                      <CardDescription>
                        View and manage all certificates minted on the blockchain
                      </CardDescription>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={loadCertificates}
                      disabled={isLoadingCerts}
                    >
                      {isLoadingCerts ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Refresh
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingCerts ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : certificates.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No certificates found</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Token ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Institution</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {certificates.map((cert) => (
                          <TableRow key={cert.tokenId}>
                            <TableCell className="font-mono">#{cert.tokenId}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{cert.studentName}</p>
                                {cert.degreeName && (
                                  <p className="text-sm text-muted-foreground">{cert.degreeName}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {cert.institutionName || cert.institution.slice(0, 8) + "..."}
                              </span>
                            </TableCell>
                            <TableCell>
                              {cert.revoked ? (
                                <Badge variant="destructive">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Revoked
                                </Badge>
                              ) : (
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Valid
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(getTokenExplorerUrl(cert.tokenId), "_blank")}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                                {!cert.revoked && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleRevokeCertificate(cert.tokenId)}
                                    disabled={loadingAction === `revoke-cert-${cert.tokenId}`}
                                  >
                                    {loadingAction === `revoke-cert-${cert.tokenId}` ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Trash2 className="w-4 h-4" />
                                        Revoke
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Admins Tab */}
            <TabsContent value="admins" className="space-y-6">
              {/* Add New Admin */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Add Admin
                  </CardTitle>
                  <CardDescription>
                    Grant ADMIN_ROLE to a new wallet address
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Input
                      placeholder="0x... new admin wallet address"
                      value={newAdminAddress}
                      onChange={(e) => setNewAdminAddress(e.target.value)}
                      className="flex-1 font-mono"
                    />
                    <Button
                      onClick={handleAddAdmin}
                      disabled={!newAdminAddress || loadingAction === "add-admin"}
                    >
                      {loadingAction === "add-admin" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Add Admin
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Admin List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Current Admins</CardTitle>
                      <CardDescription>
                        Wallets with ADMIN_ROLE can manage institutions and certificates
                      </CardDescription>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={loadAdmins}
                      disabled={isLoadingAdmins}
                    >
                      {isLoadingAdmins ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Refresh
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingAdmins ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : admins.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No admins found</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Address</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {admins.map((admin) => (
                          <TableRow key={admin}>
                            <TableCell className="font-mono text-sm">
                              {admin.slice(0, 10)}...{admin.slice(-8)}
                              {admin.toLowerCase() === wallet.address?.toLowerCase() && (
                                <Badge variant="outline" className="ml-2">You</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                                <Shield className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveAdmin(admin)}
                                disabled={
                                  loadingAction === `remove-admin-${admin}` ||
                                  admin.toLowerCase() === wallet.address?.toLowerCase()
                                }
                              >
                                {loadingAction === `remove-admin-${admin}` ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <UserMinus className="w-4 h-4" />
                                    Remove
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Log Tab */}
            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Activity Log</CardTitle>
                      <CardDescription>
                        Track all administrative actions for transparency
                      </CardDescription>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={loadActivityLogs}
                      disabled={isLoadingLogs}
                    >
                      {isLoadingLogs ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Refresh
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingLogs ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : activityLogs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No activity logs yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activityLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                        >
                          <div className={`p-2 rounded-lg ${getActionColor(log.action_type)}`}>
                            {log.action_type.includes("ADMIN") ? (
                              <Users className="w-4 h-4" />
                            ) : log.action_type.includes("INSTITUTION") ? (
                              <Building2 className="w-4 h-4" />
                            ) : (
                              <Award className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{getActionLabel(log.action_type)}</span>
                              <span className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              <span className="font-mono">
                                By: {log.admin_address.slice(0, 10)}...{log.admin_address.slice(-8)}
                              </span>
                              {log.target_address && (
                                <span className="font-mono ml-2">
                                  → {log.target_address.slice(0, 10)}...{log.target_address.slice(-8)}
                                </span>
                              )}
                              {log.target_id && (
                                <span className="ml-2">Token #{log.target_id}</span>
                              )}
                            </div>
                            {log.transaction_hash && (
                              <a
                                href={getExplorerUrl(log.transaction_hash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                              >
                                View transaction <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
};

export default Admin;
