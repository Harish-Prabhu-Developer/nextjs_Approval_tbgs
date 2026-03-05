// db/schema.ts
import {
  pgTable,
  integer,
  varchar,
  text,
  decimal,
  timestamp,
  boolean,
  date,
  serial
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// -------------------- Users & UI --------------------
export const users = pgTable("tbl_users", {
  id: integer("id").primaryKey(),
  username: varchar("username", { length: 64 }).notNull(),
  password: varchar("password", { length: 128 }).notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  role: varchar("role", { length: 64 }).notNull(),
  email: varchar("email", { length: 128 }).notNull(),
  permissions: text("permissions").array().notNull(), // e.g. ["poApproval", "workOrderApproval"]
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow()
});

export const dashboardCards = pgTable("tbl_dashboard_cards", {
  sno: integer("sno").primaryKey(),
  cardTitle: varchar("card_title", { length: 150 }).notNull(),
  permissionColumn: varchar("permission_column", { length: 64 }).notNull(),
  routeSlug: varchar("route_slug", { length: 64 }).notNull(),
  approvalType: varchar("approval_type", { length: 64 }).notNull(),
  iconKey: varchar("icon_key", { length: 64 }).notNull(),
  backgroundColor: varchar("background_color", { length: 32 }).notNull()
});

// -------------------- Masters --------------------
export const companies = pgTable("tbl_companies", {
  companyId: integer("company_id").primaryKey(),
  companyName: varchar("company_name", { length: 200 }).notNull(),
  address: text("address"),
  contactNo: varchar("contact_no", { length: 50 }),
  email: varchar("email", { length: 150 }),
  status: varchar("status", { length: 20 }).notNull()
});

export const suppliers = pgTable("tbl_suppliers", {
  supplierId: integer("supplier_id").primaryKey(),
  supplierName: varchar("supplier_name", { length: 200 }).notNull(),
  address: text("address"),
  contactNo: varchar("contact_no", { length: 50 }),
  email: varchar("email", { length: 150 }),
  taxNumber: varchar("tax_number", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull()
});

export const stores = pgTable("tbl_stores", {
  storeId: integer("store_id").primaryKey(),
  storeName: varchar("store_name", { length: 200 }).notNull(),
  companyId: integer("company_id").references(() => companies.companyId),
  location: varchar("location", { length: 200 }),
  status: varchar("status", { length: 20 }).notNull()
});

export const mainCategories = pgTable("tbl_main_categories", {
  mainCategoryId: integer("main_category_id").primaryKey(),
  categoryName: varchar("category_name", { length: 150 }).notNull(),
  status: varchar("status", { length: 20 }).notNull()
});

export const subCategories = pgTable("tbl_sub_categories", {
  subCategoryId: integer("sub_category_id").primaryKey(),
  mainCategoryId: integer("main_category_id").references(() => mainCategories.mainCategoryId),
  subCategoryName: varchar("sub_category_name", { length: 150 }).notNull(),
  status: varchar("status", { length: 20 }).notNull()
});

export const products = pgTable("tbl_products", {
  productId: integer("product_id").primaryKey(),
  productName: varchar("product_name", { length: 200 }).notNull(),
  mainCategoryId: integer("main_category_id").references(() => mainCategories.mainCategoryId),
  subCategoryId: integer("sub_category_id").references(() => subCategories.subCategoryId),
  unit: varchar("unit", { length: 30 }),
  specification: text("specification"),
  status: varchar("status", { length: 20 }).notNull()
});

export const trucks = pgTable("tbl_trucks", {
  truckId: integer("truck_id").primaryKey(),
  truckNumber: varchar("truck_number", { length: 50 }).notNull()
});

export const trailers = pgTable("tbl_trailers", {
  trailerId: integer("trailer_id").primaryKey(),
  trailerNumber: varchar("trailer_number", { length: 50 }).notNull()
});

// -------------------- Approval Requests (Universal Table for non-PO or Unified) --------------------
export const approvalRequests = pgTable("tbl_approval_requests", {
  sno: integer("sno").primaryKey(),
  approvalType: varchar("approval_type", { length: 64 }).notNull(), // work-order | price-approval | sales-return-approval
  poRefNo: varchar("po_ref_no", { length: 50 }).notNull(),
  poDate: timestamp("po_date", { withTimezone: false }),
  purchaseType: varchar("purchase_type", { length: 50 }),
  companyId: integer("company_id").references(() => companies.companyId),
  supplierId: integer("supplier_id").references(() => suppliers.supplierId),
  poStoreId: integer("po_store_id").references(() => stores.storeId),
  remarks: text("remarks"),
  statusEntry: varchar("status_entry", { length: 20 }),
  createdBy: varchar("created_by", { length: 100 }),
  createdDate: timestamp("created_date", { withTimezone: false }),
  modifiedBy: varchar("modified_by", { length: 100 }),
  modifiedDate: timestamp("modified_date", { withTimezone: false }),
  totalFinalProductionHdrAmount: decimal("total_final_production_hdr_amount", { precision: 15, scale: 2 }),
  currencyType: varchar("currency_type", { length: 10 }),
  requestedBy: varchar("requested_by", { length: 100 }),
  requestedDate: timestamp("requested_date", { withTimezone: false }),
  
  // First Approval Workflow
  response1Person: varchar("response1_person", { length: 100 }),
  response1Status: varchar("response1_status", { length: 20 }),
  response1Date: timestamp("response1_date", { withTimezone: false }),
  response1Remarks: text("response1_remarks"),
  
  // Second Approval Workflow
  response2Person: varchar("response2_person", { length: 100 }),
  response2Status: varchar("response2_status", { length: 20 }),
  response2Date: timestamp("response2_date", { withTimezone: false }),
  response2Remarks: text("response2_remarks"),
  
  // Final Review/Decision
  finalResponsePerson: varchar("final_response_person", { length: 100 }),
  finalResponseStatus: varchar("final_response_status", { length: 20 }),
  finalResponseDate: timestamp("final_response_date", { withTimezone: false }),
  finalResponseRemarks: text("final_response_remarks"),
  
  // Additional Info
  paymentTerm: text("payment_term"),
  modeOfPayment: varchar("mode_of_payment", { length: 50 }),
  suplierProformaNumber: varchar("suplier_proforma_number", { length: 100 }),
  shipmentMode: varchar("shipment_mode", { length: 50 }),
  priceTerms: varchar("price_terms", { length: 50 }),
  shipmentRemarks: text("shipment_remarks"),
  totalProductionHdrAmount: decimal("total_production_hdr_amount", { precision: 15, scale: 2 }),
  totalAdditionalCostAmount: decimal("total_additional_cost_amount", { precision: 15, scale: 2 }),
  vatHdrAmount: decimal("vat_hdr_amount", { precision: 15, scale: 2 }),
});

// Generic Approval Details (Line Items for non-PO)
export const approvalDetails = pgTable("tbl_approval_details", {
  sno: integer("sno").primaryKey(),
  refNo: varchar("ref_no", { length: 50 }).notNull(), // Links to approvalRequests.poRefNo
  productId: integer("product_id").references(() => products.productId),
  productName: varchar("product_name", { length: 200 }),
  specification: text("specification"),
  orderedQty: decimal("ordered_qty", { precision: 15, scale: 4 }),
  unitPrice: decimal("unit_price", { precision: 15, scale: 6 }),
  amount: decimal("amount", { precision: 15, scale: 2 }),
  vatAmount: decimal("vat_amount", { precision: 15, scale: 4 }),
  remarks: text("remarks")
});

// -------------------- Purchase Orders --------------------
export const purchaseOrderHdr = pgTable("tbl_purchase_order_hdr", {
  sno: integer("sno").primaryKey(),
  poRefNo: varchar("po_ref_no", { length: 50 }).notNull(),
  poDate: timestamp("po_date", { withTimezone: false }),
  purchaseType: varchar("purchase_type", { length: 50 }),
  companyId: integer("company_id").references(() => companies.companyId),
  supplierId: integer("supplier_id").references(() => suppliers.supplierId),
  poStoreId: integer("po_store_id").references(() => stores.storeId),
  remarks: text("remarks"),
  statusEntry: varchar("status_entry", { length: 20 }),
  createdBy: varchar("created_by", { length: 50 }),
  createdDate: timestamp("created_date", { withTimezone: false }),
  modifiedBy: varchar("modified_by", { length: 50 }),
  modifiedDate: timestamp("modified_date", { withTimezone: false }),
  paymentTerm: text("payment_term"),
  modeOfPayment: varchar("mode_of_payment", { length: 50 }),
  currencyType: varchar("currency_type", { length: 10 }),
  suplierProformaNumber: varchar("suplier_proforma_number", { length: 100 }),
  shipmentMode: varchar("shipment_mode", { length: 50 }),
  priceTerms: varchar("price_terms", { length: 50 }),
  shipmentRemarks: text("shipment_remarks"),
  totalProductionHdrAmount: decimal("total_production_hdr_amount", { precision: 15, scale: 2 }),
  totalAdditionalCostAmount: decimal("total_additional_cost_amount", { precision: 15, scale: 2 }),
  vatHdrAmount: decimal("vat_hdr_amount", { precision: 15, scale: 2 }),
  totalFinalProductionHdrAmount: decimal("total_final_production_hdr_amount", { precision: 15, scale: 2 }),
  requestedBy: varchar("requested_by", { length: 100 }),
  requestedDate: timestamp("requested_date", { withTimezone: false }),
  response1Person: varchar("response1_person", { length: 100 }),
  response1Date: timestamp("response1_date", { withTimezone: false }),
  response1Status: varchar("response1_status", { length: 20 }),
  response1Remarks: text("response1_remarks"),
  response2Person: varchar("response2_person", { length: 100 }),
  response2Date: timestamp("response2_date", { withTimezone: false }),
  response2Status: varchar("response2_status", { length: 20 }),
  response2Remarks: text("response2_remarks"),
  purchaseHeadResponsePerson: varchar("purchase_head_response_person", { length: 100 }),
  purchaseHeadResponseDate: timestamp("purchase_head_response_date", { withTimezone: false }),
  purchaseHeadResponseStatus: varchar("purchase_head_response_status", { length: 20 }),
  purchaseHeadResponseRemarks: text("purchase_head_response_remarks"),
  importsResponse1Person: varchar("imports_response1_person", { length: 100 }),
  importsResponse1Date: timestamp("imports_response1_date", { withTimezone: false }),
  importsResponse1Status: varchar("imports_response1_status", { length: 20 }),
  importsResponse1Remarks: text("imports_response1_remarks"),
  finalResponsePerson: varchar("final_response_person", { length: 100 }),
  finalResponseDate: timestamp("final_response_date", { withTimezone: false }),
  finalResponseStatus: varchar("final_response_status", { length: 20 }),
  finalResponseRemarks: text("final_response_remarks"),
  firstShipmentDate: timestamp("first_shipment_date", { withTimezone: false }),
  lcApplyTargetDate: timestamp("lc_apply_target_date", { withTimezone: false }),
  loadingPortId: integer("loading_port_id"),
  dischargePortId: integer("discharge_port_id"),
  shipmentType: varchar("shipment_type", { length: 50 }),
  supplierCompanyId: integer("supplier_company_id"),
  stockStoreId: integer("stock_store_id"),
  erpPiRefNo: varchar("erp_pi_ref_no", { length: 50 }),
  priceForCnfFob: varchar("price_for_cnf_fob", { length: 20 })
});

export const purchaseOrderDtl = pgTable("tbl_purchase_order_dtl", {
  sno: integer("sno").primaryKey(),
  poRefNo: varchar("po_ref_no", { length: 50 }).notNull(),
  requestStoreId: integer("request_store_id").references(() => stores.storeId),
  poRequestRefNo: varchar("po_request_ref_no", { length: 50 }),
  proformaInvoiceRefNo: varchar("proforma_invoice_ref_no", { length: 50 }),
  sectionId: integer("section_id"),
  machineId: integer("machine_id"),
  mainCategoryId: integer("main_category_id").references(() => mainCategories.mainCategoryId),
  subCategoryId: integer("sub_category_id").references(() => subCategories.subCategoryId),
  productId: integer("product_id").references(() => products.productId),
  packingType: varchar("packing_type", { length: 50 }),
  noPcsPerPacking: decimal("no_pcs_per_packing", { precision: 15, scale: 4 }),
  totalPcs: decimal("total_pcs", { precision: 15, scale: 4 }),
  totalPacking: decimal("total_packing", { precision: 15, scale: 4 }),
  ratePerPcs: decimal("rate_per_pcs", { precision: 15, scale: 6 }),
  productAmount: decimal("product_amount", { precision: 15, scale: 2 }),
  discountPercentage: decimal("discount_percentage", { precision: 15, scale: 2 }),
  discountAmount: decimal("discount_amount", { precision: 15, scale: 2 }),
  totalProductAmount: decimal("total_product_amount", { precision: 15, scale: 4 }),
  vatPercentage: decimal("vat_percentage", { precision: 15, scale: 2 }),
  vatAmount: decimal("vat_amount", { precision: 15, scale: 4 }),
  finalProductAmount: decimal("final_product_amount", { precision: 15, scale: 4 }),
  remarks: text("remarks"),
  statusEntry: varchar("status_entry", { length: 20 }),
  createdBy: varchar("created_by", { length: 50 }),
  createdDate: timestamp("created_date", { withTimezone: false }),
  alternateProductName: varchar("alternate_product_name", { length: 200 }),
  lcNeededStatus: varchar("lc_needed_status", { length: 20 }),
  lcApplyStatus: varchar("lc_apply_status", { length: 20 }),
  lcAppliedDate: timestamp("lc_applied_date", { withTimezone: false }),
  lcNo: varchar("lc_no", { length: 50 }),
  supDocFile: text("sup_doc_file"),
  truckId: integer("truck_id").references(() => trucks.truckId),
  trailerId: integer("trailer_id").references(() => trailers.trailerId),
  response1Person: varchar("response1_person", { length: 100 }),
  response1Date: timestamp("response1_date", { withTimezone: false }),
  response1Status: varchar("response1_status", { length: 20 }),
  response1Remarks: text("response1_remarks"),
  response1ApprovedTotalPacking: decimal("response1_approved_total_packing", { precision: 15, scale: 2 }),
  response1ApprovedTotalPcs: decimal("response1_approved_total_pcs", { precision: 15, scale: 2 }),
  response2Person: varchar("response2_person", { length: 100 }),
  response2Date: timestamp("response2_date", { withTimezone: false }),
  response2Status: varchar("response2_status", { length: 20 }),
  response2Remarks: text("response2_remarks"),
  response2ApprovedTotalPacking: decimal("response2_approved_total_packing", { precision: 15, scale: 2 }),
  response2ApprovedTotalPcs: decimal("response2_approved_total_pcs", { precision: 15, scale: 2 }),
  finalResponsePerson: varchar("final_response_person", { length: 100 }),
  finalResponseDate: timestamp("final_response_date", { withTimezone: false }),
  finalResponseStatus: varchar("final_response_status", { length: 20 }),
  finalResponseRemarks: text("final_response_remarks"),
  finalResponseApprovedTotalPacking: decimal("final_response_approved_total_packing", { precision: 15, scale: 2 }),
  finalResponseApprovedTotalPcs: decimal("final_response_approved_total_pcs", { precision: 15, scale: 2 })
});

export const purchaseOrderAdditionalCosts = pgTable("tbl_purchase_order_additional_costs", {
  sno: integer("sno").primaryKey(),
  poRefNo: varchar("po_ref_no", { length: 50 }).notNull(),
  additionalCostType: varchar("additional_cost_type", { length: 100 }),
  amount: decimal("amount", { precision: 15, scale: 2 }),
  vatAmount: decimal("vat_amount", { precision: 15, scale: 2 }),
  remarks: text("remarks"),
  statusMaster: varchar("status_master", { length: 20 }),
  createdBy: varchar("created_by", { length: 50 }),
  createdDate: timestamp("created_date", { withTimezone: false })
});

export const purchaseOrderConversation = pgTable("tbl_purchase_order_conversation", {
  sno: integer("sno").primaryKey(),
  poRefNo: varchar("po_ref_no", { length: 50 }).notNull(),
  respondPerson: varchar("respond_person", { length: 100 }),
  discussionDetails: text("discussion_details"),
  responseStatus: varchar("response_status", { length: 20 }),
  statusEntry: varchar("status_entry", { length: 20 }),
  remarks: text("remarks"),
  createdBy: varchar("created_by", { length: 50 }),
  createdDate: timestamp("created_date", { withTimezone: false })
});

export const purchaseOrderFiles = pgTable("tbl_purchase_order_files", {
  sno: integer("sno").primaryKey(),
  poRefNo: varchar("po_ref_no", { length: 50 }).notNull(),
  descriptionDetails: varchar("description_details", { length: 150 }),
  fileName: varchar("file_name", { length: 150 }),
  contentType: varchar("content_type", { length: 100 }),
  contentData: text("content_data"),
  statusMaster: varchar("status_master", { length: 20 }),
  createdBy: varchar("created_by", { length: 50 }),
  createdDate: timestamp("created_date", { withTimezone: false }),
  fileType: varchar("file_type", { length: 50 })
});

// -------------------- Chat & Messenger --------------------
export const chatMessages = pgTable("tbl_chat_messages", {
  id: serial("id").primaryKey(), 
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  imageUrl: text("image_url"),
  fileUrl: text("file_url"),
  fileName: varchar("file_name", { length: 255 }),
  fileType: varchar("file_type", { length: 100 }),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const userStatus = pgTable("tbl_user_status", {
  userId: integer("user_id").primaryKey().references(() => users.id),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen", { withTimezone: true }).defaultNow(),
});

// -------------------- Relations --------------------
export const companiesRelations = relations(companies, ({ many }) => ({
  stores: many(stores)
}));

export const storesRelations = relations(stores, ({ one }) => ({
  company: one(companies, {
    fields: [stores.companyId],
    references: [companies.companyId]
  })
}));

export const purchaseOrderHdrRelations = relations(purchaseOrderHdr, ({ many }) => ({
  details: many(purchaseOrderDtl),
  additionalCosts: many(purchaseOrderAdditionalCosts),
  conversations: many(purchaseOrderConversation),
  files: many(purchaseOrderFiles)
}));

export const purchaseOrderDtlRelations = relations(purchaseOrderDtl, ({ one }) => ({
  header: one(purchaseOrderHdr, {
    fields: [purchaseOrderDtl.poRefNo],
    references: [purchaseOrderHdr.poRefNo]
  }),
  product: one(products, {
    fields: [purchaseOrderDtl.productId],
    references: [products.productId]
  })
}));

export const approvalRequestsRelations = relations(approvalRequests, ({ many }) => ({
  details: many(approvalDetails),
  conversations: many(purchaseOrderConversation), // Shared for now or create generic
  files: many(purchaseOrderFiles) // Shared for now
}));

export const approvalDetailsRelations = relations(approvalDetails, ({ one }) => ({
  header: one(approvalRequests, {
    fields: [approvalDetails.refNo],
    references: [approvalRequests.poRefNo]
  }),
  product: one(products, {
    fields: [approvalDetails.productId],
    references: [products.productId]
  })
}));
