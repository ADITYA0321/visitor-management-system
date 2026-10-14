import React, { useEffect, useState } from "react";
import axios from "../axios";

// =========================
// AUTH HEADER
// =========================
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

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [visitors, setVisitors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [form, setForm] = useState({
    visitor: "",
    visitDate: "",
    purpose: "",
  });

  const [message, setMessage] = useState("");

  // =========================
  // CURRENT USER
  // =========================
  let currentUser = null;

  try {
    currentUser = JSON.parse(localStorage.getItem("user"));
  } catch {
    currentUser = null;
  }

  const currentUserId =
    currentUser?._id ||
    currentUser?.id ||
    currentUser?.user?._id ||
    currentUser?.user?.id;

  const isAdmin =
    currentUser?.role === "admin" ||
    currentUser?.user?.role === "admin";

  // =========================
  // FETCH APPOINTMENTS
  // =========================
  const fetchAppointments = async () => {
    try {
      setLoading(true);

      const res = await axios.get("/api/appointment", {
        headers: getAuthHeader(),
      });

      setAppointments(res.data);
    } catch (error) {
      console.log("Appointment fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FETCH VISITORS
  // =========================
  const fetchVisitors = async () => {
    try {
      const res = await axios.get("/api/visitor", {
        headers: getAuthHeader(),
      });

      setVisitors(res.data.visitors || res.data);
    } catch (error) {
      console.log("Visitor fetch error:", error);
    }
  };

  // =========================
  // INITIAL LOAD
  // =========================
  useEffect(() => {
    fetchAppointments();
    fetchVisitors();
  }, []);

  // =========================
  // FORM CHANGE
  // =========================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // CREATE APPOINTMENT
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setMessage("");

      // Logged-in user automatically becomes Host
      const appointmentData = {
        visitor: form.visitor,
        host: currentUserId,
        visitDate: form.visitDate,
        purpose: form.purpose,
      };

      console.log("Creating appointment:", appointmentData);

      await axios.post(
        "/api/appointment",
        appointmentData,
        {
          headers: {
            ...getAuthHeader(),
            "Content-Type": "application/json",
          },
        }
      );

      setMessage("Appointment created successfully.");

      setForm({
        visitor: "",
        visitDate: "",
        purpose: "",
      });

      await fetchAppointments();

      setTimeout(() => {
        setShowModal(false);
        setMessage("");
      }, 700);
    } catch (error) {
      console.log("Create appointment error:", error);
      console.log(
        "Backend response:",
        error.response?.data
      );

      setMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to create appointment."
      );
    }
  };

  // =========================
  // UPDATE STATUS
  // =========================
  const updateStatus = async (id, status) => {
    try {
      await axios.patch(
        `/api/appointment/${id}/status`,
        { status },
        {
          headers: {
            ...getAuthHeader(),
            "Content-Type": "application/json",
          },
        }
      );

      await fetchAppointments();
    } catch (error) {
      console.log("Status update error:", error);

      setMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to update appointment."
      );
    }
  };

  // =========================
  // DELETE APPOINTMENT
  // =========================
  const deleteAppointment = async (id) => {
    const confirmDelete = window.confirm(
      "Delete this appointment?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(
        `/api/appointment/${id}`,
        {
          headers: getAuthHeader(),
        }
      );

      await fetchAppointments();
    } catch (error) {
      console.log("Delete error:", error);

      setMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to delete appointment."
      );
    }
  };

  // =========================
  // FILTER APPOINTMENTS
  // =========================
  const filteredAppointments =
    appointments.filter((appointment) => {
      const visitorName =
        appointment.visitor?.name?.toLowerCase() || "";

      const hostName =
        appointment.host?.name?.toLowerCase() || "";

      const purpose =
        appointment.purpose?.toLowerCase() || "";

      const searchText = search.toLowerCase();

      const matchesSearch =
        visitorName.includes(searchText) ||
        hostName.includes(searchText) ||
        purpose.includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        appointment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

  // =========================
  // FORMAT DATE
  // =========================
  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-6">

      {/* =========================
          HEADER
      ========================= */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

        <div>
          <h1 className="text-2xl font-bold">
            Appointments
          </h1>

          <p className="text-gray-400 text-sm mt-1">
            Manage visitor appointments and approvals
          </p>
        </div>

        <button
          onClick={() => {
            setMessage("");
            setShowModal(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 px-5 py-2.5 rounded-xl font-medium transition"
        >
          + New Appointment
        </button>

      </div>

      {/* =========================
          SEARCH + FILTER
      ========================= */}

      <div className="bg-[#111113] border border-gray-800 rounded-2xl p-4 mb-6">

        <div className="flex flex-col md:flex-row gap-3">

          <input
            type="text"
            placeholder="Search visitor, host or purpose..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="flex-1 bg-[#18181b] border border-gray-700 rounded-xl px-4 py-2.5 outline-none focus:border-purple-500"
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="bg-[#18181b] border border-gray-700 rounded-xl px-4 py-2.5 outline-none"
          >
            <option value="All">
              All Status
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Approved">
              Approved
            </option>

            <option value="Rejected">
              Rejected
            </option>
          </select>

        </div>

      </div>

      {/* =========================
          TABLE
      ========================= */}

      <div className="bg-[#111113] border border-gray-800 rounded-2xl overflow-hidden">

        {loading ? (
          <div className="p-10 text-center text-gray-400">
            Loading appointments...
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            No appointments found.
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead className="bg-[#18181b] border-b border-gray-800">

                <tr className="text-left text-gray-400">

                  <th className="px-5 py-4">
                    Visitor
                  </th>

                  <th className="px-5 py-4">
                    Host
                  </th>

                  <th className="px-5 py-4">
                    Visit Date
                  </th>

                  <th className="px-5 py-4">
                    Purpose
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

                {filteredAppointments.map(
                  (appointment) => (
                    <tr
                      key={appointment._id}
                      className="border-b border-gray-800 hover:bg-[#18181b] transition"
                    >

                      {/* VISITOR */}

                      <td className="px-5 py-4">

                        <div className="font-medium">
                          {appointment.visitor?.name ||
                            "-"}
                        </div>

                        <div className="text-xs text-gray-500">
                          {appointment.visitor?.mobile ||
                            ""}
                        </div>

                      </td>

                      {/* HOST */}

                      <td className="px-5 py-4">

                        <div>
                          {appointment.host?.name ||
                            "-"}
                        </div>

                        <div className="text-xs text-gray-500">
                          {appointment.host?.email ||
                            ""}
                        </div>

                      </td>

                      {/* DATE */}

                      <td className="px-5 py-4 text-gray-300">
                        {formatDate(
                          appointment.visitDate
                        )}
                      </td>

                      {/* PURPOSE */}

                      <td className="px-5 py-4 text-gray-300">
                        {appointment.purpose}
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            appointment.status ===
                            "Approved"
                              ? "bg-green-500/10 text-green-400"
                              : appointment.status ===
                                "Rejected"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-yellow-500/10 text-yellow-400"
                          }`}
                        >
                          {appointment.status}
                        </span>

                      </td>

                      {/* ACTION */}

                      <td className="px-5 py-4">

                        <div className="flex gap-2">

                          {/* ADMIN APPROVE */}

                          {isAdmin &&
                            appointment.status ===
                              "Pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    updateStatus(
                                      appointment._id,
                                      "Approved"
                                    )
                                  }
                                  className="px-3 py-1.5 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 text-xs"
                                >
                                  Approve
                                </button>

                                <button
                                  onClick={() =>
                                    updateStatus(
                                      appointment._id,
                                      "Rejected"
                                    )
                                  }
                                  className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 text-xs"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                          {/* ADMIN DELETE ONLY */}

                          {isAdmin && (
                            <button
                              onClick={() =>
                                deleteAppointment(
                                  appointment._id
                                )
                              }
                              className="px-3 py-1.5 rounded-lg bg-gray-700/50 text-gray-300 hover:bg-gray-700 text-xs"
                            >
                              Delete
                            </button>
                          )}

                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* =========================
          NEW APPOINTMENT MODAL
      ========================= */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

          <div className="bg-[#111113] border border-gray-800 rounded-2xl w-full max-w-lg p-6">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between mb-6">

              <div>

                <h2 className="text-xl font-bold">
                  New Appointment
                </h2>

                <p className="text-gray-400 text-sm mt-1">
                  Schedule a visitor appointment
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

              {/* =========================
                  VISITOR
              ========================= */}

              <div>

                <label className="block text-sm text-gray-400 mb-1">
                  Visitor
                </label>

                <select
                  name="visitor"
                  value={form.visitor}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#18181b] border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                >

                  <option value="">
                    Select Visitor
                  </option>

                  {visitors.map((visitor) => (
                    <option
                      key={visitor._id}
                      value={visitor._id}
                    >
                      {visitor.name} -{" "}
                      {visitor.mobile}
                    </option>
                  ))}

                </select>

              </div>

              {/* =========================
                  VISIT DATE
              ========================= */}

              <div>

                <label className="block text-sm text-gray-400 mb-1">
                  Visit Date
                </label>

                <input
                  type="datetime-local"
                  name="visitDate"
                  value={form.visitDate}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#18181b] border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                />

              </div>

              {/* =========================
                  PURPOSE
              ========================= */}

              <div>

                <label className="block text-sm text-gray-400 mb-1">
                  Purpose
                </label>

                <textarea
                  name="purpose"
                  value={form.purpose}
                  onChange={handleChange}
                  required
                  rows="3"
                  placeholder="Enter purpose of visit"
                  className="w-full bg-[#18181b] border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-purple-500 resize-none"
                />

              </div>

              {/* =========================
                  INFO
              ========================= */}

              <div className="bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-xl px-4 py-3 text-sm">
                Host will be automatically set to
                <span className="font-semibold ml-1">
                  {currentUser?.name ||
                    currentUser?.user?.name ||
                    "logged-in user"}
                </span>
              </div>

              {/* =========================
                  MESSAGE
              ========================= */}

              {message && (
                <div className="bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-xl px-4 py-3 text-sm">
                  {message}
                </div>
              )}

              {/* =========================
                  BUTTONS
              ========================= */}

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
                  Create Appointment
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};

export default Appointments;