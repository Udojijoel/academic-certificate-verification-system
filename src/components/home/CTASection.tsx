import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, GraduationCap } from "lucide-react";

export const CTASection = () => {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* For Institutions */}
            <div className="p-8 md:p-10 rounded-2xl glass-card border-primary/20 hover:border-primary/40 transition-all duration-300 group">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <Building2 className="w-8 h-8" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-3">
                For Institutions
              </h3>
              <p className="text-muted-foreground mb-6">
                Issue tamper-proof digital certificates to your students. 
                Join 500+ institutions already using CertChain.
              </p>
              <Link to="/institution">
                <Button variant="hero" className="group/btn">
                  Get Started
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </Link>
            </div>

            {/* For Students */}
            <div className="p-8 md:p-10 rounded-2xl glass-card border-accent/20 hover:border-accent/40 transition-all duration-300 group">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-3">
                For Students
              </h3>
              <p className="text-muted-foreground mb-6">
                Access your verified credentials anytime, anywhere. 
                Share with employers instantly.
              </p>
              <Link to="/student">
                <Button variant="gold" className="group/btn">
                  View Certificates
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
