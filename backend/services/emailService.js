const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({

  
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  if (!to) {
    console.log("Email skipped: recipient email not available");
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Visitor Pass System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Email sending failed:", error.message);
  }
};

const sendAppointmentStatusEmail = async ({
  visitor,
  host,
  appointment,
  status,
}) => {
  const recipient = visitor?.email || host?.email;

  if (!recipient) {
    console.log("Appointment email skipped: no email available");
    return;
  }

  const statusColor =
    status === "Approved" ? "#16a34a" : "#dc2626";

  await sendEmail({
    to: recipient,
    subject: `Appointment ${status} - Visitor Pass System`,
    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: auto;
        padding: 24px;
        background: #f8fafc;
        border-radius: 12px;
      ">

        <h2 style="color:#111827;">
          Visitor Appointment ${status}
        </h2>

        <p>
          Hello <strong>${visitor?.name || "Visitor"}</strong>,
        </p>

        <p>
          Your visitor appointment has been
          <strong style="color:${statusColor};">
            ${status}
          </strong>.
        </p>

        <div style="
          background:#ffffff;
          padding:16px;
          border-radius:10px;
          margin-top:20px;
        ">

          <p>
            <strong>Visitor:</strong>
            ${visitor?.name || "-"}
          </p>

          <p>
            <strong>Host:</strong>
            ${host?.name || "-"}
          </p>

          <p>
            <strong>Date:</strong>
            ${
              appointment?.visitDate
                ? new Date(appointment.visitDate).toLocaleString("en-IN")
                : "-"
            }
          </p>

          <p>
            <strong>Purpose:</strong>
            ${appointment?.purpose || "-"}
          </p>

        </div>

        ${
          status === "Approved"
            ? `
              <p style="margin-top:20px;">
                Your appointment has been approved.
                Please carry your visitor pass during your visit.
              </p>
            `
            : `
              <p style="margin-top:20px;">
                Unfortunately, your appointment has been rejected.
              </p>
            `
        }

        <hr style="margin-top:25px;border:none;border-top:1px solid #ddd;">

        <p style="font-size:12px;color:#6b7280;">
          This is an automated email from Visitor Pass Management System.
        </p>

      </div>
    `,
  });
};

const sendPassIssuedEmail = async ({
  visitor,
  appointment,
  pass,
}) => {
  if (!visitor?.email) {
    console.log("Pass email skipped: visitor email not available");
    return;
  }

  await sendEmail({
    to: visitor.email,
    subject: `Visitor Pass Issued - ${pass.passNumber}`,
    html: `
      <div style="
        font-family:Arial,sans-serif;
        max-width:600px;
        margin:auto;
        padding:24px;
        background:#f8fafc;
        border-radius:12px;
      ">

        <h2 style="color:#111827;">
          Visitor Pass Issued
        </h2>

        <p>
          Hello <strong>${visitor.name}</strong>,
        </p>

        <p>
          Your visitor pass has been successfully issued.
        </p>

        <div style="
          background:white;
          padding:18px;
          border-radius:10px;
          margin-top:20px;
        ">

          <p>
            <strong>Pass Number:</strong>
            ${pass.passNumber}
          </p>

          <p>
            <strong>Visit Date:</strong>
            ${
              appointment?.visitDate
                ? new Date(appointment.visitDate).toLocaleString("en-IN")
                : "-"
            }
          </p>

          <p>
            <strong>Valid From:</strong>
            ${
              pass.validFrom
                ? new Date(pass.validFrom).toLocaleString("en-IN")
                : "-"
            }
          </p>

          <p>
            <strong>Valid Until:</strong>
            ${
              pass.validUntil
                ? new Date(pass.validUntil).toLocaleString("en-IN")
                : "-"
            }
          </p>

        </div>

        <p style="margin-top:20px;">
          Please show your visitor pass/QR code at the security desk
          during check-in.
        </p>

        <hr style="margin-top:25px;border:none;border-top:1px solid #ddd;">

        <p style="font-size:12px;color:#6b7280;">
          This is an automated email from Visitor Pass Management System.
        </p>

      </div>
    `,
  });
};

module.exports = {
  sendEmail,
  sendAppointmentStatusEmail,
  sendPassIssuedEmail,
};