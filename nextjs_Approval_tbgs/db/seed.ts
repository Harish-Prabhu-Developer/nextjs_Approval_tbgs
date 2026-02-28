// // db/seed.ts
// import { db } from './index';
// import { 
//   tblDashboard, 
//   tblApprovalTypes,
//   tblCompany,
//   tblDepartment,
//   tblSupplier,
//   tblProduct 
// } from './schema';
// import { eq } from 'drizzle-orm';

// async function seed() {
//   console.log('🌱 Seeding database...');

//   // 1. Seed Approval Types
//   console.log('Seeding approval types...');
  
//   const approvalTypesList = [
//     {
//       approvalCode: 'PO_APPROVAL',
//       approvalName: 'PO Approval',
//       sourceTable: 'tbl_purchase_order_hdr',
//       requiresLevel2: true,
//     },
//     {
//       approvalCode: 'CASH_ADVANCE_APPROVAL',
//       approvalName: 'Cash Advance Approval',
//       sourceTable: 'tbl_cash_advance',
//       requiresLevel2: true,
//     },
//     {
//       approvalCode: 'CREDIT_LIMIT_APPROVAL',
//       approvalName: 'Credit Limit Approval',
//       sourceTable: 'tbl_credit_limit',
//       requiresLevel2: true,
//     },
//     {
//       approvalCode: 'PRICE_APPROVAL',
//       approvalName: 'Price Approval',
//       sourceTable: 'tbl_price_approval',
//       requiresLevel2: false,
//     },
//     { approvalCode: 'GOODS_REQUEST_APPROVAL', approvalName: 'Goods Request Approval', sourceTable: 'tbl_approval_transactions', requiresLevel2: true },
//     { approvalCode: 'INTERCOMPANY_APPROVAL', approvalName: 'Inter-company Approval', sourceTable: 'tbl_approval_transactions', requiresLevel2: true },
//     { approvalCode: 'SALES_RETURN_APPROVAL', approvalName: 'Sales Return Approval', sourceTable: 'tbl_approval_transactions', requiresLevel2: true },
//     { approvalCode: 'GATE_PASS_APPROVAL', approvalName: 'Gate Pass Approval', sourceTable: 'tbl_approval_transactions', requiresLevel2: true },
//     { approvalCode: 'PRODUCT_CREATION_APPROVAL', approvalName: 'Product Creation Approval', sourceTable: 'tbl_approval_transactions', requiresLevel2: true },
//     { approvalCode: 'CUSTOMER_CREATION_APPROVAL', approvalName: 'Customer Creation Approval', sourceTable: 'tbl_approval_transactions', requiresLevel2: true },
//     { approvalCode: 'WASTAGE_DELIVERY_APPROVAL', approvalName: 'Wastage Delivery Approval', sourceTable: 'tbl_approval_transactions', requiresLevel2: true },
//     { approvalCode: 'WORK_ORDER_APPROVAL', approvalName: 'Work Order Approval', sourceTable: 'tbl_approval_transactions', requiresLevel2: true },
//     { approvalCode: 'PFL_WORK_ORDER_APPROVAL', approvalName: 'PFL Work Order Approval', sourceTable: 'tbl_approval_transactions', requiresLevel2: true },
//     { approvalCode: 'PPRB_ROLL_CUTT_TEMPLATES', approvalName: 'PPRB Roll Cutt Templates', sourceTable: 'tbl_approval_transactions', requiresLevel2: true },
//     { approvalCode: 'EXPAT_TRAVEL_LEAVE_APPROVAL', approvalName: 'Expat Travel Leave Approval', sourceTable: 'tbl_approval_transactions', requiresLevel2: true },
//     { approvalCode: 'SALES_PI_APPROVAL', approvalName: 'SALES PI Approval', sourceTable: 'tbl_approval_transactions', requiresLevel2: true },
//     { approvalCode: 'PURCHASE_PI_APPROVAL', approvalName: 'PURCHASE PI Approval', sourceTable: 'tbl_approval_transactions', requiresLevel2: true },
//     { approvalCode: 'APPARELS_DASHBOARD', approvalName: 'Apparels Dashboard', sourceTable: 'tbl_approval_transactions', requiresLevel2: true },
//     { approvalCode: 'PO_APPROVAL_HEAD', approvalName: 'PO Approval Head', sourceTable: 'tbl_approval_transactions', requiresLevel2: true },
//     { approvalCode: 'OVERTIME_APPROVAL', approvalName: 'Overtime Approval', sourceTable: 'tbl_approval_transactions', requiresLevel2: true },
//     { approvalCode: 'EXPAT_LEAVE_ENCASHMENT', approvalName: 'Expat Leave Encashment', sourceTable: 'tbl_approval_transactions', requiresLevel2: true },
//     { approvalCode: 'BONCE_PO_APPROVAL', approvalName: 'Bonce Purchase Order Approval', sourceTable: 'tbl_approval_transactions', requiresLevel2: true },
//     { approvalCode: 'BOND_RELEASE_APPROVAL', approvalName: 'Bond Release Request Approval', sourceTable: 'tbl_approval_transactions', requiresLevel2: true },
//   ];

