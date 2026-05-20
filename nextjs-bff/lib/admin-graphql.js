import {
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  graphql
} from "graphql";
import { gatewayFetch } from "./api";

async function safeJsonFetch(path, fallback) {
  try {
    const response = await gatewayFetch(path);
    if (!response.ok) return fallback;
    return await response.json();
  } catch {
    return fallback;
  }
}

function unwrapListResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

function unwrapObjectResponse(payload, fallback = null) {
  if (!payload) return fallback;
  if (payload.data && typeof payload.data === "object") return payload.data;
  return payload;
}

async function loadDashboardData() {
  const [productsRaw, paymentsRaw, deliveriesRaw, notificationsRaw, batchDashboardRaw] =
      await Promise.all([
        safeJsonFetch("/api/products", null),
        safeJsonFetch("/api/payments", null),
        safeJsonFetch("/api/deliveries", null),
        safeJsonFetch("/api/notifications", null),
        safeJsonFetch("/api/admin/batch/dashboard", null)
      ]);

  return {
    products: unwrapListResponse(productsRaw),
    payments: unwrapListResponse(paymentsRaw),
    deliveries: unwrapListResponse(deliveriesRaw),
    notifications: unwrapListResponse(notificationsRaw),
    batchDashboard: unwrapObjectResponse(batchDashboardRaw, null)
  };
}

const BatchJobType = new GraphQLObjectType({
  name: "BatchJob",
  fields: {
    id: { type: GraphQLInt },
    jobName: { type: GraphQLString },
    status: { type: GraphQLString },
    sourceFile: { type: GraphQLString },
    startedAt: { type: GraphQLString },
    completedAt: { type: GraphQLString },
    processedCount: { type: GraphQLInt },
    successCount: { type: GraphQLInt },
    skippedCount: { type: GraphQLInt },
    errorCount: { type: GraphQLInt },
    details: { type: GraphQLString },
    reportFile: { type: GraphQLString }
  }
});

const OrderStatusSummaryType = new GraphQLObjectType({
  name: "OrderStatusSummary",
  fields: {
    totalPayments: { type: GraphQLInt },
    successfulPayments: { type: GraphQLInt },
    totalDeliveries: { type: GraphQLInt },
    shippedDeliveries: { type: GraphQLInt },
    totalNotifications: { type: GraphQLInt }
  }
});

const AdminSummaryType = new GraphQLObjectType({
  name: "AdminSummary",
  fields: {
    totalProducts: { type: GraphQLInt },
    totalImportedFiles: { type: GraphQLInt },
    totalBatchJobs: { type: GraphQLInt },
    totalPayments: { type: GraphQLInt },
    totalDeliveryRecords: { type: GraphQLInt },
    totalNotificationRecords: { type: GraphQLInt },
    latestBatchStatus: { type: GraphQLString },
    latestBatchSourceFile: { type: GraphQLString },
    totalRevenue: { type: GraphQLFloat }
  }
});

const AdminDashboardType = new GraphQLObjectType({
  name: "AdminDashboard",
  fields: {
    summary: {
      type: AdminSummaryType,
      resolve: async () => {
        const data = await loadDashboardData();
        const payments = data.payments || [];

        const totalRevenue = payments.reduce(
            (sum, payment) => sum + Number(payment.amount || 0),
            0
        );

        return {
          totalProducts: data.products.length,
          totalImportedFiles: data.batchDashboard?.totalImportedFiles || 0,
          totalBatchJobs: data.batchDashboard?.recentJobs?.length || 0,
          totalPayments: payments.length,
          totalDeliveryRecords: data.deliveries.length,
          totalNotificationRecords: data.notifications.length,
          latestBatchStatus: data.batchDashboard?.latestJob?.status || "NO_RUN_YET",
          latestBatchSourceFile: data.batchDashboard?.latestJob?.sourceFile || "N/A",
          totalRevenue
        };
      }
    },
    recentBatchJobs: {
      type: new GraphQLList(BatchJobType),
      resolve: async () => (await loadDashboardData()).batchDashboard?.recentJobs || []
    },
    orderStatus: {
      type: OrderStatusSummaryType,
      resolve: async () => {
        const data = await loadDashboardData();
        return {
          totalPayments: data.payments.length,
          successfulPayments: data.payments.filter(
              (item) => item.status === "SUCCESS"
          ).length,
          totalDeliveries: data.deliveries.length,
          shippedDeliveries: data.deliveries.filter(
              (item) => item.status === "SHIPPED"
          ).length,
          totalNotifications: data.notifications.length
        };
      }
    }
  }
});

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query",
    fields: {
      adminDashboard: {
        type: new GraphQLNonNull(AdminDashboardType),
        resolve: () => ({})
      }
    }
  })
});

export async function executeAdminGraphQL(query, variables = {}) {
  return graphql({
    schema,
    source: query,
    variableValues: variables
  });
}