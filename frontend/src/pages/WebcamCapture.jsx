import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, RefreshCw, Check, X } from "lucide-react";

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user",
};

function WebcamCapture({ onCapture, onClose }) {
  const webcamRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);

  // 1. Photo Capture Handler
  const capture = useCallback(() => {
    const imageBase64 = webcamRef.current.getScreenshot();
    setImageSrc(imageBase64);
  }, [webcamRef]);

  // 2. Base64 String ko File Object me Convert karna (Backend Multer upload ke liye)
  const urlToFile = async (url, filename, mimeType) => {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    return new File([buf], filename, { type: mimeType });
  };

  // 3. Confirm Selected Photo
  const handleConfirm = async () => {
    if (!imageSrc) return;
    const file = await urlToFile(imageSrc, `visitor_${Date.now()}.jpg`, "image/jpeg");
    onCapture(file, imageSrc); // Pass file object and preview URL
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161b22] border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Camera size={18} className="text-purple-400" />
            Capture Live Photo
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 flex flex-col items-center justify-center bg-black/40">
          {!imageSrc ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-800 bg-black flex items-center justify-center">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-purple-500/50">
              <img src={imageSrc} alt="Captured" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-800 flex items-center justify-between bg-[#161b22]">
          {!imageSrc ? (
            <button
              type="button"
              onClick={capture}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition flex items-center justify-center gap-2"
            >
              <Camera size={18} />
              Take Snapshot
            </button>
          ) : (
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => setImageSrc(null)}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Retake
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition flex items-center justify-center gap-2"
              >
                <Check size={16} />
                Use Photo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WebcamCapture;