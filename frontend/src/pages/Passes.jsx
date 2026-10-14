import React, { useEffect, useState } from "react";
import axios from "../axios";

const getAuthHeader = () => {
    try {
        const userData = JSON.parse(localStorage.getItem("user"));

        return userData?.token
            ? { Authorization: `Bearer ${userData.token}` }
            : {};
    } catch {
        return {};
    }
};

const Passes = () => {
    const [passes, setPasses] = useState([]);
    const [appointments, setAppointments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showQR, setShowQR] = useState(null);

    const [form, setForm] = useState({
        appointment: "",
        validFrom: "",
        validUntil: "",
    });

    const [message, setMessage] = useState("");

    // =========================
    // CURRENT USER
    // =========================

    let currentUser = null;

    try {
        currentUser = JSON.parse(
            localStorage.getItem("user")
        );
    } catch {
        currentUser = null;
    }

    const isAdmin =
        currentUser?.role === "admin" ||
        currentUser?.user?.role === "admin";

    // =========================
    // FETCH PASSES
    // =========================

    const fetchPasses = async () => {
        try {
            setLoading(true);

            const res = await axios.get("/api/pass", {
                headers: getAuthHeader(),
            });

            setPasses(res.data);
        } catch (error) {
            console.log("Pass fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // FETCH APPOINTMENTS
    // =========================

    const fetchAppointments = async () => {
        try {
            const res = await axios.get(
                "/api/appointment",
                {
                    headers: getAuthHeader(),
                }
            );

            setAppointments(res.data);
        } catch (error) {
            console.log(
                "Appointment fetch error:",
                error
            );
        }
    };

    // =========================
    // INITIAL LOAD
    // =========================

    useEffect(() => {
        fetchPasses();
        fetchAppointments();
    }, []);

    // =========================
    // FORM CHANGE
    // =========================

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "appointment") {
            const selectedAppointment = appointments.find(
                (appointment) => appointment._id === value
            );

            if (selectedAppointment) {
                const visitDate = new Date(
                    selectedAppointment.visitDate
                );

                const validFrom = new Date(visitDate);

                // Pass valid for 8 hours from appointment time
                const validUntil = new Date(
                    visitDate.getTime() + 8 * 60 * 60 * 1000
                );

                const toLocalDateTime = (date) => {
                    const offset =
                        date.getTimezoneOffset() * 60000;

                    return new Date(
                        date.getTime() - offset
                    )
                        .toISOString()
                        .slice(0, 16);
                };

                setForm({
                    ...form,
                    appointment: value,
                    validFrom: toLocalDateTime(validFrom),
                    validUntil: toLocalDateTime(validUntil),
                });

                return;
            }
        }

        setForm({
            ...form,
            [name]: value,
        });
    };

    // =========================
    // APPROVED APPOINTMENTS
    // =========================

    const approvedAppointments =
        appointments.filter(
            (appointment) =>
                appointment.status === "Approved"
        );

    // =========================
    // CREATE PASS
    // =========================

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setMessage("");

            const selectedAppointment =
                appointments.find(
                    (appointment) =>
                        appointment._id ===
                        form.appointment
                );

            if (!selectedAppointment) {
                setMessage(
                    "Please select an appointment."
                );
                return;
            }

            const data = {
                visitor:
                    selectedAppointment.visitor._id,

                appointment:
                    selectedAppointment._id,

                validFrom: form.validFrom,

                validUntil: form.validUntil,
            };
            if (
                new Date(form.validUntil) <=
                new Date(form.validFrom)
            ) {
                setMessage(
                    "Valid Until must be later than Valid From."
                );
                return;
            }

            await axios.post(
                "/api/pass",
                data,
                {
                    headers: {
                        ...getAuthHeader(),
                        "Content-Type":
                            "application/json",
                    },
                }
            );

            setMessage(
                "Pass created successfully."
            );

            setForm({
                appointment: "",
                validFrom: "",
                validUntil: "",
            });

            await fetchPasses();

            setTimeout(() => {
                setShowModal(false);
                setMessage("");
            }, 700);

        } catch (error) {
            console.log(
                "Create pass error:",
                error
            );

            setMessage(
                error.response?.data?.error ||
                error.response?.data?.message ||
                "Failed to create pass."
            );
        }
    };

    // =========================
    // DOWNLOAD PDF
    // =========================

    const downloadPDF = async (passId, passNumber) => {
    try {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        const token = storedUser?.token;

        if (!token) {
            alert("Session expired. Please login again.");
            return;
        }

       const response = await axios.get(
    `/api/pass/${passId}/pdf`,
    {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
    }
);

        const blob = new Blob([response.data], {
            type: "application/pdf",
        });

        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `${passNumber}.pdf`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error("PDF DOWNLOAD ERROR:", error);

        if (error.response?.data instanceof Blob) {
            const text = await error.response.data.text();
            console.error("Backend error:", text);
        }

        alert("PDF download failed");
    }
};
    // =========================
    // CANCEL PASS
    // =========================

    const cancelPass = async (id) => {
        const confirmCancel =
            window.confirm(
                "Cancel this pass?"
            );

        if (!confirmCancel) return;

        try {
            await axios.patch(
                `/api/pass/${id}/cancel`,
                {},
                {
                    headers: getAuthHeader(),
                }
            );

            await fetchPasses();

        } catch (error) {
            console.log(
                "Cancel pass error:",
                error
            );

            setMessage(
                error.response?.data?.error ||
                "Failed to cancel pass."
            );
        }
    };

    // =========================
    // FORMAT DATE
    // =========================

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleString(
            "en-IN",
            {
                dateStyle: "medium",
                timeStyle: "short",
            }
        );
    };

    // =========================
    // STATUS STYLE
    // =========================

    const getStatusClass = (status) => {
        if (status === "Active") {
            return "bg-green-500/10 text-green-400";
        }

        if (status === "Used") {
            return "bg-blue-500/10 text-blue-400";
        }

        if (status === "Cancelled") {
            return "bg-red-500/10 text-red-400";
        }

        return "bg-yellow-500/10 text-yellow-400";
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-white p-6">

            {/* =========================
          HEADER
      ========================= */}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

                <div>
                    <h1 className="text-2xl font-bold">
                        Visitor Passes
                    </h1>

                    <p className="text-gray-400 text-sm mt-1">
                        Issue and manage visitor passes
                    </p>
                </div>

                <button
                    onClick={() => {
                        setMessage("");
                        setShowModal(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 px-5 py-2.5 rounded-xl font-medium transition"
                >
                    + Issue Pass
                </button>

            </div>

            {/* =========================
          TABLE
      ========================= */}

            <div className="bg-[#111113] border border-gray-800 rounded-2xl overflow-hidden">

                {loading ? (
                    <div className="p-10 text-center text-gray-400">
                        Loading passes...
                    </div>
                ) : passes.length === 0 ? (
                    <div className="p-10 text-center text-gray-400">
                        No passes issued yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">

                        <table className="w-full text-sm">

                            <thead className="bg-[#18181b] border-b border-gray-800">

                                <tr className="text-left text-gray-400">

                                    <th className="px-5 py-4">
                                        Pass Number
                                    </th>

                                    <th className="px-5 py-4">
                                        Visitor
                                    </th>

                                    <th className="px-5 py-4">
                                        Host
                                    </th>

                                    <th className="px-5 py-4">
                                        Valid From
                                    </th>

                                    <th className="px-5 py-4">
                                        Valid Until
                                    </th>

                                    <th className="px-5 py-4">
                                        Status
                                    </th>

                                    <th className="px-5 py-4">
                                        Action
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {passes.map((pass) => (

                                    <tr
                                        key={pass._id}
                                        className="border-b border-gray-800 hover:bg-[#18181b] transition"
                                    >

                                        {/* PASS NUMBER */}

                                        <td className="px-5 py-4">

                                            <div className="font-semibold text-purple-300">
                                                {pass.passNumber}
                                            </div>

                                        </td>

                                        {/* VISITOR */}

                                        <td className="px-5 py-4">

                                            <div className="font-medium">
                                                {pass.visitor?.name ||
                                                    "-"}
                                            </div>

                                            <div className="text-xs text-gray-500">
                                                {pass.visitor?.mobile ||
                                                    ""}
                                            </div>

                                        </td>

                                        {/* HOST */}

                                        <td className="px-5 py-4">

                                            <div>
                                                {pass.appointment?.host
                                                    ?.name || "-"}
                                            </div>

                                        </td>

                                        {/* VALID FROM */}

                                        <td className="px-5 py-4 text-gray-300">
                                            {formatDate(
                                                pass.validFrom
                                            )}
                                        </td>

                                        {/* VALID UNTIL */}

                                        <td className="px-5 py-4 text-gray-300">
                                            {formatDate(
                                                pass.validUntil
                                            )}
                                        </td>

                                        {/* STATUS */}

                                        <td className="px-5 py-4">

                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(
                                                    pass.status
                                                )}`}
                                            >
                                                {pass.status}
                                            </span>

                                        </td>

                                        {/* ACTION */}

                                        <td className="px-5 py-4">

                                            <div className="flex flex-wrap gap-2">

                                                {/* QR */}

                                                {pass.qrCode && (
                                                    <button
                                                        onClick={() =>
                                                            setShowQR(
                                                                pass
                                                            )
                                                        }
                                                        className="px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 text-xs"
                                                    >
                                                        QR
                                                    </button>
                                                )}

                                                {/* PDF */}

                                               <button
  type="button"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();

    downloadPDF(pass._id, pass.passNumber);
  }}
  className="px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 text-xs"
>
  Download PDF
</button>

                                                {/* CANCEL */}

                                                {isAdmin &&
                                                    pass.status ===
                                                    "Active" && (
                                                        <button
                                                            onClick={() =>
                                                                cancelPass(
                                                                    pass._id
                                                                )
                                                            }
                                                            className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-300 hover:bg-red-600/30 text-xs"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}

                                            </div>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

            {/* =========================
          ISSUE PASS MODAL
      ========================= */}

            {showModal && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

                    <div className="bg-[#111113] border border-gray-800 rounded-2xl w-full max-w-lg p-6">

                        {/* HEADER */}

                        <div className="flex items-center justify-between mb-6">

                            <div>

                                <h2 className="text-xl font-bold">
                                    Issue Visitor Pass
                                </h2>

                                <p className="text-gray-400 text-sm mt-1">
                                    Create a pass for an approved appointment
                                </p>

                            </div>

                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setMessage("");
                                }}
                                className="text-gray-400 hover:text-white text-xl"
                            >
                                ×
                            </button>

                        </div>

                        {/* FORM */}

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4"
                        >

                            {/* APPROVED APPOINTMENT */}

                            <div>

                                <label className="block text-sm text-gray-400 mb-1">
                                    Approved Appointment
                                </label>

                                <select
                                    name="appointment"
                                    value={form.appointment}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-[#18181b] border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                                >

                                    <option value="">
                                        Select Appointment
                                    </option>

                                    {approvedAppointments.map(
                                        (appointment) => (

                                            <option
                                                key={appointment._id}
                                                value={appointment._id}
                                            >
                                                {appointment.visitor?.name ||
                                                    "Visitor"}{" "}
                                                -{" "}
                                                {formatDate(
                                                    appointment.visitDate
                                                )}
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>

                            {/* VALID FROM */}

                            <div>

                                <label className="block text-sm text-gray-400 mb-1">
                                    Valid From
                                </label>

                                <input
                                    type="datetime-local"
                                    name="validFrom"
                                    value={form.validFrom}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-[#18181b] border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                                />

                            </div>

                            {/* VALID UNTIL */}

                            <div>

                                <label className="block text-sm text-gray-400 mb-1">
                                    Valid Until
                                </label>

                                <input
                                    type="datetime-local"
                                    name="validUntil"
                                    value={form.validUntil}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-[#18181b] border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                                />

                            </div>

                            {/* MESSAGE */}

                            {message && (

                                <div className="bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-xl px-4 py-3 text-sm">
                                    {message}
                                </div>

                            )}

                            {/* BUTTONS */}

                            <div className="flex gap-3 pt-2">

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setMessage("");
                                    }}
                                    className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-xl"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 py-3 rounded-xl font-medium"
                                >
                                    Issue Pass
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

            {/* =========================
          QR MODAL
      ========================= */}

            {showQR && (

                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">

                    <div className="bg-[#111113] border border-gray-800 rounded-2xl p-6 w-full max-w-sm text-center">

                        <div className="flex justify-between items-center mb-5">

                            <div>
                                <h2 className="text-lg font-bold">
                                    Visitor QR Pass
                                </h2>

                                <p className="text-sm text-gray-400">
                                    {showQR.passNumber}
                                </p>
                            </div>

                            <button
                                onClick={() =>
                                    setShowQR(null)
                                }
                                className="text-gray-400 hover:text-white text-xl"
                            >
                                ×
                            </button>

                        </div>

                        <div className="bg-white p-4 rounded-xl inline-block">

                            <img
                                src={showQR.qrCode}
                                alt="Visitor Pass QR Code"
                                className="w-56 h-56"
                            />

                        </div>

                        <div className="mt-5">

                            <p className="font-semibold">
                                {showQR.visitor?.name}
                            </p>

                            <p className="text-sm text-gray-400 mt-1">
                                {showQR.visitor?.mobile}
                            </p>

                        </div>

                        <button
                            onClick={() =>
                                downloadPDF(
                                    showQR._id,
                                    showQR.passNumber
                                )
                            }
                            className="w-full mt-5 bg-purple-600 hover:bg-purple-700 py-3 rounded-xl font-medium"
                        >
                            Download PDF
                        </button>

                    </div>

                </div>

            )}

        </div>
    );
};

export default Passes;