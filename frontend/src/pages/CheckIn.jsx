import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";
import axios from "../axios";

// ======================================================
// AUTH HEADER
// ======================================================

const getAuthHeader = () => {
  try {
    const userData = JSON.parse(localStorage.getItem("user"));

    return userData?.token
      ? {
          Authorization: `Bearer ${userData.token}`,
        }
      : {};
  } catch {
    return {};
  }
};

// ======================================================
// COMPONENT
// ======================================================

const CheckIn = () => {
  // Scanner refs
  const scannerRef = useRef(null);
  const scannerStartingRef = useRef(false);
  const startTimerRef = useRef(null);
  const mountedRef = useRef(true);

  // States
  const [scannedData, setScannedData] = useState("");
  const [manualPassNumber, setManualPassNumber] = useState("");

  const [currentPass, setCurrentPass] = useState(null);
  const [visitor, setVisitor] = useState(null);
  const [checkLog, setCheckLog] = useState(null);

  const [loading, setLoading] = useState(false);
  const [scannerError, setScannerError] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // ======================================================
  // MESSAGE
  // ======================================================

  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  // ======================================================
  // STOP SCANNER
  // ======================================================

  const stopScanner = useCallback(async () => {
    // Cancel pending start
    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }

    const scanner = scannerRef.current;

    if (!scanner) {
      scannerStartingRef.current = false;
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch (error) {
      console.log("Scanner stop error:", error);
    }

    try {
      await scanner.clear();
    } catch (error) {
      // Ignore clear errors
    }

    if (scannerRef.current === scanner) {
      scannerRef.current = null;
    }

    scannerStartingRef.current = false;

    // Clear scanner DOM
    const reader = document.getElementById("qr-reader");

    if (reader) {
      reader.innerHTML = "";
    }
  }, []);

  // ======================================================
  // HANDLE QR RESULT
  // ======================================================

  const handleScannedQR = useCallback(
    async (decodedText) => {
      if (!decodedText) {
        showMessage("Invalid QR code.", "error");
        return;
      }

      const text = decodedText.trim();

      console.log("QR DETECTED:", text);

      setScannedData(text);

      let passNumber = text;

      // Current QR contains JSON
      try {
        const qrData = JSON.parse(text);

        if (qrData?.passNumber) {
          passNumber = qrData.passNumber;
        } else if (qrData?.passId) {
          await getPassDetails(qrData.passId);
          return;
        }
      } catch {
        // Not JSON, so use text directly as pass number
      }

      if (!passNumber) {
        showMessage("Invalid QR code.", "error");
        return;
      }

      await findPassByNumber(passNumber);
    },
    []
  );

  // ======================================================
  // START SCANNER
  // ======================================================

  const startScanner = useCallback(() => {
    // Already running/starting
    if (
      scannerRef.current ||
      scannerStartingRef.current
    ) {
      return;
    }

    // Clear previous timer
    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current);
    }

    // Small delay prevents React StrictMode
    // from creating duplicate camera instances
    startTimerRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;

      const reader = document.getElementById("qr-reader");

      if (!reader) return;

      if (
        scannerRef.current ||
        scannerStartingRef.current
      ) {
        return;
      }

      scannerStartingRef.current = true;

      try {
        reader.innerHTML = "";

        const scanner = new Html5Qrcode(
          "qr-reader",
          {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
            ],
          }
        );

        scannerRef.current = scanner;

        await scanner.start(
          {
            facingMode: "environment",
          },
          {
            fps: 10,

            // Small QR box
            qrbox: {
              width: 200,
              height: 200,
            },

            aspectRatio: 1,
          },
          async (decodedText) => {
            if (!mountedRef.current) return;

            console.log(
              "QR FOUND:",
              decodedText
            );

            // Stop scanner immediately
            try {
              if (scanner.isScanning) {
                await scanner.stop();
              }
            } catch (error) {
              console.log(
                "Stop after scan error:",
                error
              );
            }

            try {
              await scanner.clear();
            } catch {}

            if (
              scannerRef.current === scanner
            ) {
              scannerRef.current = null;
            }

            scannerStartingRef.current = false;

            await handleScannedQR(
              decodedText
            );
          },
          () => {
            // Ignore continuous scan errors
          }
        );

        // Component may have unmounted while camera was starting
        if (!mountedRef.current) {
          try {
            if (scanner.isScanning) {
              await scanner.stop();
            }
          } catch {}

          try {
            await scanner.clear();
          } catch {}

          if (
            scannerRef.current === scanner
          ) {
            scannerRef.current = null;
          }

          scannerStartingRef.current = false;
          return;
        }

        scannerStartingRef.current = false;

        console.log("Camera started");
      } catch (error) {
        console.log(
          "Scanner start error:",
          error
        );

        scannerRef.current = null;
        scannerStartingRef.current = false;

        if (mountedRef.current) {
          setScannerError(
            "Camera start nahi ho paya. Manual Pass Number use karo."
          );
        }
      }
    }, 150);
  }, [handleScannedQR]);

  // ======================================================
  // CAMERA LIFECYCLE
  // ======================================================

  useEffect(() => {
    mountedRef.current = true;

    setScannerError("");

    startScanner();

    return () => {
      mountedRef.current = false;

      if (startTimerRef.current) {
        clearTimeout(
          startTimerRef.current
        );

        startTimerRef.current = null;
      }

      const scanner = scannerRef.current;

      scannerRef.current = null;
      scannerStartingRef.current = false;

      if (scanner) {
        const cleanup = async () => {
          try {
            if (scanner.isScanning) {
              await scanner.stop();
            }
          } catch {}

          try {
            await scanner.clear();
          } catch {}

          const reader =
            document.getElementById(
              "qr-reader"
            );

          if (reader) {
            reader.innerHTML = "";
          }
        };

        cleanup();
      }
    };
  }, [startScanner]);

  // ======================================================
  // FIND PASS BY PASS NUMBER
  // ======================================================

  const findPassByNumber = async (
    passNumber
  ) => {
    try {
      setLoading(true);
      setMessage("");

      const response = await axios.get(
        "/api/pass",
        {
          headers: getAuthHeader(),
        }
      );

      const passes = response.data;

      const pass = passes.find(
        (item) =>
          item.passNumber ===
          passNumber
      );

      if (!pass) {
        showMessage(
          `Pass "${passNumber}" not found.`,
          "error"
        );

        return;
      }

      await processPass(pass);
    } catch (error) {
      console.log(
        "Find pass error:",
        error
      );

      showMessage(
        error.response?.data?.error ||
          "Failed to find pass.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // GET PASS DETAILS
  // ======================================================

  const getPassDetails = async (
    passId
  ) => {
    try {
      setLoading(true);

      const response = await axios.get(
        `/api/pass/${passId}`,
        {
          headers: getAuthHeader(),
        }
      );

      await processPass(
        response.data
      );
    } catch (error) {
      console.log(
        "Get pass error:",
        error
      );

      showMessage(
        error.response?.data?.error ||
          "Pass not found.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // PROCESS PASS
  // ======================================================

  const processPass = async (pass) => {
    if (!pass?._id) {
      showMessage(
        "Invalid pass.",
        "error"
      );

      return;
    }

    // IMPORTANT
    // Store current pass
    setCurrentPass(pass);

    setVisitor(
      pass.visitor || null
    );

    try {
      const response =
        await axios.get(
          "/api/checklog",
          {
            headers:
              getAuthHeader(),
          }
        );

      const logs = response.data;

      const activeLog =
        logs.find(
          (log) =>
            log.pass?._id ===
              pass._id &&
            !log.checkOut
        );

      setCheckLog(
        activeLog || null
      );
    } catch (error) {
      console.log(
        "Check log fetch error:",
        error
      );

      setCheckLog(null);
    }

    showMessage(
      "Pass verified successfully.",
      "success"
    );
  };

  // ======================================================
  // CHECK IN
  // ======================================================

  const handleCheckIn = async () => {
    if (!currentPass?._id) {
      showMessage(
        "Please scan a pass first.",
        "error"
      );

      return;
    }

    try {
      setLoading(true);

      const response =
        await axios.post(
          "/api/checklog/check-in",
          {
            passId:
              currentPass._id,
          },
          {
            headers: {
              ...getAuthHeader(),
              "Content-Type":
                "application/json",
            },
          }
        );

      const log =
        response.data?.checkLog ||
        response.data;

      setCheckLog(log);

      setCurrentPass(
        (previous) =>
          previous
            ? {
                ...previous,
                status: "Active",
              }
            : previous
      );

      showMessage(
        "Visitor checked in successfully.",
        "success"
      );
    } catch (error) {
      console.log(
        "Check-in error:",
        error
      );

      showMessage(
        error.response?.data?.error ||
          "Check-in failed.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // CHECK OUT
  // ======================================================

  const handleCheckOut = async () => {
    if (!currentPass?._id) {
      showMessage(
        "Please scan a pass first.",
        "error"
      );

      return;
    }

    try {
      setLoading(true);

      const response =
        await axios.post(
          "/api/checklog/check-out",
          {
            passId:
              currentPass._id,
          },
          {
            headers: {
              ...getAuthHeader(),
              "Content-Type":
                "application/json",
            },
          }
        );

      const log =
        response.data?.checkLog ||
        response.data;

      setCheckLog(log);

      showMessage(
        "Visitor checked out successfully.",
        "success"
      );
    } catch (error) {
      console.log(
        "Check-out error:",
        error
      );

      showMessage(
        error.response?.data?.error ||
          "Check-out failed.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // MANUAL SEARCH
  // ======================================================

  const handleManualSearch = async () => {
    const passNumber =
      manualPassNumber.trim();

    if (!passNumber) {
      showMessage(
        "Enter Pass Number.",
        "error"
      );

      return;
    }

    await findPassByNumber(
      passNumber
    );
  };

  // ======================================================
  // SCAN ANOTHER
  // ======================================================

  const scanAnother = async () => {
    await stopScanner();

    setScannedData("");
    setManualPassNumber("");
    setCurrentPass(null);
    setVisitor(null);
    setCheckLog(null);
    setMessage("");
    setMessageType("");
    setScannerError("");

    // Start fresh camera
    startScanner();
  };

  // ======================================================
  // FORMAT DATE
  // ======================================================

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(
      date
    ).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-6">

      {/* HEADER */}

      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Check-In / Check-Out
        </h1>

        <p className="text-gray-400 text-sm mt-1">
          Scan a visitor pass QR code to verify entry
        </p>
      </div>

      {/* TOP SECTION */}

      <div className="grid lg:grid-cols-2 gap-6">

        {/* CAMERA */}

        <div className="bg-[#111113] border border-gray-800 rounded-2xl p-6">

          <h2 className="text-lg font-semibold mb-4">
            Scan QR Code
          </h2>

          {/* CAMERA BOX */}

          <div
            id="qr-reader"
            className="w-full max-w-md mx-auto overflow-hidden rounded-xl bg-black"
          />

          {scannerError && (
            <p className="text-yellow-400 text-sm mt-4">
              {scannerError}
            </p>
          )}

          {scannedData && (
            <div className="mt-4 bg-[#18181b] border border-gray-800 rounded-xl p-3">

              <p className="text-xs text-gray-500">
                Scanned Data
              </p>

              <p className="text-sm text-gray-300 break-all mt-1">
                {scannedData}
              </p>

            </div>
          )}

        </div>

        {/* MANUAL VERIFICATION */}

        <div className="bg-[#111113] border border-gray-800 rounded-2xl p-6">

          <h2 className="text-lg font-semibold mb-4">
            Manual Pass Verification
          </h2>

          <div className="flex gap-2">

            <input
              type="text"
              value={manualPassNumber}
              onChange={(e) =>
                setManualPassNumber(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleManualSearch();
                }
              }}
              placeholder="Enter Pass Number"
              className="flex-1 bg-[#18181b] border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-purple-500"
            />

            <button
              type="button"
              onClick={
                handleManualSearch
              }
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-5 rounded-xl font-medium"
            >
              Verify
            </button>

          </div>

          <p className="text-xs text-gray-500 mt-3">
            Example: VP-1790964401131-3BCD9915
          </p>

        </div>

      </div>

      {/* MESSAGE */}

      {message && (
        <div
          className={`mt-6 rounded-xl px-4 py-3 border ${
            messageType === "success"
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {message}
        </div>
      )}

      {/* VISITOR DETAILS */}

      {visitor && (
        <div className="mt-6 bg-[#111113] border border-gray-800 rounded-2xl p-6">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

            <div>

              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Visitor
              </p>

              <h2 className="text-xl font-bold mt-1">
                {visitor.name}
              </h2>

              <p className="text-gray-400 text-sm mt-1">
                {visitor.mobile}
              </p>

              {visitor.email && (
                <p className="text-gray-500 text-sm mt-1">
                  {visitor.email}
                </p>
              )}

              {visitor.company && (
                <p className="text-gray-500 text-sm">
                  {visitor.company}
                </p>
              )}

              {currentPass && (
                <p className="text-purple-400 text-sm mt-2">
                  Pass:{" "}
                  {currentPass.passNumber}
                </p>
              )}

            </div>

            {/* ACTION BUTTONS */}

            <div className="flex gap-3">

              {!checkLog && (
                <button
                  type="button"
                  onClick={
                    handleCheckIn
                  }
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-5 py-2.5 rounded-xl font-medium"
                >
                  {loading
                    ? "Processing..."
                    : "Check In"}
                </button>
              )}

              {checkLog &&
                !checkLog.checkOut && (
                  <button
                    type="button"
                    onClick={
                      handleCheckOut
                    }
                    disabled={loading}
                    className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 px-5 py-2.5 rounded-xl font-medium"
                  >
                    {loading
                      ? "Processing..."
                      : "Check Out"}
                  </button>
                )}

            </div>

          </div>

          {/* LOG DETAILS */}

          {checkLog && (
            <div className="grid md:grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-800">

              <div>
                <p className="text-xs text-gray-500">
                  Check In
                </p>

                <p className="text-sm text-green-400 mt-1">
                  {checkLog.checkIn
                    ? formatDate(
                        checkLog.checkIn
                      )
                    : "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Check Out
                </p>

                <p className="text-sm text-orange-400 mt-1">
                  {checkLog.checkOut
                    ? formatDate(
                        checkLog.checkOut
                      )
                    : "Not checked out"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Status
                </p>

                <p className="text-sm text-purple-400 mt-1">
                  {checkLog.status}
                </p>
              </div>

            </div>
          )}

        </div>
      )}

      {/* SCAN ANOTHER */}

      {(visitor || message) && (
        <button
          type="button"
          onClick={scanAnother}
          className="mt-6 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm"
        >
          Scan Another Pass
        </button>
      )}

    </div>
  );
};

export default CheckIn;