//   for (const type of approvalTypesList) {
//     await db.insert(tblApprovalTypes).values(type).onConflictDoNothing();
//   }

//   // 2. Seed Dashboard Cards
//   console.log('Seeding dashboard cards...');

//   const allApprovalTypes = await db.select().from(tblApprovalTypes);
//   const getTypeSno = (code: string) => allApprovalTypes.find(t => t.approvalCode === code)?.sno;

//   const dashboardCards = [
//     { cardTitle: 'PO Approval', permissionColumn: 'poApproval', routeSlug: 'po-approval', iconKey: 'FileCheck', backgroundColor: 'indigo', displayOrder: 1, approvalTypeId: getTypeSno('PO_APPROVAL') },
//     { cardTitle: 'Cash Advance Approval', permissionColumn: 'cashAdvanceApproval', routeSlug: 'cash-advance-approval', iconKey: 'Wallet', backgroundColor: 'emerald', displayOrder: 2, approvalTypeId: getTypeSno('CASH_ADVANCE_APPROVAL') },
//     { cardTitle: 'Credit Limit Approval', permissionColumn: 'creditLimitApproval', routeSlug: 'credit-limit-approval', iconKey: 'CreditCard', backgroundColor: 'amber', displayOrder: 3, approvalTypeId: getTypeSno('CREDIT_LIMIT_APPROVAL') },
//     { cardTitle: 'Price Approval', permissionColumn: 'priceApproval', routeSlug: 'price-approval', iconKey: 'Tag', backgroundColor: 'purple', displayOrder: 4, approvalTypeId: getTypeSno('PRICE_APPROVAL') },
//     { cardTitle: 'Goods Request Approval', permissionColumn: 'goodsRequestApproval', routeSlug: 'goods-request-approval', iconKey: 'PackageCheck', backgroundColor: 'blue', displayOrder: 5, approvalTypeId: getTypeSno('GOODS_REQUEST_APPROVAL') },
//     { cardTitle: 'Inter-company Approval', permissionColumn: 'intercompanyApproval', routeSlug: 'inter-company-approval', iconKey: 'Building2', backgroundColor: 'rose', displayOrder: 6, approvalTypeId: getTypeSno('INTERCOMPANY_APPROVAL') },
//     { cardTitle: 'Sales Return Approval', permissionColumn: 'salesReturnApproval', routeSlug: 'sales-return-approval', iconKey: 'RotateCcw', backgroundColor: 'orange', displayOrder: 7, approvalTypeId: getTypeSno('SALES_RETURN_APPROVAL') },
//     { cardTitle: 'Gate Pass Approval', permissionColumn: 'gatePassApproval', routeSlug: 'gate-pass-approval', iconKey: 'DoorOpen', backgroundColor: 'cyan', displayOrder: 8, approvalTypeId: getTypeSno('GATE_PASS_APPROVAL') },
//     { cardTitle: 'Product Creation Approval', permissionColumn: 'productCreationApproval', routeSlug: 'product-creation-approval', iconKey: 'Boxes', backgroundColor: 'pink', displayOrder: 9, approvalTypeId: getTypeSno('PRODUCT_CREATION_APPROVAL') },
//     { cardTitle: 'Customer Creation Approval', permissionColumn: 'customerCreationApproval', routeSlug: 'customer-creation-approval', iconKey: 'UserPlus', backgroundColor: 'teal', displayOrder: 10, approvalTypeId: getTypeSno('CUSTOMER_CREATION_APPROVAL') },
//     { cardTitle: 'Wastage Delivery Approval', permissionColumn: 'wastageDeliveryApproval', routeSlug: 'wastage-delivery-approval', iconKey: 'Trash2', backgroundColor: 'red', displayOrder: 11, approvalTypeId: getTypeSno('WASTAGE_DELIVERY_APPROVAL') },
//     { cardTitle: 'Work Order Approval', permissionColumn: 'workOrderApproval', routeSlug: 'work-order-approval', iconKey: 'ClipboardList', backgroundColor: 'violet', displayOrder: 12, approvalTypeId: getTypeSno('WORK_ORDER_APPROVAL') },
//     { cardTitle: 'PFL Work Order Approval', permissionColumn: 'pflWorkOrderApproval', routeSlug: 'pfl-work-order-approval', iconKey: 'Factory', backgroundColor: 'sky', displayOrder: 13, approvalTypeId: getTypeSno('PFL_WORK_ORDER_APPROVAL') },
//     { cardTitle: 'PPRB Roll Cutt Templates', permissionColumn: 'pprbRollCuttTemplates', routeSlug: 'pprb-roll-cutt-templates', iconKey: 'Scissors', backgroundColor: 'lime', displayOrder: 14, approvalTypeId: getTypeSno('PPRB_ROLL_CUTT_TEMPLATES') },
//     { cardTitle: 'Expat Travel Leave Approval', permissionColumn: 'expatTravelLeaveApproval', routeSlug: 'expat-travel-leave-approval', iconKey: 'Plane', backgroundColor: 'fuchsia', displayOrder: 15, approvalTypeId: getTypeSno('EXPAT_TRAVEL_LEAVE_APPROVAL') },
//     { cardTitle: 'SALES PI Approval', permissionColumn: 'salesPiApproval', routeSlug: 'sales-pi-approval', iconKey: 'ReceiptText', backgroundColor: 'indigo', displayOrder: 16, approvalTypeId: getTypeSno('SALES_PI_APPROVAL') },
//     { cardTitle: 'PURCHASE PI Approval', permissionColumn: 'purchasePiApproval', routeSlug: 'purchase-pi-approval', iconKey: 'ShoppingCart', backgroundColor: 'emerald', displayOrder: 17, approvalTypeId: getTypeSno('PURCHASE_PI_APPROVAL') },
//     { cardTitle: 'Apparels Dashboard', permissionColumn: 'apparelsDashboard', routeSlug: 'apparels-dashboard', iconKey: 'Shirt', backgroundColor: 'amber', displayOrder: 18, approvalTypeId: getTypeSno('APPARELS_DASHBOARD') },
//     { cardTitle: 'PO Approval Head', permissionColumn: 'poApprovalHead', routeSlug: 'po-approval-head', iconKey: 'ShieldCheck', backgroundColor: 'purple', displayOrder: 19, approvalTypeId: getTypeSno('PO_APPROVAL_HEAD') },
//     { cardTitle: 'Overtime Approval', permissionColumn: 'overtimeApproval', routeSlug: 'overtime-approval', iconKey: 'Clock', backgroundColor: 'blue', displayOrder: 20, approvalTypeId: getTypeSno('OVERTIME_APPROVAL') },
//     { cardTitle: 'Expat Leave Encashment', permissionColumn: 'expatLeaveEncashment', routeSlug: 'expat-leave-encashment', iconKey: 'HandCoins', backgroundColor: 'rose', displayOrder: 21, approvalTypeId: getTypeSno('EXPAT_LEAVE_ENCASHMENT') },
//     { cardTitle: 'Bonce Purchase Order Approval', permissionColumn: 'boncePurchaseorderApproval', routeSlug: 'bonce-po-approval', iconKey: 'ShoppingCart', backgroundColor: 'orange', displayOrder: 22, approvalTypeId: getTypeSno('BONCE_PO_APPROVAL') },
//     { cardTitle: 'Bond Release Request Approval', permissionColumn: 'bondReleaseRequestApproval', routeSlug: 'bond-release-approval', iconKey: 'LockKeyhole', backgroundColor: 'cyan', displayOrder: 23, approvalTypeId: getTypeSno('BOND_RELEASE_APPROVAL') },
//   ];

//   for (const card of dashboardCards) {
//     await db.insert(tblDashboard).values({ ...card, cardValue: 0, statusMaster: 'Active' }).onConflictDoNothing();
//   }


//   console.log('✅ Seeding completed!');
// }

// seed().catch(console.error);