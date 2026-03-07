import { db } from "./index";
import * as schema from "./schema";
import { 
  COMPANY_MASTER, 
  SUPPLIER_MASTER, 
  STORE_MASTER, 
  MAIN_CATEGORY_MASTER, 
  SUB_CATEGORY_MASTER, 
  PRODUCT_MASTER,
  DASHBOARD_CARDS,
  MOCK_APPROVAL_DATA,
  PURCHASE_ORDER_DTL,
  PURCHASE_ORDER_ADDITIONAL_COST_DETAILS,
  PURCHASE_ORDER_CONVERSATION_DTL,
  PURCHASE_ORDER_FILES_UPLOAD
} from "../app/config/mockData";

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
      role: "User",
      email: "User1@visioninfotech.co.tz",
      permissions: ["poApproval", "workOrderApproval"],
    },
    {
      id: 2,
      username: "User2",
      password: "User2@123",
      name: "User2",
      role: "User",
      email: "User2@visioninfotech.co.tz",
      permissions: ["priceApproval"],
    },
    {
      id: 3,
      username: "User3",
      password: "User3@123",
      name: "User3",
      role: "User",
      email: "User3@visioninfotech.co.tz",
      permissions: ["poApproval", "workOrderApproval", "salesReturnApproval"],
    },
  
    {
      id: 4,
      username: "sri",
      password: "ana",
      name: "Srinivas",
      role: "User",
      email: "Sri@visioninfotech.co.tz",
      permissions: ["priceApproval", "poApproval", "workOrderApproval", "salesReturnApproval"],
    },
    {
      id: 5,
      username: "User4",
      password: "User4@123",
      name: "User4",
      role: "User",
      email: "User4@visioninfotech.co.tz",
      permissions: ["poApproval", "workOrderApproval", "salesReturnApproval"],
    },
    {
      id: 6,
      username: "User5",
      password: "User5@123",
      name: "User5",
      role: "User",
      email: "User5@visioninfotech.co.tz",
      permissions: ["poApproval", "workOrderApproval", "salesReturnApproval"],
    }
    
  ]);

  // 2. Dashboard Cards
  console.log("Seeding dashboard cards...");
  await db.insert(schema.dashboardCards).values(
    DASHBOARD_CARDS.map(card => ({
      ...card,
      approvalType: card.routeSlug // Assuming routeSlug matches approvalType
    }))
  );

  // 3. Companies
  console.log("Seeding companies...");
  await db.insert(schema.companies).values(COMPANY_MASTER);

  // 4. Suppliers
  console.log("Seeding suppliers...");
  await db.insert(schema.suppliers).values(SUPPLIER_MASTER);

  // 5. Stores
  console.log("Seeding stores...");
  await db.insert(schema.stores).values(STORE_MASTER);

  // 6. Main Categories
  console.log("Seeding main categories...");
  await db.insert(schema.mainCategories).values(MAIN_CATEGORY_MASTER);

  // 7. Sub Categories
  console.log("Seeding sub categories...");
  await db.insert(schema.subCategories).values(SUB_CATEGORY_MASTER);

  // 8. Products
  console.log("Seeding products...");
  await db.insert(schema.products).values(PRODUCT_MASTER);

  // 9. Purchase Order headers
  console.log("Seeding purchase order headers...");
  const poData = MOCK_APPROVAL_DATA["purchase-order"];
  if (poData && poData.length > 0) {
    await db.insert(schema.purchaseOrderHdr).values(
      poData.map(po => ({
        sno: po.sno,
        poRefNo: po.poRefNo,
        poDate: new Date(po.poDate),
        purchaseType: po.purchaseType,
        companyId: po.companyId,
        supplierId: po.supplierId,
        poStoreId: po.poStoreId,
        remarks: po.remarks,
        statusEntry: po.statusEntry,
        totalFinalProductionHdrAmount: po.totalFinalProductionHdrAmount.toString(),
        currencyType: po.currencyType,
        requestedBy: po.requestedBy,
        finalResponseStatus: po.finalResponseStatus,
      }))
    );
  }

  // 10. Approval Requests (Other types)
  console.log("Seeding other approval requests...");
  const otherTypes = ["work-order", "price-approval", "sales-return-approval"];
  for (const type of otherTypes) {
    const data = MOCK_APPROVAL_DATA[type];
    if (data && data.length > 0) {
      await db.insert(schema.approvalRequests).values(
        data.map(req => ({
          sno: req.sno,
          approvalType: type,
          poRefNo: req.poRefNo,
          poDate: new Date(req.poDate),
          purchaseType: req.purchaseType || "GENERIC",
          companyId: req.companyId,
          supplierId: req.supplierId,
          poStoreId: req.poStoreId,
          remarks: req.remarks,
          statusEntry: req.statusEntry,
          totalFinalProductionHdrAmount: req.totalFinalProductionHdrAmount ? req.totalFinalProductionHdrAmount.toString() : "0",
          currencyType: req.currencyType || "USD",
          requestedBy: req.requestedBy,
          finalResponseStatus: req.finalResponseStatus || "PENDING",
        }))
      );
    }
  }

  // 11. Purchase Order Details
  console.log("Seeding purchase order details...");
  const allPoDetails = PURCHASE_ORDER_DTL.map(d => ({
    sno: d.sno,
    poRefNo: d.poRefNo,
    productId: d.productId,
    finalProductAmount: d.finalProductAmount ? d.finalProductAmount.toString() : "0",
    totalPcs: d.totalPcs ? d.totalPcs.toString() : "0",
    ratePerPcs: d.ratePerPcs ? d.ratePerPcs.toString() : "0",
    remarks: d.remarks
  }));
  if (allPoDetails.length > 0) {
    await db.insert(schema.purchaseOrderDtl).values(allPoDetails);
  }

  // 12. Additional Costs
  console.log("Seeding additional costs...");
  const allCosts = PURCHASE_ORDER_ADDITIONAL_COST_DETAILS.map(c => ({
    sno: c.sno,
    poRefNo: c.poRefNo,
    additionalCostType: c.additionalCostType,
    amount: c.amount ? c.amount.toString() : "0"
  }));
  if (allCosts.length > 0) {
    await db.insert(schema.purchaseOrderAdditionalCosts).values(allCosts);
  }

  // 13. Conversations
  console.log("Seeding conversations...");
  const allConvs = PURCHASE_ORDER_CONVERSATION_DTL.map(c => ({
    sno: c.sno,
    poRefNo: c.poRefNo,
    respondPerson: c.respondPerson,
    discussionDetails: c.discussionDetails,
    responseStatus: c.responseStatus,
    statusEntry: c.statusEntry,
    remarks: c.remarks,
    createdBy: c.createdBy,
    createdDate: new Date(c.createdDate)
  }));
  if (allConvs.length > 0) {
    await db.insert(schema.purchaseOrderConversation).values(allConvs);
  }

  // 14. Files
  console.log("Seeding files...");
  if (PURCHASE_ORDER_FILES_UPLOAD && PURCHASE_ORDER_FILES_UPLOAD.length > 0) {
    await db.insert(schema.purchaseOrderFiles).values(
      PURCHASE_ORDER_FILES_UPLOAD.map(f => ({
        sno: f.sno,
        poRefNo: f.poRefNo,
        descriptionDetails: f.descriptionDetails,
        fileName: f.fileName,
        fileType: f.fileType,
        contentType: f.contentType,
        contentData: f.contentData
      }))
    );
  }

  console.log("Seeding completed successfully.");
  process.exit(0);
}

main()
  .catch((e) => {
    console.error("Seeding failed:");
    console.error(e);
    process.exit(1);
  });
