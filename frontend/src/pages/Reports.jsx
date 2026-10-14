import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FileBarChart,
  Users,
  CalendarDays,
  Ticket,
  LogIn,
  Download,
  Search,
  RotateCcw,
} from "lucide-react";

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);

  const [type, setType] = useState("visitors");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // AUTH
  // =====================================================
  const getConfig = () => {
    const user = JSON.parse(localStorage.getItem("user"));

    return {
      headers: {
        Authorization: `Bearer ${user?.token}`,
      },
    };
  };

  // =====================================================
  // DASHBOARD STATS
  // =====================================================
  const fetchStats = async () => {
    try {
      const response = await axios.get(
        "/api/report/dashboard",
        getConfig()
      );

      setStats(response.data);
    } catch (err) {
      console.error("Dashboard stats error:", err);

      setError(
        err.response?.data?.error ||
          "Failed to load dashboard statistics"
      );
    }
  };

  // =====================================================
  // REPORTS
  // =====================================================
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.append("type", type);

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (status) {
        params.append("status", status);
      }

      if (from) {
        params.append("from", from);
      }

      if (to) {
        params.append("to", to);
      }

      const response = await axios.get(
        `/api/report?${params.toString()}`,
        getConfig()
      );

      setReports(response.data);
    } catch (err) {
      console.error("Reports error:", err);

      setError(
        err.response?.data?.error ||
          "Failed to load report"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================
  useEffect(() => {
    fetchStats();
    fetchReports();
  }, []);

  // =====================================================
  // REPORT TYPE CHANGE
  // =====================================================
  useEffect(() => {
    if (stats) {
      setStatus("");
      fetchReports();
    }
  }, [type]);

  // =====================================================
  // FILTER
  // =====================================================
  const handleApplyFilter = () => {
    fetchReports();
  };

  // =====================================================
  // RESET
  // =====================================================
  const handleReset = () => {
    setSearch("");
    setStatus("");
    setFrom("");
    setTo("");

    setTimeout(() => {
      fetchReports();
    }, 0);
  };

  // =====================================================
  // CSV EXPORT
  // =====================================================
  const handleExport = async () => {
    try {
      setExporting(true);
      setError("");

      const params = new URLSearchParams();

      params.append("type", type);

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (status) {
        params.append("status", status);
      }

      if (from) {
        params.append("from", from);
      }

      if (to) {
        params.append("to", to);
      }

      const response = await axios.get(
        `/api/report/export?${params.toString()}`,
        {
          ...getConfig(),
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = `${type}-report.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      setError("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  // =====================================================
  // DATE FORMAT
  // =====================================================
  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // =====================================================
  // STATUS BADGE
  // =====================================================
  const StatusBadge = ({ value }) => {
    const styles = {
      Approved:
        "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",

      Pending:
        "bg-amber-500/10 text-amber-400 border-amber-500/30",

      Rejected:
        "bg-rose-500/10 text-rose-400 border-rose-500/30",

      "Checked In":
        "bg-sky-500/10 text-sky-400 border-sky-500/30",

      "Checked Out":
        "bg-purple-500/10 text-purple-400 border-purple-500/30",

      Active:
        "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",

      Used:
        "bg-sky-500/10 text-sky-400 border-sky-500/30",

      Expired:
        "bg-orange-500/10 text-orange-400 border-orange-500/30",

      Cancelled:
        "bg-rose-500/10 text-rose-400 border-rose-500/30",
    };

    return (
      <span
        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${
          styles[value] ||
          "bg-gray-800 text-gray-300 border-gray-700"
        }`}
      >
        {value || "-"}
      </span>
    );
  };

  // =====================================================
  // STAT CARD
  // =====================================================
  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
  }) => {
    const colorStyles = {
      purple:
        "border-purple-500/30 bg-purple-500/10 text-purple-400",

      amber:
        "border-amber-500/30 bg-amber-500/10 text-amber-400",

      emerald:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",

      sky:
        "border-sky-500/30 bg-sky-500/10 text-sky-400",
    };

    return (
      <div className="bg-[#161b22]/90 backdrop-blur-md p-5 rounded-xl border border-gray-800/80 flex justify-between items-center shadow-lg">
        <div>
          <span
            className={`text-xs font-semibold uppercase tracking-wider block ${
              color === "amber"
                ? "text-amber-400"
                : color === "emerald"
                ? "text-emerald-400"
                : color === "sky"
                ? "text-sky-400"
                : "text-purple-400"
            }`}
          >
            {title}
          </span>

          <p className="text-3xl font-bold text-white mt-1">
            {value}
          </p>

          <p className="text-xs text-gray-400 mt-1">
            {subtitle}
          </p>
        </div>

        <div
          className={`w-12 h-12 rounded-lg border flex items-center justify-center ${
            colorStyles[color]
          }`}
        >
          <Icon size={21} />
        </div>
      </div>
    );
  };

  // =====================================================
  // LOADING
  // =====================================================
  if (!stats) {
    return (
      <div className="min-h-screen bg-black text-gray-100">
        <div className="p-6 max-w-6xl mx-auto">
          <div className="p-12 text-gray-400 animate-pulse text-center">
            Loading reports...
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================
  return (
    <div className="min-h-screen bg-black text-gray-100 relative overflow-hidden font-sans">

      {/* Purple Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-purple-900/30 blur-[130px] rounded-full pointer-events-none" />

      <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 p-6 max-w-7xl mx-auto">

        {/* =================================================
            HEADER
        ================================================= */}
        <div className="mb-8 flex justify-between items-center pb-4 border-b border-gray-800/80">

          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600/20 border border-purple-500/40 text-purple-400 rounded-xl flex items-center justify-center">
                <FileBarChart size={20} />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  Reports
                </h1>

                <p className="text-sm text-gray-400 mt-1">
                  Dashboard analytics and visitor reports
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting || reports.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-medium text-sm rounded-lg transition shadow-lg shadow-purple-600/30 border border-purple-500/50"
          >
            <Download size={16} />

            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}
        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* =================================================
            STATS
        ================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

          <StatCard
            title="Total Visitors"
            value={stats.visitors.total}
            subtitle={`${stats.visitors.pending} pending`}
            icon={Users}
            color="purple"
          />

          <StatCard
            title="Pending Appointments"
            value={stats.appointments.pending}
            subtitle={`${stats.appointments.approved} approved`}
            icon={CalendarDays}
            color="amber"
          />

          <StatCard
            title="Active Passes"
            value={stats.passes.active}
            subtitle={`${stats.passes.total} total passes`}
            icon={Ticket}
            color="emerald"
          />

          <StatCard
            title="Currently Checked In"
            value={stats.visitors.checkedIn}
            subtitle={`${stats.visitors.checkedOut} checked out`}
            icon={LogIn}
            color="sky"
          />

        </div>

        {/* =================================================
            REPORT PANEL
        ================================================= */}
        <div className="bg-[#161b22]/90 backdrop-blur-md rounded-xl border border-gray-800/80 shadow-xl overflow-hidden">

          {/* Panel Header */}
          <div className="p-6 border-b border-gray-800/80">

            <div className="flex items-center gap-3 mb-1">
              <FileBarChart
                size={20}
                className="text-purple-400"
              />

              <h2 className="text-lg font-bold text-white">
                Report Data
              </h2>
            </div>

            <p className="text-sm text-gray-400">
              Search, filter and export your system records
            </p>

          </div>

          {/* =================================================
              FILTERS
          ================================================= */}
          <div className="p-6 border-b border-gray-800/80">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

              {/* Report Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Report
                </label>

                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-[#0d1117] border border-gray-700/80 text-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition"
                >
                  <option value="visitors">
                    Visitors
                  </option>

                  <option value="appointments">
                    Appointments
                  </option>

                  <option value="passes">
                    Passes
                  </option>

                  <option value="checklogs">
                    Check Logs
                  </option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Search
                </label>

                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search records..."
                    className="w-full bg-[#0d1117] border border-gray-700/80 text-gray-200 placeholder-gray-600 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value)
                  }
                  className="w-full bg-[#0d1117] border border-gray-700/80 text-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition"
                >
                  <option value="">All Status</option>

                  {type === "visitors" && (
                    <>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Checked In">
                        Checked In
                      </option>
                      <option value="Checked Out">
                        Checked Out
                      </option>
                    </>
                  )}

                  {type === "appointments" && (
                    <>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </>
                  )}

                  {type === "passes" && (
                    <>
                      <option value="Active">Active</option>
                      <option value="Used">Used</option>
                      <option value="Expired">Expired</option>
                      <option value="Cancelled">
                        Cancelled
                      </option>
                    </>
                  )}

                  {type === "checklogs" && (
                    <>
                      <option value="Checked In">
                        Checked In
                      </option>
                      <option value="Checked Out">
                        Checked Out
                      </option>
                    </>
                  )}
                </select>
              </div>

              {/* From */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  From
                </label>

                <input
                  type="date"
                  value={from}
                  onChange={(e) =>
                    setFrom(e.target.value)
                  }
                  className="w-full bg-[#0d1117] border border-gray-700/80 text-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition [color-scheme:dark]"
                />
              </div>

              {/* To */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  To
                </label>

                <input
                  type="date"
                  value={to}
                  onChange={(e) =>
                    setTo(e.target.value)
                  }
                  className="w-full bg-[#0d1117] border border-gray-700/80 text-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition [color-scheme:dark]"
                />
              </div>

            </div>

            {/* Filter Buttons */}
            <div className="flex gap-3 mt-5">

              <button
                onClick={handleApplyFilter}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm rounded-lg transition shadow-lg shadow-purple-600/20"
              >
                <Search size={15} />
                Apply Filter
              </button>

              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-700/80 font-medium text-sm rounded-lg transition"
              >
                <RotateCcw size={15} />
                Reset
              </button>

            </div>
          </div>

          {/* =================================================
              RESULTS HEADER
          ================================================= */}
          <div className="px-6 py-4 border-b border-gray-800/80 flex items-center justify-between">

            <div>
              <h3 className="text-sm font-semibold text-gray-200">
                {type === "visitors" && "Visitor Records"}
                {type === "appointments" &&
                  "Appointment Records"}
                {type === "passes" && "Pass Records"}
                {type === "checklogs" &&
                  "Check-In / Check-Out Logs"}
              </h3>

              <p className="text-xs text-gray-500 mt-1">
                {reports.length} record
                {reports.length !== 1 ? "s" : ""} found
              </p>
            </div>

          </div>

          {/* =================================================
              TABLE AREA
          ================================================= */}
          <div className="overflow-x-auto">

            {loading ? (
              <div className="p-12 text-center text-gray-500 animate-pulse">
                Loading report data...
              </div>
            ) : reports.length === 0 ? (
              <div className="p-12 text-center">

                <FileBarChart
                  size={35}
                  className="mx-auto text-gray-700 mb-3"
                />

                <p className="text-sm text-gray-500">
                  No records found
                </p>

                <p className="text-xs text-gray-600 mt-1">
                  Try changing your filters or search
                </p>

              </div>
            ) : (

              <>
                {/* =================================================
                    VISITORS TABLE
                ================================================= */}
                {type === "visitors" && (
                  <table className="w-full text-left border-collapse">

                    <thead>
                      <tr className="border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <th className="py-3 px-6">
                          Visitor
                        </th>

                        <th className="py-3 px-6">
                          Mobile
                        </th>

                        <th className="py-3 px-6">
                          Company
                        </th>

                        <th className="py-3 px-6">
                          Host
                        </th>

                        <th className="py-3 px-6">
                          Visit Date
                        </th>

                        <th className="py-3 px-6">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-800/60 text-sm">

                      {reports.map((visitor) => (
                        <tr
                          key={visitor._id}
                          className="hover:bg-gray-800/40 transition"
                        >

                          <td className="py-3.5 px-6 font-medium text-white">
                            {visitor.name}
                          </td>

                          <td className="py-3.5 px-6 text-gray-300">
                            {visitor.mobile}
                          </td>

                          <td className="py-3.5 px-6 text-gray-400">
                            {visitor.company || "-"}
                          </td>

                          <td className="py-3.5 px-6 text-gray-300">
                            {visitor.host || "-"}
                          </td>

                          <td className="py-3.5 px-6 text-gray-400 whitespace-nowrap">
                            {formatDate(visitor.visitDate)}
                          </td>

                          <td className="py-3.5 px-6">
                            <StatusBadge
                              value={visitor.status}
                            />
                          </td>

                        </tr>
                      ))}

                    </tbody>
                  </table>
                )}

                {/* =================================================
                    APPOINTMENTS TABLE
                ================================================= */}
                {type === "appointments" && (
                  <table className="w-full text-left border-collapse">

                    <thead>
                      <tr className="border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">

                        <th className="py-3 px-6">
                          Visitor
                        </th>

                        <th className="py-3 px-6">
                          Mobile
                        </th>

                        <th className="py-3 px-6">
                          Host
                        </th>

                        <th className="py-3 px-6">
                          Purpose
                        </th>

                        <th className="py-3 px-6">
                          Visit Date
                        </th>

                        <th className="py-3 px-6">
                          Status
                        </th>

                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-800/60 text-sm">

                      {reports.map((appointment) => (
                        <tr
                          key={appointment._id}
                          className="hover:bg-gray-800/40 transition"
                        >

                          <td className="py-3.5 px-6 font-medium text-white">
                            {appointment.visitor?.name ||
                              "-"}
                          </td>

                          <td className="py-3.5 px-6 text-gray-300">
                            {appointment.visitor?.mobile ||
                              "-"}
                          </td>

                          <td className="py-3.5 px-6 text-gray-300">
                            {appointment.host?.name || "-"}
                          </td>

                          <td className="py-3.5 px-6 text-gray-400">
                            {appointment.purpose || "-"}
                          </td>

                          <td className="py-3.5 px-6 text-gray-400 whitespace-nowrap">
                            {formatDate(
                              appointment.visitDate
                            )}
                          </td>

                          <td className="py-3.5 px-6">
                            <StatusBadge
                              value={appointment.status}
                            />
                          </td>

                        </tr>
                      ))}

                    </tbody>
                  </table>
                )}

                {/* =================================================
                    PASSES TABLE
                ================================================= */}
                {type === "passes" && (
                  <table className="w-full text-left border-collapse">

                    <thead>
                      <tr className="border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">

                        <th className="py-3 px-6">
                          Pass Number
                        </th>

                        <th className="py-3 px-6">
                          Visitor
                        </th>

                        <th className="py-3 px-6">
                          Mobile
                        </th>

                        <th className="py-3 px-6">
                          Valid From
                        </th>

                        <th className="py-3 px-6">
                          Valid Until
                        </th>

                        <th className="py-3 px-6">
                          Status
                        </th>

                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-800/60 text-sm">

                      {reports.map((pass) => (
                        <tr
                          key={pass._id}
                          className="hover:bg-gray-800/40 transition"
                        >

                          <td className="py-3.5 px-6 font-medium text-purple-400">
                            {pass.passNumber}
                          </td>

                          <td className="py-3.5 px-6 font-medium text-white">
                            {pass.visitor?.name || "-"}
                          </td>

                          <td className="py-3.5 px-6 text-gray-300">
                            {pass.visitor?.mobile || "-"}
                          </td>

                          <td className="py-3.5 px-6 text-gray-400 whitespace-nowrap">
                            {formatDate(pass.validFrom)}
                          </td>

                          <td className="py-3.5 px-6 text-gray-400 whitespace-nowrap">
                            {formatDate(pass.validUntil)}
                          </td>

                          <td className="py-3.5 px-6">
                            <StatusBadge
                              value={pass.status}
                            />
                          </td>

                        </tr>
                      ))}

                    </tbody>
                  </table>
                )}

                {/* =================================================
                    CHECK LOGS TABLE
                ================================================= */}
                {type === "checklogs" && (
                  <table className="w-full text-left border-collapse">

                    <thead>
                      <tr className="border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">

                        <th className="py-3 px-6">
                          Pass Number
                        </th>

                        <th className="py-3 px-6">
                          Visitor
                        </th>

                        <th className="py-3 px-6">
                          Mobile
                        </th>

                        <th className="py-3 px-6">
                          Check In
                        </th>

                        <th className="py-3 px-6">
                          Check Out
                        </th>

                        <th className="py-3 px-6">
                          Status
                        </th>

                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-800/60 text-sm">

                      {reports.map((log) => (
                        <tr
                          key={log._id}
                          className="hover:bg-gray-800/40 transition"
                        >

                          <td className="py-3.5 px-6 font-medium text-purple-400">
                            {log.pass?.passNumber || "-"}
                          </td>

                          <td className="py-3.5 px-6 font-medium text-white">
                            {log.visitor?.name || "-"}
                          </td>

                          <td className="py-3.5 px-6 text-gray-300">
                            {log.visitor?.mobile || "-"}
                          </td>

                          <td className="py-3.5 px-6 text-gray-400 whitespace-nowrap">
                            {formatDate(log.checkIn)}
                          </td>

                          <td className="py-3.5 px-6 text-gray-400 whitespace-nowrap">
                            {formatDate(log.checkOut)}
                          </td>

                          <td className="py-3.5 px-6">
                            <StatusBadge
                              value={log.status}
                            />
                          </td>

                        </tr>
                      ))}

                    </tbody>
                  </table>
                )}

              </>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default Reports;