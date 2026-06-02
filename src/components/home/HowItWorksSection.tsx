import { Upload, FileCheck, Link2, ShieldCheck } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: <Upload className="w-6 h-6" />,
    title: "Upload Certificate",
    description: "Institution uploads PDF/JPEG certificate to the platform",
  },
  {
    step: "02",
    icon: <FileCheck className="w-6 h-6" />,
    title: "Hash & Store",
    description: "Certificate is hashed (SHA-256) and stored on IPFS",
  },
  {
    step: "03",
    icon: <Link2 className="w-6 h-6" />,
    title: "Mint NFT",
    description: "Unique NFT is minted on Polygon with certificate metadata",
  },
  {
    step: "04",
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Verify Anytime",
    description: "Anyone can verify authenticity through hash comparison",
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="py-20 md:py-32 bg-card/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 blockchain-grid opacity-20" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            A simple four-step process to issue and verify academic credentials
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {steps.map((item, index) => (
              <div
                key={item.step}
                className="relative flex gap-4 p-6 rounded-2xl glass-card group hover:border-primary/50 transition-all duration-300"
              >
                {/* Step Number */}
                <div className="shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-primary-foreground font-display font-bold">
                    {item.step}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-primary">{item.icon}</span>
                    <h3 className="font-display text-lg font-semibold">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {item.description}
                  </p>
                </div>

                {/* Connector Line (Desktop) */}
                {index < steps.length - 1 && index % 2 === 0 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
