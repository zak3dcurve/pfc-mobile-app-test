import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

export const SignaturePad = ({ onSave }) => {
  const sigPad = useRef(null);

  const handleSave = () => {
    const signature = sigPad.current.toDataURL();
    onSave(signature);
  };

  return (
    <div>
      <SignatureCanvas ref={sigPad} penColor="black" canvasProps={{ width: 500, height: 200 }} />
      <button onClick={handleSave}>Save Signature</button>
    </div>
  );
};