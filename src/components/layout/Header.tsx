import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BlockchainIcon } from "@/components/icons/BlockchainIcon";
import { Menu, X, Wallet, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWalletContext } from "@/contexts/WalletContext";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/verify", label: "Verify" },
  { href: "/institution", label: "Institution" },
  { href: "/student", label: "My Certificates" },
  { href: "/transparency", label: "Transparency" },
  { href: "/admin", label: "Admin" },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const wallet = useWalletContext();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <BlockchainIcon className="w-8 h-8 text-primary transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-display text-xl font-bold gradient-text">
              CertChain
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                  location.pathname === link.href
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Wallet Button */}
          <div className="hidden md:block">
            {wallet.isConnected ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-sm font-mono text-primary">
                    {wallet.formatAddress(wallet.address!)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={wallet.disconnect}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                variant="wallet"
                onClick={wallet.connect}
                disabled={wallet.isConnecting}
                className="gap-2"
              >
                {wallet.isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    Connect Wallet
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-slide-up">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    location.pathname === link.href
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              
              {wallet.isConnected ? (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <span className="text-sm font-mono text-primary">
                      {wallet.formatAddress(wallet.address!)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={wallet.disconnect}
                    className="w-full"
                  >
                    Disconnect Wallet
                  </Button>
                </div>
              ) : (
                <Button
                  variant="wallet"
                  onClick={wallet.connect}
                  disabled={wallet.isConnecting}
                  className="mt-2 gap-2"
                >
                  {wallet.isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4" />
                      Connect Wallet
                    </>
                  )}
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
