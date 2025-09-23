import { useRef, useEffect, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { useIsMobile } from "@/hooks/use-mobile";

export const SignaturePad = ({ onSave, onClear }) => {
  const sigPad = useRef(null);
  const containerRef = useRef(null);
  const isMobile = useIsMobile();
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 200 });

  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const width = container.offsetWidth - 4; // Account for border
        const height = isMobile ? 120 : 160;
        setCanvasSize({ width, height });
      }
    };

    // Update size on mount and window resize
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [isMobile]);

  const handleSave = () => {
    if (sigPad.current) {
      const signature = sigPad.current.toDataURL();
      onSave(signature);
    }
  };

  const handleClear = () => {
    if (sigPad.current) {
      sigPad.current.clear();
    }
    // Add haptic feedback on mobile
    if (isMobile && navigator.vibrate) {
      navigator.vibrate(50);
    }
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className="w-full" ref={containerRef}>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-gray-50 touch-manipulation">
        <SignatureCanvas
          ref={sigPad}
          penColor="black"
          canvasProps={{
            width: canvasSize.width,
            height: canvasSize.height,
            className: "w-full border border-gray-200 rounded bg-white touch-none",
            style: { touchAction: 'none' }
          }}
          backgroundColor="rgba(255,255,255,0)"
          velocityFilterWeight={0.7}
          minWidth={isMobile ? 1 : 0.5}
          maxWidth={isMobile ? 3 : 2.5}
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-2 mt-3">
        <button
          onClick={handleClear}
          className="w-full sm:w-auto px-4 py-2 text-sm text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-md transition-colors duration-200 font-medium"
        >
          Clear Signature
        </button>
        <button
          onClick={handleSave}
          className="w-full sm:w-auto px-4 py-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200 font-medium"
        >
          Save Signature
        </button>
      </div>
    </div>
  );
};