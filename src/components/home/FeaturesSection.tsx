import { ShieldCheckIcon, BlockchainIcon, NFTIcon, CertificateIcon } from "@/components/icons/BlockchainIcon";
import { Zap, Globe, Lock, QrCode } from "lucide-react";

const features = [
  {
    icon: <ShieldCheckIcon className="w-8 h-8" />,
    title: "Tamper-Proof",
    description: "Certificates stored on blockchain cannot be altered or forged. Every credential is cryptographically secured.",
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Instant Verification",
    description: "Verify any certificate in seconds without contacting the issuing institution.",
  },
  {
    icon: <NFTIcon className="w-8 h-8" />,
    title: "NFT Credentials",
    description: "Each certificate is minted as a unique NFT, providing undeniable proof of ownership.",
  },
  {
    icon: <Globe className="w-8 h-8" />,
    title: "Global Access",
    description: "Verify credentials from anywhere in the world with just an internet connection.",
  },
  {
    icon: <Lock className="w-8 h-8" />,
    title: "Privacy First",
    description: "Students control their credentials. Share only what you want, when you want.",
  },
  {
    icon: <QrCode className="w-8 h-8" />,
    title: "QR Verification",
    description: "Scan QR codes for instant mobile verification of any certificate.",
  },
];

export const FeaturesSection = () => {
  return (
    <section className="py-20 md:py-32 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Why <span className="gradient-text">CertChain</span>?
          </h2>
          <p className="text-muted-foreground text-lg">
            Built on cutting-edge blockchain technology to solve the global 
            problem of credential fraud.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-6 md:p-8 rounded-2xl glass-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-5 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>

              {/* Content */}
              <h3 className="font-display text-xl font-semibold mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
