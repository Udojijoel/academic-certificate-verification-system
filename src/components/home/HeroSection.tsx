import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheckIcon, BlockchainIcon } from "@/components/icons/BlockchainIcon";
import { ArrowRight, Search, Upload } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 blockchain-grid opacity-30" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 right-10 md:right-20 animate-float opacity-20">
        <BlockchainIcon className="w-24 h-24 text-primary" />
      </div>
      <div className="absolute bottom-32 left-10 md:left-20 animate-float opacity-20" style={{ animationDelay: '2s' }}>
        <ShieldCheckIcon className="w-20 h-20 text-accent" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground">
              Powered by Polygon Network
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up">
            <span className="text-foreground">Secure your</span>
            <br />
            <span className="gradient-text">Certificates on Blockchain</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Eliminate certificate fraud with blockchain-verified credentials. 
            Issue, store, and verify academic certificates as immutable NFTs.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/verify">
              <Button variant="hero" size="xl" className="w-full sm:w-auto group">
                <Search className="w-5 h-5" />
                Verify Certificate
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/institution">
              <Button variant="hero-outline" size="xl" className="w-full sm:w-auto">
                <Upload className="w-5 h-5" />
                Issue Certificates
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 mt-16 md:mt-20 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            {[
              { value: "10K+", label: "Certificates Issued" },
              { value: "500+", label: "Institutions" },
              { value: "100%", label: "Verified" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-2xl sm:text-3xl md:text-4xl font-bold gradient-text">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
