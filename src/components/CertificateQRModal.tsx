import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check, Share2 } from "lucide-react";
import { toast } from "sonner";

interface CertificateQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenId: string;
  certificateName?: string;
  baseUrl?: string;
}

export function CertificateQRModal({
  open,
  onOpenChange,
  tokenId,
  certificateName = "Certificate",
  baseUrl = window.location.origin,
}: CertificateQRModalProps) {
  const [copied, setCopied] = useState(false);
  
  const verifyUrl = `${baseUrl}/verify?tokenId=${tokenId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      toast.success("Verification link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleDownload = () => {
    const svg = document.getElementById("certificate-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = `certificate-${tokenId}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success("QR code downloaded!");
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Verify ${certificateName}`,
          text: `Scan to verify this blockchain certificate`,
          url: verifyUrl,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Certificate QR Code</DialogTitle>
          <DialogDescription className="text-center">
            Scan this code to verify the certificate on any device
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          {/* QR Code */}
          <div className="p-4 bg-white rounded-2xl shadow-lg">
            <QRCodeSVG
              id="certificate-qr-code"
              value={verifyUrl}
              size={200}
              level="H"
              includeMargin
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>

          {/* Token Info */}
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">Token ID</p>
            <p className="font-mono font-semibold text-lg">#{tokenId}</p>
          </div>

          {/* URL Preview */}
          <div className="w-full p-3 bg-secondary/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Verification URL</p>
            <p className="text-sm font-mono break-all">{verifyUrl}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 justify-center w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
