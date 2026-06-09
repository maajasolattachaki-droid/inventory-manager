import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    let stopped = false;

    (async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (!devices.length) {
          setError("No camera found on this device.");
          return;
        }
        const deviceId = devices[devices.length - 1].deviceId;
        setScanning(true);

        await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current!,
          (result, err) => {
            if (stopped) return;
            if (result) {
              onScan(result.getText());
              stopped = true;
            }
          }
        );
      } catch (e: any) {
        if (!stopped) setError(e?.message || "Camera access denied.");
      }
    })();

    return () => {
      stopped = true;
      try {
        BrowserMultiFormatReader.releaseAllStreams();
      } catch {}
    };
  }, [onScan]);

  return (
    <div className="flex flex-col items-center gap-4">
      {error ? (
        <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
          {error}
        </div>
      ) : (
        <div className="relative w-full rounded-lg overflow-hidden bg-black aspect-video">
          <video ref={videoRef} className="w-full h-full object-cover" />
          {scanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-green-400 rounded w-48 h-20 opacity-80" />
            </div>
          )}
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        {error ? "Use manual entry below." : "Point the camera at a barcode to scan it."}
      </p>
      <Button variant="outline" size="sm" onClick={onClose} className="gap-2">
        <X className="h-4 w-4" /> Close Scanner
      </Button>
    </div>
  );
}

interface BarcodeScanButtonProps {
  onScan: (code: string) => void;
}

export function BarcodeScanButton({ onScan }: BarcodeScanButtonProps) {
  const [open, setOpen] = useState(false);

  const handleScan = (code: string) => {
    onScan(code);
    setOpen(false);
  };

  if (open) {
    return (
      <div className="border border-border rounded-lg p-4 bg-gray-50">
        <BarcodeScanner onScan={handleScan} onClose={() => setOpen(false)} />
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setOpen(true)}
      className="gap-2 text-primary border-primary/30 hover:bg-primary/5"
    >
      <Camera className="h-4 w-4" />
      Scan Barcode
    </Button>
  );
}
