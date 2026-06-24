import { eq } from "drizzle-orm";
import { db } from "./index";
import * as schema from "./schema";

async function main() {
  console.log("Seeding database...");

  // 1. Users
  console.log("Seeding users...");
  await db.insert(schema.users).values([
    {
      id: 1,
      username: "User1",
      password: "User1@123",
      name: "User1",
      role: "user",
      email: "User1@visioninfotech.co.tz",
      permissions: ["poApproval", "workOrderApproval"],
    },
    {
      id: 2,
      username: "User2",
      password: "User2@123",
      name: "User2",
      role: "user",
      email: "User2@visioninfotech.co.tz",
      permissions: ["priceApproval"],
    },
    {
      id: 3,
      username: "User3",
      password: "User3@123",
      name: "User3",
      role: "user",
      email: "User3@visioninfotech.co.tz",
      permissions: ["poApproval", "workOrderApproval", "salesReturnApproval"],
    },
    {
      id: 4,
      username: "sri",
      password: "ana",
      name: "Srinivas",
      role: "admin",
      email: "Sri@visioninfotech.co.tz",
      permissions: ["priceApproval", "poApproval", "workOrderApproval", "salesReturnApproval"],
    },
    {
      id: 5,
      username: "User4",
      password: "User4@123",
      name: "User4",
      role: "user",
      email: "User4@visioninfotech.co.tz",
      permissions: ["poApproval", "workOrderApproval", "salesReturnApproval"],
    },
    {
      id: 6,
      username: "User5",
      password: "User5@123",
      name: "User5",
      role: "user",
      email: "User5@visioninfotech.co.tz",
      permissions: ["poApproval", "workOrderApproval", "salesReturnApproval"],
    }
  ]);

  // 2. Dashboard Cards
  console.log("Seeding dashboard cards...");
  await db.insert(schema.dashboardCards).values([
    {
      sno: 1,
      cardTitle: "Purchase Order Approvals",
      permissionColumn: "poApproval",
      routeSlug: "purchase-order",
      approvalType: "purchase-order",
      iconKey: "ShoppingCart",
      backgroundColor: "indigo",
      parentId: null,
    },
    {
      sno: 2,
      cardTitle: "Work Order Approvals",
      permissionColumn: "workOrderApproval",
      routeSlug: "work-order",
      approvalType: "work-order",
      iconKey: "Briefcase",
      backgroundColor: "emerald",
      parentId: null,
    },
    {
      sno: 3,
      cardTitle: "Price Approvals",
      permissionColumn: "priceApproval",
      routeSlug: "price-approval",
      approvalType: "price-approval",
      iconKey: "LayoutDashboard",
      backgroundColor: "amber",
      parentId: null,
    },
    {
      sno: 4,
      cardTitle: "Sales Return Approvals",
      permissionColumn: "salesReturnApproval",
      routeSlug: "sales-return-approval",
      approvalType: "sales-return-approval",
      iconKey: "LayoutDashboard",
      backgroundColor: "rose",
      parentId: null,
    },
    {
      sno: 5,
      cardTitle: "Employee Approvals",
      permissionColumn: "employeeApproval",
      routeSlug: "employee-approvals",
      approvalType: "employee-approvals",
      iconKey: "Users",
      backgroundColor: "purple",
      parentId: null,
    },
    {
      sno: 6,
      cardTitle: "Leave Approvals",
      permissionColumn: "leaveApproval",
      routeSlug: "leave-approval",
      approvalType: "leave-approval",
      iconKey: "Bookmark",
      backgroundColor: "sky",
      parentId: 5,
    },
    {
      sno: 7,
      cardTitle: "Salary Approvals",
      permissionColumn: "salaryApproval",
      routeSlug: "salary-approval",
      approvalType: "salary-approval",
      iconKey: "DollarSign",
      backgroundColor: "emerald",
      parentId: 5,
    },
  ]);

  // Update admin user permissions to include new approval types
  await db.update(schema.users)
    .set({
      permissions: ["priceApproval", "poApproval", "workOrderApproval", "salesReturnApproval", "employeeApproval", "leaveApproval", "salaryApproval"]
    })
    .where(eq(schema.users.id, 4));

  console.log("Seeding completed successfully.");
  process.exit(0);
}

main()
  .catch((e) => {
    console.error("Seeding failed:");
    console.error(e);
    process.exit(1);
  });
