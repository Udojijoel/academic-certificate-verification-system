import { AlertTriangle } from "lucide-react";
import { DEMO_MODE } from "@/lib/constants";

export const DemoModeBanner = () => {
  if (!DEMO_MODE) return null;

  return (
    <div className="fixed top-16 md:top-20 left-0 right-0 z-40 bg-accent/90 backdrop-blur-sm text-accent-foreground py-2 px-4 text-center">
      <div className="container mx-auto flex items-center justify-center gap-2 text-sm">
        <AlertTriangle className="w-4 h-4" />
        <span>
          <strong>Demo Mode:</strong> Blockchain interactions are simulated. Deploy your smart contract to enable real transactions.
        </span>
      </div>
    </div>
  );
};
