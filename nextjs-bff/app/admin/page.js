// Admin page for Amitra Commerce Mesh.
export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "../../lib/session";
import { executeAdminGraphQL } from "../../lib/admin-graphql";

const DASHBOARD_QUERY = `
  query AdminDashboard {
    adminDashboard {
      summary {
        totalProducts
        totalImportedFiles
        totalBatchJobs
        totalPayments
        totalDeliveryRecords
        totalNotificationRecords
        latestBatchStatus
        latestBatchSourceFile
        totalRevenue
      }
      orderStatus {
        totalPayments
        successfulPayments
        totalDeliveries
        shippedDeliveries
        totalNotifications
      }
      recentBatchJobs {
        id
        jobName
        status
        sourceFile
        startedAt
        completedAt
        processedCount
        successCount
        skippedCount
        errorCount
        reportFile
      }
    }
  }
`;

export default async function AdminPage() {
  const sessionUser = await getSessionUser();

  const isAdmin =
      sessionUser &&
      Array.isArray(sessionUser.roles) &&
      sessionUser.roles.some((role) => String(role).toLowerCase() === "admin");

  if (!isAdmin) {
    redirect("/");
  }

  const result = await executeAdminGraphQL(DASHBOARD_QUERY);
  const dashboard = result?.data?.adminDashboard;
  const summary = dashboard?.summary || {};
  const orderStatus = dashboard?.orderStatus || {};
  const jobs = dashboard?.recentBatchJobs || [];

  return (
      <main style={pageStyle}>
        <div style={headerStyle}>
          <div>
            <h1 style={{ margin: 0 }}>Admin Operations Dashboard</h1>
            <p style={{ marginTop: 8 }}>
              Signed in as{" "}
              <strong>{sessionUser.email || sessionUser.username || sessionUser.sub}</strong>
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/" style={buttonStyle}>
              Back Home
            </Link>
            <a href="/api/auth/logout" style={buttonStyle}>
              Logout
            </a>
          </div>
        </div>

        <section style={gridStyle}>
          <MetricCard label="Products in Catalog" value={summary.totalProducts} />
          <MetricCard label="Imported Files" value={summary.totalImportedFiles} />
          <MetricCard label="Batch Jobs Recorded" value={summary.totalBatchJobs} />
          <MetricCard label="Payments" value={summary.totalPayments} />
          <MetricCard label="Delivery Records" value={summary.totalDeliveryRecords} />
          <MetricCard label="Notifications" value={summary.totalNotificationRecords} />
          <MetricCard label="Latest Batch Status" value={summary.latestBatchStatus} />
          <MetricCard label="Latest Batch Source" value={summary.latestBatchSourceFile} />
          <MetricCard
              label="Total Revenue"
              value={`$${Number(summary.totalRevenue || 0).toFixed(2)}`}
          />
        </section>

        <section style={sectionStyle}>
          <h2>Operational Summary</h2>
          <ul>
            <li>Total payments: {orderStatus.totalPayments || 0}</li>
            <li>Successful payments: {orderStatus.successfulPayments || 0}</li>
            <li>Total deliveries: {orderStatus.totalDeliveries || 0}</li>
            <li>Shipped deliveries: {orderStatus.shippedDeliveries || 0}</li>
            <li>Total notifications: {orderStatus.totalNotifications || 0}</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2>Recent Product Batch Jobs</h2>
          <p>
            Drop a CSV file into <code>batch-input</code>, wait for the scheduler, or trigger the
            admin batch endpoint manually.
          </p>

          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
              <tr>
                <th>ID</th>
                <th>Job</th>
                <th>Status</th>
                <th>Source File</th>
                <th>Processed</th>
                <th>Success</th>
                <th>Skipped</th>
                <th>Errors</th>
                <th>Started</th>
                <th>Completed</th>
              </tr>
              </thead>
              <tbody>
              {jobs.length ? (
                  jobs.map((job) => (
                      <tr key={job.id}>
                        <td>{job.id}</td>
                        <td>{job.jobName}</td>
                        <td>{job.status}</td>
                        <td>{job.sourceFile}</td>
                        <td>{job.processedCount ?? 0}</td>
                        <td>{job.successCount ?? 0}</td>
                        <td>{job.skippedCount ?? 0}</td>
                        <td>{job.errorCount ?? 0}</td>
                        <td>{job.startedAt ? new Date(job.startedAt).toLocaleString() : "-"}</td>
                        <td>{job.completedAt ? new Date(job.completedAt).toLocaleString() : "-"}</td>
                      </tr>
                  ))
              ) : (
                  <tr>
                    <td colSpan="10">No batch job has run yet.</td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </section>

        <section style={sectionStyle}>
          <h2>Protected Admin GraphQL</h2>
          <p>
            Endpoint: <code>/api/admin/graphql</code>
          </p>
          <p>
            This route is available only to authenticated users with the <strong>admin</strong> role.
          </p>
        </section>
      </main>
  );
}

function MetricCard({ label, value }) {
  return (
      <div style={cardStyle}>
        <div style={{ fontSize: 14, opacity: 0.8 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{value ?? 0}</div>
      </div>
  );
}

const pageStyle = {
  padding: 24,
  background: "#0b1220",
  color: "#ffffff",
  minHeight: "100vh",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
};

const buttonStyle = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: 8,
  background: "#2563eb",
  color: "white",
  textDecoration: "none",
};

const cardStyle = {
  background: "#111827",
  padding: 16,
  borderRadius: 12,
};

const sectionStyle = {
  background: "#111827",
  padding: 16,
  borderRadius: 12,
  marginTop: 20,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
  marginTop: 20,
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};