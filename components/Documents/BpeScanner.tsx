import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, QrCode, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface BpeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const BpeScanner: React.FC<BpeScannerProps> = ({ onScanSuccess, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ],
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );
    
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        // Success callback
        console.log("QR Code scanned:", decodedText);
        
        // Basic Validation: BP-e URL usually contains 'sefa' or 'receita' or consists of 44 digits key
        // But for now, let's just accept and pass to parent
        onScanSuccess(decodedText);
        
        scanner.clear();
      },
      (errorMessage) => {
        // Error callback (scanning...)
        // console.warn("Scan error:", errorMessage); 
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 bg-black/90 z-[300] flex flex-col items-center justify-center p-4">
       <button 
         onClick={onClose}
         className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors"
       >
         <X size={24} />
       </button>

       <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 bg-slate-900 text-white flex items-center gap-3">
             <QrCode className="text-emerald-400" />
             <div>
               <h3 className="font-bold">Leitor Fiscal (BP-e / NFC-e)</h3>
               <p className="text-xs text-slate-400">Aponte para o QR Code do Bilhete ou Nota</p>
             </div>
          </div>
          
          <div className="p-4 bg-black">
             <div id="reader" className="w-full"></div>
          </div>

          <div className="p-4 bg-slate-50 text-xs text-slate-500 text-center border-t border-slate-200">
             <p className="flex items-center justify-center gap-2">
               <CheckCircle2 size={12} className="text-emerald-500" /> Posicione o código no centro do quadrado
             </p>
          </div>
       </div>
    </div>
  );
};
