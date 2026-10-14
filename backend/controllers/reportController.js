const Visitor = require("../models/visitorModel");
const Appointment = require("../models/appointmentModel");
const Pass = require("../models/passModel");
const CheckLog = require("../models/checkLogModel");

// ======================================================
// DASHBOARD STATS
// ======================================================
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalVisitors,
      pendingVisitors,
      approvedVisitors,
      checkedInVisitors,
      checkedOutVisitors,

      totalAppointments,
      pendingAppointments,
      approvedAppointments,

      totalPasses,
      activePasses,

      totalCheckLogs,
    ] = await Promise.all([
      Visitor.countDocuments(),

      Visitor.countDocuments({
        status: "Pending",
      }),

      Visitor.countDocuments({
        status: "Approved",
      }),

      Visitor.countDocuments({
        status: "Checked In",
      }),

      Visitor.countDocuments({
        status: "Checked Out",
      }),

      Appointment.countDocuments(),

      Appointment.countDocuments({
        status: "Pending",
      }),

      Appointment.countDocuments({
        status: "Approved",
      }),

      Pass.countDocuments(),

      Pass.countDocuments({
        status: "Active",
      }),

      CheckLog.countDocuments(),
    ]);

    return res.status(200).json({
      visitors: {
        total: totalVisitors,
        pending: pendingVisitors,
        approved: approvedVisitors,
        checkedIn: checkedInVisitors,
        checkedOut: checkedOutVisitors,
      },

      appointments: {
        total: totalAppointments,
        pending: pendingAppointments,
        approved: approvedAppointments,
      },

      passes: {
        total: totalPasses,
        active: activePasses,
      },

      checkLogs: {
        total: totalCheckLogs,
      },
    });

  } catch (error) {
    console.error("Dashboard stats error:", error);

    return res.status(500).json({
      error: "Failed to fetch dashboard statistics",
    });
  }
};


// ======================================================
// GET REPORTS
// type = visitors | appointments | passes | checklogs
// ======================================================
const getReports = async (req, res) => {
  try {
    const {
      type = "visitors",
      search = "",
      status = "",
      from = "",
      to = "",
    } = req.query;

    // --------------------------------------------------
    // DATE FILTER
    // --------------------------------------------------
    const dateFilter = {};

    if (from) {
      dateFilter.$gte = new Date(`${from}T00:00:00`);
    }

    if (to) {
      dateFilter.$lte = new Date(`${to}T23:59:59`);
    }

    // --------------------------------------------------
    // VISITORS
    // --------------------------------------------------
    if (type === "visitors") {
      const query = {};

      if (status) {
        query.status = status;
      }

      if (from || to) {
        query.visitDate = dateFilter;
      }

      if (search) {
        query.$or = [
          {
            name: {
              $regex: search,
              $options: "i",
            },
          },
          {
            mobile: {
              $regex: search,
              $options: "i",
            },
          },
          {
            host: {
              $regex: search,
              $options: "i",
            },
          },
        ];
      }

      const visitors = await Visitor.find(query)
        .populate("createdBy", "name email role")
        .sort({ createdAt: -1 });

      return res.status(200).json(visitors);
    }

    // --------------------------------------------------
    // APPOINTMENTS
    // --------------------------------------------------
    if (type === "appointments") {
      const query = {};

      if (status) {
        query.status = status;
      }

      if (from || to) {
        query.visitDate = dateFilter;
      }

      let appointments = await Appointment.find(query)
        .populate("visitor")
        .populate("host", "name email role")
        .populate("createdBy", "name email role")
        .sort({ visitDate: -1 });

      if (search) {
        const searchLower = search.toLowerCase();

        appointments = appointments.filter((appointment) => {
          return (
            appointment.visitor?.name
              ?.toLowerCase()
              .includes(searchLower) ||

            appointment.visitor?.mobile
              ?.toLowerCase()
              .includes(searchLower) ||

            appointment.host?.name
              ?.toLowerCase()
              .includes(searchLower) ||

            appointment.purpose
              ?.toLowerCase()
              .includes(searchLower)
          );
        });
      }

      return res.status(200).json(appointments);
    }

    // --------------------------------------------------
    // PASSES
    // --------------------------------------------------
    if (type === "passes") {
      const query = {};

      if (status) {
        query.status = status;
      }

      if (from || to) {
        query.validFrom = dateFilter;
      }

      let passes = await Pass.find(query)
        .populate("visitor")
        .populate("appointment")
        .populate("issuedBy", "name email role")
        .sort({ createdAt: -1 });

      if (search) {
        const searchLower = search.toLowerCase();

        passes = passes.filter((pass) => {
          return (
            pass.passNumber
              ?.toLowerCase()
              .includes(searchLower) ||

            pass.visitor?.name
              ?.toLowerCase()
              .includes(searchLower) ||

            pass.visitor?.mobile
              ?.toLowerCase()
              .includes(searchLower)
          );
        });
      }

      return res.status(200).json(passes);
    }

    // --------------------------------------------------
    // CHECK LOGS
    // --------------------------------------------------
    if (type === "checklogs") {
      const query = {};

      if (status) {
        query.status = status;
      }

      if (from || to) {
        query.createdAt = dateFilter;
      }

      let logs = await CheckLog.find(query)
        .populate("pass")
        .populate("visitor")
        .populate("checkedInBy", "name email role")
        .populate("checkedOutBy", "name email role")
        .sort({ createdAt: -1 });

      if (search) {
        const searchLower = search.toLowerCase();

        logs = logs.filter((log) => {
          return (
            log.pass?.passNumber
              ?.toLowerCase()
              .includes(searchLower) ||

            log.visitor?.name
              ?.toLowerCase()
              .includes(searchLower) ||

            log.visitor?.mobile
              ?.toLowerCase()
              .includes(searchLower)
          );
        });
      }

      return res.status(200).json(logs);
    }

    return res.status(400).json({
      error:
        "Invalid report type. Use visitors, appointments, passes or checklogs.",
    });

  } catch (error) {
    console.error("Get reports error:", error);

    return res.status(500).json({
      error: "Failed to fetch report",
    });
  }
};


