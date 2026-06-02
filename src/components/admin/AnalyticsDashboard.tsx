import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Award, Building2, TrendingUp, Shield, CheckCircle, XCircle } from "lucide-react";
import { CertificateWithId } from "@/lib/contract";

interface EnrichedCertificate extends CertificateWithId {
  issueDate?: string;
}

interface AnalyticsDashboardProps {
  certificates: EnrichedCertificate[];
  institutions: { address: string; isAuthorized: boolean }[];
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export const AnalyticsDashboard = ({ certificates, institutions }: AnalyticsDashboardProps) => {
  // Calculate issuance trends by month
  const issuanceTrends = useMemo(() => {
    const monthlyData: Record<string, { issued: number; revoked: number }> = {};
    
    certificates.forEach((cert) => {
      const timestamp = typeof cert.issuedAt === "bigint" ? Number(cert.issuedAt) : cert.issuedAt;
      const date = new Date(timestamp * 1000);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { issued: 0, revoked: 0 };
      }
      
      monthlyData[monthKey].issued++;
      if (cert.revoked) {
        monthlyData[monthKey].revoked++;
      }
    });
    
    // Sort by date and get last 12 months
    const sortedKeys = Object.keys(monthlyData).sort();
    const last12 = sortedKeys.slice(-12);
    
    return last12.map((key) => ({
      month: new Date(key + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      issued: monthlyData[key].issued,
      revoked: monthlyData[key].revoked,
    }));
  }, [certificates]);

  // Calculate institution activity
  const institutionActivity = useMemo(() => {
    const activityMap: Record<string, number> = {};
    
    certificates.forEach((cert) => {
      const instName = cert.institutionName || cert.institution.slice(0, 10) + "...";
      activityMap[instName] = (activityMap[instName] || 0) + 1;
    });
    
    return Object.entries(activityMap)
      .map(([name, count]) => ({ name, certificates: count }))
      .sort((a, b) => b.certificates - a.certificates)
      .slice(0, 8);
  }, [certificates]);

  // Calculate verification stats (simulated based on certificates)
  const verificationStats = useMemo(() => {
    const total = certificates.length;
    const valid = certificates.filter((c) => !c.revoked).length;
    const revoked = certificates.filter((c) => c.revoked).length;
    
    return [
      { name: "Valid", value: valid, color: "hsl(142, 76%, 36%)" },
      { name: "Revoked", value: revoked, color: "hsl(0, 84%, 60%)" },
    ];
  }, [certificates]);

  // Summary stats
  const stats = useMemo(() => ({
    totalCertificates: certificates.length,
    validCertificates: certificates.filter((c) => !c.revoked).length,
    revokedCertificates: certificates.filter((c) => c.revoked).length,
    totalInstitutions: institutions.length,
    authorizedInstitutions: institutions.filter((i) => i.isAuthorized).length,
    thisMonthIssued: certificates.filter((c) => {
      const timestamp = typeof c.issuedAt === "bigint" ? Number(c.issuedAt) : c.issuedAt;
      const date = new Date(timestamp * 1000);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
  }), [certificates, institutions]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCertificates}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.thisMonthIssued} this month
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valid Certificates</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.validCertificates}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCertificates > 0 
                ? `${((stats.validCertificates / stats.totalCertificates) * 100).toFixed(1)}% of total`
                : "No certificates yet"
              }
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revoked</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.revokedCertificates}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCertificates > 0 
                ? `${((stats.revokedCertificates / stats.totalCertificates) * 100).toFixed(1)}% of total`
                : "No revocations"
              }
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Institutions</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.authorizedInstitutions}</div>
            <p className="text-xs text-muted-foreground">
              authorized to issue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issuance Trends */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Issuance Trends
            </CardTitle>
            <CardDescription>
              Monthly certificate issuance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {issuanceTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={issuanceTrends}>
                  <defs>
                    <linearGradient id="colorIssued" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="issued"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorIssued)"
                    strokeWidth={2}
                    name="Issued"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Institution Activity */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Institution Activity
            </CardTitle>
            <CardDescription>
              Certificates issued by institution
            </CardDescription>
          </CardHeader>
          <CardContent>
            {institutionActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={institutionActivity} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    allowDecimals={false}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    width={100}
                    tickFormatter={(value) => value.length > 15 ? value.slice(0, 15) + "..." : value}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar 
                    dataKey="certificates" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]}
                    name="Certificates"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No institution data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Verification Stats Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Certificate Status
            </CardTitle>
            <CardDescription>
              Valid vs revoked certificates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {certificates.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={verificationStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {verificationStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No certificates to analyze
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Insights</CardTitle>
            <CardDescription>
              Key metrics at a glance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-sm text-muted-foreground">Avg. Certificates/Institution</p>
                <p className="text-2xl font-bold text-primary">
                  {stats.authorizedInstitutions > 0 
                    ? (stats.totalCertificates / stats.authorizedInstitutions).toFixed(1)
                    : "0"
                  }
                </p>
              </div>
              <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/10">
                <p className="text-sm text-muted-foreground">Validity Rate</p>
                <p className="text-2xl font-bold text-green-500">
                  {stats.totalCertificates > 0 
                    ? `${((stats.validCertificates / stats.totalCertificates) * 100).toFixed(1)}%`
                    : "N/A"
                  }
                </p>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                <p className="text-sm text-muted-foreground">This Month's Issuance</p>
                <p className="text-2xl font-bold text-blue-500">
                  {stats.thisMonthIssued}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <p className="text-sm text-muted-foreground">Active Institutions</p>
                <p className="text-2xl font-bold text-amber-500">
                  {stats.authorizedInstitutions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