// ======================================================
// EXPORT REPORT CSV
// ======================================================
const exportReportCSV = async (req, res) => {
  try {
    const {
      type = "visitors",
      search = "",
      status = "",
      from = "",
      to = "",
    } = req.query;

    const dateFilter = {};

    if (from) {
      dateFilter.$gte = new Date(`${from}T00:00:00`);
    }

    if (to) {
      dateFilter.$lte = new Date(`${to}T23:59:59`);
    }

    let rows = [];

    // --------------------------------------------------
    // VISITORS
    // --------------------------------------------------
    if (type === "visitors") {
      const query = {};

      if (status) query.status = status;

      if (from || to) {
        query.visitDate = dateFilter;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { mobile: { $regex: search, $options: "i" } },
          { host: { $regex: search, $options: "i" } },
        ];
      }

      const visitors = await Visitor.find(query)
        .sort({ createdAt: -1 });

      rows = visitors.map((visitor) => ({
        Name: visitor.name,
        Mobile: visitor.mobile,
        Email: visitor.email || "",
        Company: visitor.company || "",
        Purpose: visitor.purpose || "",
        Host: visitor.host || "",
        VisitDate: visitor.visitDate
          ? new Date(visitor.visitDate).toLocaleString("en-IN")
          : "",
        Status: visitor.status,
      }));
    }

    // --------------------------------------------------
    // APPOINTMENTS
    // --------------------------------------------------
    else if (type === "appointments") {
      const query = {};

      if (status) query.status = status;

      if (from || to) {
        query.visitDate = dateFilter;
      }

      let appointments = await Appointment.find(query)
        .populate("visitor")
        .populate("host", "name")
        .sort({ visitDate: -1 });

      if (search) {
        const searchLower = search.toLowerCase();

        appointments = appointments.filter((appointment) => {
          return (
            appointment.visitor?.name
              ?.toLowerCase()
              .includes(searchLower) ||

            appointment.visitor?.mobile
              ?.toLowerCase()
              .includes(searchLower) ||

            appointment.host?.name
              ?.toLowerCase()
              .includes(searchLower) ||

            appointment.purpose
              ?.toLowerCase()
              .includes(searchLower)
          );
        });
      }

      rows = appointments.map((appointment) => ({
        Visitor: appointment.visitor?.name || "",
        Mobile: appointment.visitor?.mobile || "",
        Host: appointment.host?.name || "",
        Purpose: appointment.purpose || "",
        VisitDate: appointment.visitDate
          ? new Date(appointment.visitDate).toLocaleString("en-IN")
          : "",
        Status: appointment.status,
      }));
    }

    // --------------------------------------------------
    // PASSES
    // --------------------------------------------------
    else if (type === "passes") {
      const query = {};

      if (status) query.status = status;

      if (from || to) {
        query.validFrom = dateFilter;
      }

      let passes = await Pass.find(query)
        .populate("visitor")
        .sort({ createdAt: -1 });

      if (search) {
        const searchLower = search.toLowerCase();

        passes = passes.filter((pass) => {
          return (
            pass.passNumber
              ?.toLowerCase()
              .includes(searchLower) ||

            pass.visitor?.name
              ?.toLowerCase()
              .includes(searchLower) ||

            pass.visitor?.mobile
              ?.toLowerCase()
              .includes(searchLower)
          );
        });
      }

      rows = passes.map((pass) => ({
        PassNumber: pass.passNumber,
        Visitor: pass.visitor?.name || "",
        Mobile: pass.visitor?.mobile || "",
        ValidFrom: pass.validFrom
          ? new Date(pass.validFrom).toLocaleString("en-IN")
          : "",
        ValidUntil: pass.validUntil
          ? new Date(pass.validUntil).toLocaleString("en-IN")
          : "",
        Status: pass.status,
      }));
    }

    // --------------------------------------------------
    // CHECK LOGS
    // --------------------------------------------------
    else if (type === "checklogs") {
      const query = {};

      if (status) query.status = status;

      if (from || to) {
        query.createdAt = dateFilter;
      }

      let logs = await CheckLog.find(query)
        .populate("pass")
        .populate("visitor")
        .sort({ createdAt: -1 });

      if (search) {
        const searchLower = search.toLowerCase();

        logs = logs.filter((log) => {
          return (
            log.pass?.passNumber
              ?.toLowerCase()
              .includes(searchLower) ||

            log.visitor?.name
              ?.toLowerCase()
              .includes(searchLower) ||

            log.visitor?.mobile
              ?.toLowerCase()
              .includes(searchLower)
          );
        });
      }

      rows = logs.map((log) => ({
        PassNumber: log.pass?.passNumber || "",
        Visitor: log.visitor?.name || "",
        Mobile: log.visitor?.mobile || "",
        CheckIn: log.checkIn
          ? new Date(log.checkIn).toLocaleString("en-IN")
          : "",
        CheckOut: log.checkOut
          ? new Date(log.checkOut).toLocaleString("en-IN")
          : "",
        Status: log.status,
      }));
    }

    else {
      return res.status(400).json({
        error: "Invalid report type",
      });
    }

    // --------------------------------------------------
    // CSV GENERATION
    // --------------------------------------------------
    if (!rows.length) {
      return res.status(200).send("");
    }

    const headers = Object.keys(rows[0]);

    const escapeCSV = (value) => {
      const stringValue = String(value ?? "");

      return `"${stringValue.replace(/"/g, '""')}"`;
    };

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => escapeCSV(row[header]))
          .join(",")
      ),
    ].join("\n");

    res.setHeader(
      "Content-Type",
      "text/csv; charset=utf-8"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${type}-report.csv`
    );

    return res.status(200).send(csv);

  } catch (error) {
    console.error("Export report error:", error);

    return res.status(500).json({
      error: "Failed to export report",
    });
  }
};


module.exports = {
  getDashboardStats,
  getReports,
  exportReportCSV,
};