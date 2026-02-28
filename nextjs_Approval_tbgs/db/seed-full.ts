// import { db } from './index';
// import { 
//   users,
//   tblCompany,
//   tblDepartment,
//   tblSupplier,
//   tblProduct,
//   tblApprovalTypes,
//   tblDashboard,
//   tblApprovalTransactions,
//   tblPurchaseOrderHdr,
//   tblPurchaseOrderDtl,
//   tblPurchaseOrderAdditionalCostDetails,
//   tblPurchaseOrderConversationDtl,
//   tblPurchaseOrderFilesUpload,
//   tblNotifications,
//   tblCashAdvance,
//   tblCreditLimit,
//   tblPriceApproval 
// } from './schema';
// import { sql } from 'drizzle-orm';

// async function seed() {
//   console.log('🌱 Seeding database with comprehensive test data...');

//   // ============= 1. COMPANIES (10 records) =============
//   console.log('Seeding companies...');
//   const companies = [
//     { companyCode: 'AZ001', companyName: 'AZ Industries Ltd', shortName: 'AZ', address: 'Dar es Salaam, Tanzania', phone: '+255 123 456 789', email: 'info@azindustries.co.tz', taxId: 'TIN123456', status: 'Active' },
//     { companyCode: 'TB002', companyName: 'TBGS Group', shortName: 'TBGS', address: 'Arusha, Tanzania', phone: '+255 789 123 456', email: 'info@tbgs.co.tz', taxId: 'TIN789012', status: 'Active' },
//     { companyCode: 'VF003', companyName: 'Vision Infotech Ltd', shortName: 'VIT', address: 'Dar es Salaam, Tanzania', phone: '+255 712 345 678', email: 'info@visioninfotech.co.tz', taxId: 'TIN345678', status: 'Active' },
//     { companyCode: 'PM004', companyName: 'Polyfoam Manufacturing', shortName: 'PM', address: 'Mwanza, Tanzania', phone: '+255 756 789 012', email: 'sales@polyfoam.co.tz', taxId: 'TIN901234', status: 'Active' },
//     { companyCode: 'AM005', companyName: 'Addamo Marina Hardware', shortName: 'AMH', address: 'Zanzibar, Tanzania', phone: '+255 773 456 789', email: 'orders@addamo.co.tz', taxId: 'TIN567890', status: 'Active' },
//     { companyCode: 'EP006', companyName: 'Expat Packers Ltd', shortName: 'EPL', address: 'Dar es Salaam, Tanzania', phone: '+255 784 901 234', email: 'info@expatpackers.co.tz', taxId: 'TIN234567', status: 'Active' },
//     { companyCode: 'TC007', companyName: 'Tanzania Cables', shortName: 'TC', address: 'Arusha, Tanzania', phone: '+255 798 345 678', email: 'info@tancables.co.tz', taxId: 'TIN890123', status: 'Active' },
//     { companyCode: 'EW008', companyName: 'East West Logistics', shortName: 'EWL', address: 'Dar es Salaam, Tanzania', phone: '+255 713 456 789', email: 'ops@ewlogistics.co.tz', taxId: 'TIN456789', status: 'Active' },
//     { companyCode: 'SI009', companyName: 'SIDO Industrial', shortName: 'SIDO', address: 'Mbeya, Tanzania', phone: '+255 767 890 123', email: 'info@sido.go.tz', taxId: 'TIN012345', status: 'Active' },
//     { companyCode: 'TT010', companyName: 'Tanzania Trading Co', shortName: 'TTC', address: 'Dar es Salaam, Tanzania', phone: '+255 754 567 890', email: 'sales@tztrading.co.tz', taxId: 'TIN678901', status: 'Active' },
//   ];
  
//   for (const company of companies) {
//     await db.insert(tblCompany).values(company).onConflictDoNothing();
//   }

//   // ============= 2. DEPARTMENTS (10+ records) =============
//   console.log('Seeding departments...');
//   const companyResult = await db.select().from(tblCompany);
//   const companyMap = Object.fromEntries(companyResult.map(c => [c.companyCode, c.sno]));
  
//   const departments = [
//     { departmentCode: 'DEPT001', departmentName: 'ATOZ 1 DEPT', companyId: companyMap['AZ001'], status: 'Active' },
//     { departmentCode: 'DEPT002', departmentName: 'AZ MEDICAL', companyId: companyMap['AZ001'], status: 'Active' },
//     { departmentCode: 'DEPT003', departmentName: 'FLEXIBLE PACKAGING', companyId: companyMap['AZ001'], status: 'Active' },
//     { departmentCode: 'DEPT004', departmentName: 'RIGID PACKAGING', companyId: companyMap['AZ001'], status: 'Active' },
//     { departmentCode: 'DEPT005', departmentName: 'IT DEPARTMENT', companyId: companyMap['VF003'], status: 'Active' },
//     { departmentCode: 'DEPT006', departmentName: 'FINANCE', companyId: companyMap['VF003'], status: 'Active' },
//     { departmentCode: 'DEPT007', departmentName: 'HR & ADMIN', companyId: companyMap['TB002'], status: 'Active' },
//     { departmentCode: 'DEPT008', departmentName: 'PROCUREMENT', companyId: companyMap['TB002'], status: 'Active' },
//     { departmentCode: 'DEPT009', departmentName: 'WAREHOUSE', companyId: companyMap['PM004'], status: 'Active' },
//     { departmentCode: 'DEPT010', departmentName: 'MAINTENANCE', companyId: companyMap['PM004'], status: 'Active' },
//     { departmentCode: 'DEPT011', departmentName: 'QUALITY CONTROL', companyId: companyMap['AM005'], status: 'Active' },
//     { departmentCode: 'DEPT012', departmentName: 'PRODUCTION', companyId: companyMap['AM005'], status: 'Active' },
//     { departmentCode: 'DEPT013', departmentName: 'LOGISTICS', companyId: companyMap['EW008'], status: 'Active' },
//   ];
  
//   for (const dept of departments) {
//     await db.insert(tblDepartment).values(dept).onConflictDoNothing();
//   }

//   // ============= 3. SUPPLIERS (15 records) =============
//   console.log('Seeding suppliers...');
//   const suppliers = [
//     { supplierCode: 'SUP001', supplierName: 'ADDAMO MARINA HARDWARE', contactPerson: 'John Mushi', phone: '+255 716 123 456', email: 'john@addamo.co.tz', address: 'Dar es Salaam', taxId: 'TIN111111', paymentTerms: 'Net 30', status: 'Active' },
//     { supplierCode: 'SUP002', supplierName: 'VISION INFOTECH LTD', contactPerson: 'Sarah Kimaro', phone: '+255 717 234 567', email: 'sarah@vision.co.tz', address: 'Dar es Salaam', taxId: 'TIN222222', paymentTerms: 'Net 45', status: 'Active' },
//     { supplierCode: 'SUP003', supplierName: 'POLYFOAM LIMITED', contactPerson: 'Michael Peter', phone: '+255 718 345 678', email: 'michael@polyfoam.co.tz', address: 'Mwanza', taxId: 'TIN333333', paymentTerms: 'Net 30', status: 'Active' },
//     { supplierCode: 'SUP004', supplierName: 'TANZANIA BREWERIES', contactPerson: 'Elizabeth John', phone: '+255 719 456 789', email: 'elizabeth@tbl.co.tz', address: 'Dar es Salaam', taxId: 'TIN444444', paymentTerms: 'Net 60', status: 'Active' },
//     { supplierCode: 'SUP005', supplierName: 'BIDCO TANZANIA', contactPerson: 'Robert Mwanga', phone: '+255 720 567 890', email: 'robert@bidco.co.tz', address: 'Dar es Salaam', taxId: 'TIN555555', paymentTerms: 'Net 30', status: 'Active' },
//     { supplierCode: 'SUP006', supplierName: 'LAKE OIL LTD', contactPerson: 'Grace Mlay', phone: '+255 721 678 901', email: 'grace@lakeoil.co.tz', address: 'Mwanza', taxId: 'TIN666666', paymentTerms: 'Net 30', status: 'Active' },
//     { supplierCode: 'SUP007', supplierName: 'MOHAMED ENTERPRISES', contactPerson: 'Ali Mohamed', phone: '+255 722 789 012', email: 'ali@mohamed.co.tz', address: 'Zanzibar', taxId: 'TIN777777', paymentTerms: 'Cash', status: 'Active' },
//     { supplierCode: 'SUP008', supplierName: 'SABIC INNOVATIVE', contactPerson: 'David Smith', phone: '+255 723 890 123', email: 'david@sabic.com', address: 'Dar es Salaam', taxId: 'TIN888888', paymentTerms: 'Net 45', status: 'Active' },
//     { supplierCode: 'SUP009', supplierName: 'BASF EAST AFRICA', contactPerson: 'Julia Mrosso', phone: '+255 724 901 234', email: 'julia@basf.co.tz', address: 'Dar es Salaam', taxId: 'TIN999999', paymentTerms: 'Net 60', status: 'Active' },
//     { supplierCode: 'SUP010', supplierName: 'DOW CHEMICAL', contactPerson: 'Thomas Ngowi', phone: '+255 725 012 345', email: 'thomas@dow.com', address: 'Arusha', taxId: 'TIN101010', paymentTerms: 'Net 45', status: 'Active' },
//     { supplierCode: 'SUP011', supplierName: 'EXXON MOBIL', contactPerson: 'Catherine Maeda', phone: '+255 726 123 456', email: 'catherine@exxon.com', address: 'Dar es Salaam', taxId: 'TIN111110', paymentTerms: 'Net 30', status: 'Active' },
//     { supplierCode: 'SUP012', supplierName: 'SHELL TANZANIA', contactPerson: 'James Mwakyembe', phone: '+255 727 234 567', email: 'james@shell.co.tz', address: 'Dar es Salaam', taxId: 'TIN111112', paymentTerms: 'Net 30', status: 'Active' },
//     { supplierCode: 'SUP013', supplierName: 'TOTAL ENERGIES', contactPerson: 'Patricia Kwayu', phone: '+255 728 345 678', email: 'patricia@total.co.tz', address: 'Dar es Salaam', taxId: 'TIN111113', paymentTerms: 'Net 30', status: 'Active' },
//     { supplierCode: 'SUP014', supplierName: 'UNILEVER TANZANIA', contactPerson: 'Joseph Shao', phone: '+255 729 456 789', email: 'joseph@unilever.co.tz', address: 'Dar es Salaam', taxId: 'TIN111114', paymentTerms: 'Net 60', status: 'Active' },
//     { supplierCode: 'SUP015', supplierName: 'P&G EAST AFRICA', contactPerson: 'Mary Kisanga', phone: '+255 730 567 890', email: 'mary@pg.com', address: 'Dar es Salaam', taxId: 'TIN111115', paymentTerms: 'Net 45', status: 'Active' },
//   ];
  
//   for (const supplier of suppliers) {
//     await db.insert(tblSupplier).values(supplier).onConflictDoNothing();
//   }

//   // ============= 4. PRODUCTS (20 records) =============
//   console.log('Seeding products...');
//   const products = [
//     { productCode: 'PROD001', productName: 'RED SILICON B50/PC', category: 'Raw Material', subCategory: 'Silicon', unit: 'PCS', description: 'Red silicon compound for molding', status: 'Active' },
//     { productCode: 'PROD002', productName: 'BLACK MASTERBATCH', category: 'Raw Material', subCategory: 'Colorant', unit: 'KG', description: 'Black color masterbatch', status: 'Active' },
//     { productCode: 'PROD003', productName: 'LLDPE FILM GRADE', category: 'Raw Material', subCategory: 'Polyethylene', unit: 'KG', description: 'Linear low density polyethylene', status: 'Active' },
//     { productCode: 'PROD004', productName: 'HDPE INJECTION GRADE', category: 'Raw Material', subCategory: 'Polyethylene', unit: 'KG', description: 'High density polyethylene for injection molding', status: 'Active' },
//     { productCode: 'PROD005', productName: 'PP HOMOPOLYMER', category: 'Raw Material', subCategory: 'Polypropylene', unit: 'KG', description: 'Polypropylene homopolymer', status: 'Active' },
//     { productCode: 'PROD006', productName: 'PP COPOLYMER', category: 'Raw Material', subCategory: 'Polypropylene', unit: 'KG', description: 'Polypropylene copolymer', status: 'Active' },
//     { productCode: 'PROD007', productName: 'PVC SUSPENSION', category: 'Raw Material', subCategory: 'PVC', unit: 'KG', description: 'PVC suspension grade', status: 'Active' },
//     { productCode: 'PROD008', productName: 'PET BOTTLE GRADE', category: 'Raw Material', subCategory: 'Polyester', unit: 'KG', description: 'PET for bottle manufacturing', status: 'Active' },
//     { productCode: 'PROD009', productName: 'PS GENERAL PURPOSE', category: 'Raw Material', subCategory: 'Polystyrene', unit: 'KG', description: 'General purpose polystyrene', status: 'Active' },
//     { productCode: 'PROD010', productName: 'ABS INJECTION GRADE', category: 'Raw Material', subCategory: 'ABS', unit: 'KG', description: 'Acrylonitrile butadiene styrene', status: 'Active' },
//     { productCode: 'PROD011', productName: 'NYLON 6', category: 'Raw Material', subCategory: 'Polyamide', unit: 'KG', description: 'Nylon 6 engineering plastic', status: 'Active' },
//     { productCode: 'PROD012', productName: 'PC CLEAR GRADE', category: 'Raw Material', subCategory: 'Polycarbonate', unit: 'KG', description: 'Clear polycarbonate', status: 'Active' },
//     { productCode: 'PROD013', productName: 'PMMA ACRYLIC', category: 'Raw Material', subCategory: 'Acrylic', unit: 'KG', description: 'PMMA acrylic resin', status: 'Active' },
//     { productCode: 'PROD014', productName: 'TPU ELASTOMER', category: 'Raw Material', subCategory: 'Thermoplastic', unit: 'KG', description: 'Thermoplastic polyurethane', status: 'Active' },
//     { productCode: 'PROD015', productName: 'EVA FILM GRADE', category: 'Raw Material', subCategory: 'EVA', unit: 'KG', description: 'Ethylene vinyl acetate', status: 'Active' },
//     { productCode: 'PROD016', productName: 'WHITE TIO2', category: 'Raw Material', subCategory: 'Pigment', unit: 'KG', description: 'Titanium dioxide white pigment', status: 'Active' },
//     { productCode: 'PROD017', productName: 'UV STABILIZER', category: 'Additive', subCategory: 'Stabilizer', unit: 'KG', description: 'UV light stabilizer', status: 'Active' },
//     { productCode: 'PROD018', productName: 'ANTIOXIDANT 1010', category: 'Additive', subCategory: 'Antioxidant', unit: 'KG', description: 'Primary antioxidant', status: 'Active' },
//     { productCode: 'PROD019', productName: 'ANTISTATIC AGENT', category: 'Additive', subCategory: 'Antistat', unit: 'KG', description: 'Antistatic additive', status: 'Active' },
//     { productCode: 'PROD020', productName: 'FLAME RETARDANT', category: 'Additive', subCategory: 'FR', unit: 'KG', description: 'Halogen-free flame retardant', status: 'Active' },
//   ];
  
//   for (const product of products) {
//     await db.insert(tblProduct).values(product).onConflictDoNothing();
//   }

//   // ============= 5. USERS (15 records) =============
//   console.log('Seeding users...');
//   const usersData = [
//     { newCardNo: 1001, empName: 'Raw Mushi', userApprovalName: 'raw', signature: 'RM', emailAddress: 'raw.mushi@az.co.tz', companyId: companyMap['AZ001'], statusEntry: 'Active', orderNo: 'EMP001', passwordUser: 'password123', employeeSignedAs: 'REQUISITIONER', 
//       salesPiApproval: false, purchasePiApproval: false, apparelsDashboard: false, poApprovalHead: false, overtimeApproval: false, expatLeaveEncashment: false, 
//       boncePurchaseorderApproval: false, bondReleaseRequestApproval: false, wastageDeliveryApproval: false, workOrderApproval: false, pflWorkOrderApproval: false, 
//       pprbRollCuttTemplates: false, expatTravelLeaveApproval: false, poApproval: true, cashAdvanceApproval: true, creditLimitApproval: false, priceApproval: false, 
//       goodsRequestApproval: true, intercompanyApproval: false, salesReturnApproval: false, gatePassApproval: false, productCreationApproval: false, 
//       customerCreationApproval: false, otp: null, isActive: true },
    
//     { newCardNo: 1002, empName: 'Kalpesh Patel', userApprovalName: 'Mr. Kalpesh', signature: 'KP', emailAddress: 'kalpesh.patel@az.co.tz', companyId: companyMap['AZ001'], statusEntry: 'Active', orderNo: 'EMP002', passwordUser: 'password123', employeeSignedAs: 'LEVEL1_APPROVER', 
//       salesPiApproval: true, purchasePiApproval: true, apparelsDashboard: false, poApprovalHead: true, overtimeApproval: true, expatLeaveEncashment: false, 
//       boncePurchaseorderApproval: true, bondReleaseRequestApproval: false, wastageDeliveryApproval: true, workOrderApproval: true, pflWorkOrderApproval: false, 
//       pprbRollCuttTemplates: false, expatTravelLeaveApproval: true, poApproval: true, cashAdvanceApproval: true, creditLimitApproval: true, priceApproval: true, 
//       goodsRequestApproval: true, intercompanyApproval: true, salesReturnApproval: true, gatePassApproval: true, productCreationApproval: true, 
//       customerCreationApproval: true, otp: null, isActive: true },
    
//     { newCardNo: 1003, empName: 'Shaaf Mohamed', userApprovalName: 'Shaaf', signature: 'SM', emailAddress: 'shaaf@az.co.tz', companyId: companyMap['AZ001'], statusEntry: 'Active', orderNo: 'EMP003', passwordUser: 'password123', employeeSignedAs: 'LEVEL2_APPROVER', 
//       salesPiApproval: true, purchasePiApproval: true, apparelsDashboard: true, poApprovalHead: true, overtimeApproval: true, expatLeaveEncashment: true, 
//       boncePurchaseorderApproval: true, bondReleaseRequestApproval: true, wastageDeliveryApproval: true, workOrderApproval: true, pflWorkOrderApproval: true, 
//       pprbRollCuttTemplates: true, expatTravelLeaveApproval: true, poApproval: true, cashAdvanceApproval: true, creditLimitApproval: true, priceApproval: true, 
//       goodsRequestApproval: true, intercompanyApproval: true, salesReturnApproval: true, gatePassApproval: true, productCreationApproval: true, 
//       customerCreationApproval: true, otp: null, isActive: true },
    
//     { newCardNo: 1004, empName: 'Sarah Kimaro', userApprovalName: 'sarah.k', signature: 'SK', emailAddress: 'sarah@vision.co.tz', companyId: companyMap['VF003'], statusEntry: 'Active', orderNo: 'EMP004', passwordUser: 'password123', employeeSignedAs: 'FINANCE_MANAGER', 
//       salesPiApproval: true, purchasePiApproval: true, apparelsDashboard: false, poApprovalHead: false, overtimeApproval: false, expatLeaveEncashment: false, 
//       boncePurchaseorderApproval: false, bondReleaseRequestApproval: false, wastageDeliveryApproval: false, workOrderApproval: false, pflWorkOrderApproval: false, 
//       pprbRollCuttTemplates: false, expatTravelLeaveApproval: false, poApproval: false, cashAdvanceApproval: true, creditLimitApproval: true, priceApproval: true, 
//       goodsRequestApproval: false, intercompanyApproval: true, salesReturnApproval: false, gatePassApproval: false, productCreationApproval: false, 
//       customerCreationApproval: false, otp: null, isActive: true },
    
//     { newCardNo: 1005, empName: 'John Mushi', userApprovalName: 'john.m', signature: 'JM', emailAddress: 'john@addamo.co.tz', companyId: companyMap['AM005'], statusEntry: 'Active', orderNo: 'EMP005', passwordUser: 'password123', employeeSignedAs: 'SUPPLIER_REP', 
//       salesPiApproval: false, purchasePiApproval: false, apparelsDashboard: false, poApprovalHead: false, overtimeApproval: false, expatLeaveEncashment: false, 
//       boncePurchaseorderApproval: false, bondReleaseRequestApproval: false, wastageDeliveryApproval: false, workOrderApproval: false, pflWorkOrderApproval: false, 
//       pprbRollCuttTemplates: false, expatTravelLeaveApproval: false, poApproval: false, cashAdvanceApproval: false, creditLimitApproval: false, priceApproval: false, 
//       goodsRequestApproval: false, intercompanyApproval: false, salesReturnApproval: false, gatePassApproval: false, productCreationApproval: false, 
//       customerCreationApproval: false, otp: null, isActive: true },
    
//     { newCardNo: 1006, empName: 'Elizabeth John', userApprovalName: 'elizabeth.j', signature: 'EJ', emailAddress: 'elizabeth@tbl.co.tz', companyId: companyMap['TB002'], statusEntry: 'Active', orderNo: 'EMP006', passwordUser: 'password123', employeeSignedAs: 'PROCUREMENT_OFFICER', 
//       salesPiApproval: true, purchasePiApproval: true, apparelsDashboard: false, poApprovalHead: false, overtimeApproval: false, expatLeaveEncashment: false, 
//       boncePurchaseorderApproval: false, bondReleaseRequestApproval: false, wastageDeliveryApproval: false, workOrderApproval: true, pflWorkOrderApproval: true, 
//       pprbRollCuttTemplates: false, expatTravelLeaveApproval: false, poApproval: true, cashAdvanceApproval: false, creditLimitApproval: false, priceApproval: true, 
//       goodsRequestApproval: true, intercompanyApproval: false, salesReturnApproval: false, gatePassApproval: false, productCreationApproval: false, 
//       customerCreationApproval: false, otp: null, isActive: true },
    
//     { newCardNo: 1007, empName: 'Michael Peter', userApprovalName: 'michael.p', signature: 'MP', emailAddress: 'michael@polyfoam.co.tz', companyId: companyMap['PM004'], statusEntry: 'Active', orderNo: 'EMP007', passwordUser: 'password123', employeeSignedAs: 'WAREHOUSE_MANAGER', 
//       salesPiApproval: false, purchasePiApproval: false, apparelsDashboard: false, poApprovalHead: false, overtimeApproval: true, expatLeaveEncashment: false, 
//       boncePurchaseorderApproval: false, bondReleaseRequestApproval: false, wastageDeliveryApproval: true, workOrderApproval: false, pflWorkOrderApproval: false, 
//       pprbRollCuttTemplates: false, expatTravelLeaveApproval: false, poApproval: false, cashAdvanceApproval: false, creditLimitApproval: false, priceApproval: false, 
//       goodsRequestApproval: true, intercompanyApproval: false, salesReturnApproval: true, gatePassApproval: true, productCreationApproval: false, 
//       customerCreationApproval: false, otp: null, isActive: true },
    
//     { newCardNo: 1008, empName: 'Robert Mwanga', userApprovalName: 'robert.m', signature: 'RM', emailAddress: 'robert@bidco.co.tz', companyId: companyMap['TB002'], statusEntry: 'Active', orderNo: 'EMP008', passwordUser: 'password123', employeeSignedAs: 'FINANCE_CONTROLLER', 
//       salesPiApproval: true, purchasePiApproval: true, apparelsDashboard: false, poApprovalHead: false, overtimeApproval: false, expatLeaveEncashment: false, 
//       boncePurchaseorderApproval: false, bondReleaseRequestApproval: false, wastageDeliveryApproval: false, workOrderApproval: false, pflWorkOrderApproval: false, 
//       pprbRollCuttTemplates: false, expatTravelLeaveApproval: false, poApproval: false, cashAdvanceApproval: true, creditLimitApproval: true, priceApproval: true, 
//       goodsRequestApproval: false, intercompanyApproval: true, salesReturnApproval: true, gatePassApproval: false, productCreationApproval: false, 
//       customerCreationApproval: false, otp: null, isActive: true },
    
//     { newCardNo: 1009, empName: 'Grace Mlay', userApprovalName: 'grace.m', signature: 'GM', emailAddress: 'grace@lakeoil.co.tz', companyId: companyMap['EW008'], statusEntry: 'Active', orderNo: 'EMP009', passwordUser: 'password123', employeeSignedAs: 'LOGISTICS_MANAGER', 
//       salesPiApproval: false, purchasePiApproval: false, apparelsDashboard: false, poApprovalHead: false, overtimeApproval: true, expatLeaveEncashment: false, 
//       boncePurchaseorderApproval: false, bondReleaseRequestApproval: false, wastageDeliveryApproval: false, workOrderApproval: false, pflWorkOrderApproval: false, 
//       pprbRollCuttTemplates: false, expatTravelLeaveApproval: true, poApproval: false, cashAdvanceApproval: false, creditLimitApproval: false, priceApproval: false, 
//       goodsRequestApproval: true, intercompanyApproval: false, salesReturnApproval: false, gatePassApproval: true, productCreationApproval: false, 
//       customerCreationApproval: false, otp: null, isActive: true },
    
//     { newCardNo: 1010, empName: 'Ali Mohamed', userApprovalName: 'ali.m', signature: 'AM', emailAddress: 'ali@mohamed.co.tz', companyId: companyMap['AM005'], statusEntry: 'Active', orderNo: 'EMP010', passwordUser: 'password123', employeeSignedAs: 'SALES_MANAGER', 
//       salesPiApproval: true, purchasePiApproval: false, apparelsDashboard: true, poApprovalHead: false, overtimeApproval: false, expatLeaveEncashment: false, 
//       boncePurchaseorderApproval: false, bondReleaseRequestApproval: false, wastageDeliveryApproval: false, workOrderApproval: false, pflWorkOrderApproval: false, 
//       pprbRollCuttTemplates: false, expatTravelLeaveApproval: false, poApproval: false, cashAdvanceApproval: false, creditLimitApproval: true, priceApproval: true, 
//       goodsRequestApproval: false, intercompanyApproval: true, salesReturnApproval: true, gatePassApproval: false, productCreationApproval: false, 
//       customerCreationApproval: true, otp: null, isActive: true },
    
//     { newCardNo: 1011, empName: 'David Smith', userApprovalName: 'david.s', signature: 'DS', emailAddress: 'david@sabic.com', companyId: companyMap['VF003'], statusEntry: 'Active', orderNo: 'EMP011', passwordUser: 'password123', employeeSignedAs: 'TECHNICAL_MANAGER', 
//       salesPiApproval: false, purchasePiApproval: true, apparelsDashboard: false, poApprovalHead: false, overtimeApproval: false, expatLeaveEncashment: false, 
//       boncePurchaseorderApproval: false, bondReleaseRequestApproval: false, wastageDeliveryApproval: false, workOrderApproval: true, pflWorkOrderApproval: true, 
//       pprbRollCuttTemplates: true, expatTravelLeaveApproval: false, poApproval: true, cashAdvanceApproval: false, creditLimitApproval: false, priceApproval: true, 
//       goodsRequestApproval: true, intercompanyApproval: false, salesReturnApproval: false, gatePassApproval: false, productCreationApproval: true, 
//       customerCreationApproval: false, otp: null, isActive: true },
    
//     { newCardNo: 1012, empName: 'Julia Mrosso', userApprovalName: 'julia.m', signature: 'JM', emailAddress: 'julia@basf.co.tz', companyId: companyMap['SI009'], statusEntry: 'Active', orderNo: 'EMP012', passwordUser: 'password123', employeeSignedAs: 'R&D_MANAGER', 
//       salesPiApproval: true, purchasePiApproval: true, apparelsDashboard: false, poApprovalHead: false, overtimeApproval: false, expatLeaveEncashment: true, 
//       boncePurchaseorderApproval: false, bondReleaseRequestApproval: false, wastageDeliveryApproval: false, workOrderApproval: false, pflWorkOrderApproval: false, 
//       pprbRollCuttTemplates: true, expatTravelLeaveApproval: true, poApproval: false, cashAdvanceApproval: false, creditLimitApproval: false, priceApproval: true, 
//       goodsRequestApproval: false, intercompanyApproval: false, salesReturnApproval: false, gatePassApproval: false, productCreationApproval: true, 
//       customerCreationApproval: false, otp: null, isActive: true },
    
//     { newCardNo: 1013, empName: 'Thomas Ngowi', userApprovalName: 'thomas.n', signature: 'TN', emailAddress: 'thomas@dow.com', companyId: companyMap['TC007'], statusEntry: 'Active', orderNo: 'EMP013', passwordUser: 'password123', employeeSignedAs: 'PRODUCTION_MANAGER', 
//       salesPiApproval: false, purchasePiApproval: true, apparelsDashboard: false, poApprovalHead: true, overtimeApproval: true, expatLeaveEncashment: false, 
//       boncePurchaseorderApproval: true, bondReleaseRequestApproval: false, wastageDeliveryApproval: true, workOrderApproval: true, pflWorkOrderApproval: false, 
//       pprbRollCuttTemplates: false, expatTravelLeaveApproval: false, poApproval: true, cashAdvanceApproval: false, creditLimitApproval: false, priceApproval: false, 
//       goodsRequestApproval: true, intercompanyApproval: false, salesReturnApproval: false, gatePassApproval: true, productCreationApproval: false, 
//       customerCreationApproval: false, otp: null, isActive: true },
    
//     { newCardNo: 1014, empName: 'Catherine Maeda', userApprovalName: 'catherine.m', signature: 'CM', emailAddress: 'catherine@exxon.com', companyId: companyMap['TT010'], statusEntry: 'Active', orderNo: 'EMP014', passwordUser: 'password123', employeeSignedAs: 'EXPORT_MANAGER', 
//       salesPiApproval: true, purchasePiApproval: false, apparelsDashboard: false, poApprovalHead: false, overtimeApproval: false, expatLeaveEncashment: true, 
//       boncePurchaseorderApproval: false, bondReleaseRequestApproval: true, wastageDeliveryApproval: false, workOrderApproval: false, pflWorkOrderApproval: false, 
//       pprbRollCuttTemplates: false, expatTravelLeaveApproval: true, poApproval: false, cashAdvanceApproval: false, creditLimitApproval: true, priceApproval: false, 
//       goodsRequestApproval: false, intercompanyApproval: true, salesReturnApproval: false, gatePassApproval: true, productCreationApproval: false, 
//       customerCreationApproval: true, otp: null, isActive: true },
    
//     { newCardNo: 1015, empName: 'James Mwakyembe', userApprovalName: 'james.m', signature: 'JM', emailAddress: 'james@shell.co.tz', companyId: companyMap['EW008'], statusEntry: 'Active', orderNo: 'EMP015', passwordUser: 'password123', employeeSignedAs: 'OPERATIONS_MANAGER', 
//       salesPiApproval: false, purchasePiApproval: true, apparelsDashboard: true, poApprovalHead: false, overtimeApproval: true, expatLeaveEncashment: false, 
//       boncePurchaseorderApproval: true, bondReleaseRequestApproval: false, wastageDeliveryApproval: true, workOrderApproval: true, pflWorkOrderApproval: true, 
//       pprbRollCuttTemplates: false, expatTravelLeaveApproval: false, poApproval: true, cashAdvanceApproval: true, creditLimitApproval: true, priceApproval: true, 
//       goodsRequestApproval: true, intercompanyApproval: true, salesReturnApproval: true, gatePassApproval: true, productCreationApproval: true, 
//       customerCreationApproval: true, otp: null, isActive: true },
//   ];
  
//   for (const user of usersData) {
//     await db.insert(users).values(user).onConflictDoNothing();
//   }

//   // ============= 6. APPROVAL TYPES (All) =============
//   console.log('Seeding approval types...');
  
//   const approvalTypesList = [
//     { approvalCode: 'PO_APPROVAL', approvalName: 'PO Approval', sourceTable: 'tbl_purchase_order_hdr', requiresLevel2: true, pendingStatusValues: ['PENDING', 'HOLD'] },
//     { approvalCode: 'CASH_ADVANCE_APPROVAL', approvalName: 'Cash Advance Approval', sourceTable: 'tbl_cash_advance', requiresLevel2: true, pendingStatusValues: ['PENDING'] },
//     { approvalCode: 'CREDIT_LIMIT_APPROVAL', approvalName: 'Credit Limit Approval', sourceTable: 'tbl_credit_limit', requiresLevel2: true, pendingStatusValues: ['PENDING'] },
//     { approvalCode: 'PRICE_APPROVAL', approvalName: 'Price Approval', sourceTable: 'tbl_price_approval', requiresLevel2: false, pendingStatusValues: ['PENDING'] },
//     { approvalCode: 'GOODS_REQUEST_APPROVAL', approvalName: 'Goods Request Approval', sourceTable: 'tbl_goods_request', requiresLevel2: true, pendingStatusValues: ['PENDING'] },
//     { approvalCode: 'INTERCOMPANY_APPROVAL', approvalName: 'Inter-company Approval', sourceTable: 'tbl_intercompany', requiresLevel2: true, pendingStatusValues: ['PENDING'] },
//     { approvalCode: 'SALES_RETURN_APPROVAL', approvalName: 'Sales Return Approval', sourceTable: 'tbl_sales_return', requiresLevel2: true, pendingStatusValues: ['PENDING'] },
//     { approvalCode: 'GATE_PASS_APPROVAL', approvalName: 'Gate Pass Approval', sourceTable: 'tbl_gate_pass', requiresLevel2: true, pendingStatusValues: ['PENDING'] },
//     { approvalCode: 'PRODUCT_CREATION_APPROVAL', approvalName: 'Product Creation Approval', sourceTable: 'tbl_product', requiresLevel2: true, pendingStatusValues: ['PENDING'] },
//     { approvalCode: 'CUSTOMER_CREATION_APPROVAL', approvalName: 'Customer Creation Approval', sourceTable: 'tbl_customer', requiresLevel2: true, pendingStatusValues: ['PENDING'] },
//     { approvalCode: 'WASTAGE_DELIVERY_APPROVAL', approvalName: 'Wastage Delivery Approval', sourceTable: 'tbl_wastage', requiresLevel2: true, pendingStatusValues: ['PENDING'] },
//     { approvalCode: 'WORK_ORDER_APPROVAL', approvalName: 'Work Order Approval', sourceTable: 'tbl_work_order', requiresLevel2: true, pendingStatusValues: ['PENDING'] },
//     { approvalCode: 'PFL_WORK_ORDER_APPROVAL', approvalName: 'PFL Work Order Approval', sourceTable: 'tbl_pfl_work_order', requiresLevel2: true, pendingStatusValues: ['PENDING'] },
//     { approvalCode: 'PPRB_ROLL_CUTT_TEMPLATES', approvalName: 'PPRB Roll Cutt Templates', sourceTable: 'tbl_pprb_roll_cutt', requiresLevel2: true, pendingStatusValues: ['PENDING'] },
//     { approvalCode: 'EXPAT_TRAVEL_LEAVE_APPROVAL', approvalName: 'Expat Travel Leave Approval', sourceTable: 'tbl_expat_leave', requiresLevel2: true, pendingStatusValues: ['PENDING'] },
//     { approvalCode: 'SALES_PI_APPROVAL', approvalName: 'SALES PI Approval', sourceTable: 'tbl_sales_pi', requiresLevel2: true, pendingStatusValues: ['PENDING'] },
//     { approvalCode: 'PURCHASE_PI_APPROVAL', approvalName: 'PURCHASE PI Approval', sourceTable: 'tbl_purchase_pi', requiresLevel2: true, pendingStatusValues: ['PENDING'] },
//     { approvalCode: 'APPARELS_DASHBOARD', approvalName: 'Apparels Dashboard', sourceTable: 'tbl_apparels', requiresLevel2: true, pendingStatusValues: ['PENDING'] },
//     { approvalCode: 'PO_APPROVAL_HEAD', approvalName: 'PO Approval Head', sourceTable: 'tbl_purchase_order_hdr', requiresLevel2: true, pendingStatusValues: ['PENDING'] },
//     { approvalCode: 'OVERTIME_APPROVAL', approvalName: 'Overtime Approval', sourceTable: 'tbl_overtime', requiresLevel2: true, pendingStatusValues: ['PENDING'] },
//     { approvalCode: 'EXPAT_LEAVE_ENCASHMENT', approvalName: 'Expat Leave Encashment', sourceTable: 'tbl_expat_leave_encash', requiresLevel2: true, pendingStatusValues: ['PENDING'] },
//     { approvalCode: 'BONCE_PO_APPROVAL', approvalName: 'Bonce Purchase Order Approval', sourceTable: 'tbl_bonce_po', requiresLevel2: true, pendingStatusValues: ['PENDING'] },
//     { approvalCode: 'BOND_RELEASE_APPROVAL', approvalName: 'Bond Release Request Approval', sourceTable: 'tbl_bond_release', requiresLevel2: true, pendingStatusValues: ['PENDING'] },
//   ];

//   for (const type of approvalTypesList) {
//     await db.insert(tblApprovalTypes).values(type).onConflictDoNothing();
//   }

//   // ============= 7. DASHBOARD CARDS (All) =============
//   console.log('Seeding dashboard cards...');

//   const allApprovalTypes = await db.select().from(tblApprovalTypes);
//   const getTypeSno = (code: string) => allApprovalTypes.find(t => t.approvalCode === code)?.sno;

//   const dashboardCards = [
//     { cardTitle: 'PO Approval', cardValue: 5, permissionColumn: 'poApproval', routeSlug: 'po-approval', statusMaster: 'Active', iconKey: 'FileCheck', displayOrder: 1, backgroundColor: 'indigo', approvalTypeId: getTypeSno('PO_APPROVAL'), cardDescription: 'Pending purchase order approvals' },
//     { cardTitle: 'Cash Advance Approval', cardValue: 3, permissionColumn: 'cashAdvanceApproval', routeSlug: 'cash-advance-approval', statusMaster: 'Active', iconKey: 'Wallet', displayOrder: 2, backgroundColor: 'emerald', approvalTypeId: getTypeSno('CASH_ADVANCE_APPROVAL'), cardDescription: 'Employee cash advance requests' },
//     { cardTitle: 'Credit Limit Approval', cardValue: 2, permissionColumn: 'creditLimitApproval', routeSlug: 'credit-limit-approval', statusMaster: 'Active', iconKey: 'CreditCard', displayOrder: 3, backgroundColor: 'amber', approvalTypeId: getTypeSno('CREDIT_LIMIT_APPROVAL'), cardDescription: 'Customer credit limit increase' },
//     { cardTitle: 'Price Approval', cardValue: 7, permissionColumn: 'priceApproval', routeSlug: 'price-approval', statusMaster: 'Active', iconKey: 'Tag', displayOrder: 4, backgroundColor: 'purple', approvalTypeId: getTypeSno('PRICE_APPROVAL'), cardDescription: 'Price change requests' },
//     { cardTitle: 'Goods Request Approval', cardValue: 4, permissionColumn: 'goodsRequestApproval', routeSlug: 'goods-request-approval', statusMaster: 'Active', iconKey: 'PackageCheck', displayOrder: 5, backgroundColor: 'blue', approvalTypeId: getTypeSno('GOODS_REQUEST_APPROVAL'), cardDescription: 'Material requisition approvals' },
//     { cardTitle: 'Inter-company Approval', cardValue: 1, permissionColumn: 'intercompanyApproval', routeSlug: 'inter-company-approval', statusMaster: 'Active', iconKey: 'Building2', displayOrder: 6, backgroundColor: 'rose', approvalTypeId: getTypeSno('INTERCOMPANY_APPROVAL'), cardDescription: 'Inter-company transactions' },
//     { cardTitle: 'Sales Return Approval', cardValue: 0, permissionColumn: 'salesReturnApproval', routeSlug: 'sales-return-approval', statusMaster: 'Active', iconKey: 'RotateCcw', displayOrder: 7, backgroundColor: 'orange', approvalTypeId: getTypeSno('SALES_RETURN_APPROVAL'), cardDescription: 'Customer return requests' },
//     { cardTitle: 'Gate Pass Approval', cardValue: 6, permissionColumn: 'gatePassApproval', routeSlug: 'gate-pass-approval', statusMaster: 'Active', iconKey: 'DoorOpen', displayOrder: 8, backgroundColor: 'cyan', approvalTypeId: getTypeSno('GATE_PASS_APPROVAL'), cardDescription: 'Material exit approvals' },
//     { cardTitle: 'Product Creation Approval', cardValue: 3, permissionColumn: 'productCreationApproval', routeSlug: 'product-creation-approval', statusMaster: 'Active', iconKey: 'Boxes', displayOrder: 9, backgroundColor: 'pink', approvalTypeId: getTypeSno('PRODUCT_CREATION_APPROVAL'), cardDescription: 'New product additions' },
//     { cardTitle: 'Customer Creation Approval', cardValue: 2, permissionColumn: 'customerCreationApproval', routeSlug: 'customer-creation-approval', statusMaster: 'Active', iconKey: 'UserPlus', displayOrder: 10, backgroundColor: 'teal', approvalTypeId: getTypeSno('CUSTOMER_CREATION_APPROVAL'), cardDescription: 'New customer registrations' },
//     { cardTitle: 'Wastage Delivery Approval', cardValue: 1, permissionColumn: 'wastageDeliveryApproval', routeSlug: 'wastage-delivery-approval', statusMaster: 'Active', iconKey: 'Trash2', displayOrder: 11, backgroundColor: 'red', approvalTypeId: getTypeSno('WASTAGE_DELIVERY_APPROVAL'), cardDescription: 'Scrap/wastage disposal' },
//     { cardTitle: 'Work Order Approval', cardValue: 8, permissionColumn: 'workOrderApproval', routeSlug: 'work-order-approval', statusMaster: 'Active', iconKey: 'ClipboardList', displayOrder: 12, backgroundColor: 'violet', approvalTypeId: getTypeSno('WORK_ORDER_APPROVAL'), cardDescription: 'Production work orders' },
//     { cardTitle: 'PFL Work Order Approval', cardValue: 4, permissionColumn: 'pflWorkOrderApproval', routeSlug: 'pfl-work-order-approval', statusMaster: 'Active', iconKey: 'Factory', displayOrder: 13, backgroundColor: 'sky', approvalTypeId: getTypeSno('PFL_WORK_ORDER_APPROVAL'), cardDescription: 'PFL-specific work orders' },
//     { cardTitle: 'PPRB Roll Cutt Templates', cardValue: 2, permissionColumn: 'pprbRollCuttTemplates', routeSlug: 'pprb-roll-cutt-templates', statusMaster: 'Active', iconKey: 'Scissors', displayOrder: 14, backgroundColor: 'lime', approvalTypeId: getTypeSno('PPRB_ROLL_CUTT_TEMPLATES'), cardDescription: 'Roll cutting templates' },
//     { cardTitle: 'Expat Travel Leave Approval', cardValue: 3, permissionColumn: 'expatTravelLeaveApproval', routeSlug: 'expat-travel-leave-approval', statusMaster: 'Active', iconKey: 'Plane', displayOrder: 15, backgroundColor: 'fuchsia', approvalTypeId: getTypeSno('EXPAT_TRAVEL_LEAVE_APPROVAL'), cardDescription: 'Expatriate travel requests' },
//     { cardTitle: 'SALES PI Approval', cardValue: 5, permissionColumn: 'salesPiApproval', routeSlug: 'sales-pi-approval', statusMaster: 'Active', iconKey: 'ReceiptText', displayOrder: 16, backgroundColor: 'indigo', approvalTypeId: getTypeSno('SALES_PI_APPROVAL'), cardDescription: 'Sales proforma invoices' },
//     { cardTitle: 'PURCHASE PI Approval', cardValue: 6, permissionColumn: 'purchasePiApproval', routeSlug: 'purchase-pi-approval', statusMaster: 'Active', iconKey: 'ShoppingCart', displayOrder: 17, backgroundColor: 'emerald', approvalTypeId: getTypeSno('PURCHASE_PI_APPROVAL'), cardDescription: 'Purchase proforma invoices' },
//     { cardTitle: 'Apparels Dashboard', cardValue: 9, permissionColumn: 'apparelsDashboard', routeSlug: 'apparels-dashboard', statusMaster: 'Active', iconKey: 'Shirt', displayOrder: 18, backgroundColor: 'amber', approvalTypeId: getTypeSno('APPARELS_DASHBOARD'), cardDescription: 'Apparel division metrics' },
//     { cardTitle: 'PO Approval Head', cardValue: 2, permissionColumn: 'poApprovalHead', routeSlug: 'po-approval-head', statusMaster: 'Active', iconKey: 'ShieldCheck', displayOrder: 19, backgroundColor: 'purple', approvalTypeId: getTypeSno('PO_APPROVAL_HEAD'), cardDescription: 'High-value PO approvals' },
//     { cardTitle: 'Overtime Approval', cardValue: 7, permissionColumn: 'overtimeApproval', routeSlug: 'overtime-approval', statusMaster: 'Active', iconKey: 'Clock', displayOrder: 20, backgroundColor: 'blue', approvalTypeId: getTypeSno('OVERTIME_APPROVAL'), cardDescription: 'Employee overtime requests' },
//     { cardTitle: 'Expat Leave Encashment', cardValue: 1, permissionColumn: 'expatLeaveEncashment', routeSlug: 'expat-leave-encashment', statusMaster: 'Active', iconKey: 'HandCoins', displayOrder: 21, backgroundColor: 'rose', approvalTypeId: getTypeSno('EXPAT_LEAVE_ENCASHMENT'), cardDescription: 'Leave encashment requests' },
//     { cardTitle: 'Bonce Purchase Order Approval', cardValue: 0, permissionColumn: 'boncePurchaseorderApproval', routeSlug: 'bonce-po-approval', statusMaster: 'Active', iconKey: 'ShoppingCart', displayOrder: 22, backgroundColor: 'orange', approvalTypeId: getTypeSno('BONCE_PO_APPROVAL'), cardDescription: 'Bonce PO approvals' },
//     { cardTitle: 'Bond Release Request Approval', cardValue: 3, permissionColumn: 'bondReleaseRequestApproval', routeSlug: 'bond-release-approval', statusMaster: 'Active', iconKey: 'LockKeyhole', displayOrder: 23, backgroundColor: 'cyan', approvalTypeId: getTypeSno('BOND_RELEASE_APPROVAL'), cardDescription: 'Bonded material release' },
//   ];

//   for (const card of dashboardCards) {
//     await db.insert(tblDashboard).values(card).onConflictDoNothing();
//   }

//   // ============= 8. PURCHASE ORDERS (20+ records) =============
//   console.log('Seeding purchase orders...');
  
//   const userList = await db.select().from(users);
//   const supplierList = await db.select().from(tblSupplier);
//   const departmentList = await db.select().from(tblDepartment);
  
//   const requisitioner = userList.find(u => u.employeeSignedAs === 'REQUISITIONER') || userList[0];
//   const level1Approver = userList.find(u => u.employeeSignedAs === 'LEVEL1_APPROVER') || userList[1];
//   const level2Approver = userList.find(u => u.employeeSignedAs === 'LEVEL2_APPROVER') || userList[2];
  
//   const purchaseOrders = [];
//   const poRefs = [];
  
//   for (let i = 1; i <= 25; i++) {
//     const poRef = `AZ/MOFF/25-28/PO/${2560 + i}`;
//     poRefs.push(poRef);
    
//     const purchaseType = i % 3 === 0 ? 'IMPORT' : 'DOMESTIC';
//     const company = i % 2 === 0 ? companyMap['AZ001'] : companyMap['TB002'];
//     const supplier = supplierList[i % supplierList.length];
//     const department = departmentList[i % departmentList.length];
    
//     const status = i % 5 === 0 ? 'APPROVED' : i % 7 === 0 ? 'REJECTED' : i % 9 === 0 ? 'HOLD' : 'PENDING';
    
//     const response1Status = i % 5 === 0 ? 'APPROVED' : i % 7 === 0 ? 'REJECTED' : i % 9 === 0 ? 'HOLD' : i % 11 === 0 ? 'APPROVED' : 'PENDING';
//     const response2Status = i % 5 === 0 ? 'APPROVED' : i % 7 === 0 ? 'REJECTED' : i % 9 === 0 ? 'HOLD' : 'PENDING';
//     const finalStatus = i % 5 === 0 ? 'APPROVED' : i % 7 === 0 ? 'REJECTED' : i % 9 === 0 ? 'HOLD' : 'PENDING';
    
//     const totalAmount = Math.floor(Math.random() * 5000000) + 500000;
    
//     purchaseOrders.push({
//       sno: i,
//       poRefNo: poRef,
//       poDate: new Date(2025, 0, Math.floor(Math.random() * 28) + 1),
//       purchaseType: purchaseType,
//       companyId: company,
//       supplierId: supplier?.sno,
//       poStoreId: department?.sno,
//       remarks: `Test PO ${i}`,
//       statusEntry: status,
//       createdBy: requisitioner?.empName || 'System',
//       createdDate: new Date(2025, 0, Math.floor(Math.random() * 28) + 1),
//       createdMacAddress: '00:1A:2B:3C:4D:5E',
//       modifiedBy: null,
//       modifiedDate: null,
//       modifiedMacAddress: null,
//       paymentTerm: 'Net 30 Days',
//       modeOfPayment: 'Bank Transfer',
//       currencyType: purchaseType === 'IMPORT' ? 'USD' : 'TSH',
//       suplierProformaNumber: `PI-${1000 + i}`,
//       shipmentMode: purchaseType === 'IMPORT' ? 'Sea Freight' : 'Road',
//       priceTerms: 'CIF',
//       shipmentRemarks: 'Handle with care',
//       totalProductionHdrAmount: totalAmount.toString(),
//       totalAdditionalCostAmount: (totalAmount * 0.05).toString(),
//       vatHdrAmount: (totalAmount * 0.18).toString(),
//       totalFinalProductionHdrAmount: (totalAmount * 1.23).toString(),
//       respondBy: null,
//       respondDate: null,
//       respondStatus: null,
//       firstShipmentDate: new Date(2025, 1, 15),
//       lcApplyTargetDate: purchaseType === 'IMPORT' ? new Date(2025, 1, 1) : null,
//       response1Person: level1Approver?.employeeSignedAs || 'Mr. Kalpesh',
//       response1Date: response1Status !== 'PENDING' ? new Date(2025, 0, Math.floor(Math.random() * 20) + 10) : null,
//       response1Status: response1Status,
//       response1Remarks: response1Status === 'APPROVED' ? 'Approved after verification' : response1Status === 'REJECTED' ? 'Budget constraints' : '',
//       response1MacAddress: '00:1A:2B:3C:4D:5E',
//       response1UserId: level1Approver?.sno,
//       response2Person: level2Approver?.employeeSignedAs || 'Shaaf',
//       response2Date: response2Status !== 'PENDING' ? new Date(2025, 0, Math.floor(Math.random() * 25) + 15) : null,
//       response2Status: response2Status,
//       response2Remarks: response2Status === 'APPROVED' ? 'Final approval granted' : response2Status === 'REJECTED' ? 'Terms not acceptable' : '',
//       response2MacAddress: '00:1A:2B:3C:4D:5E',
//       response2UserId: level2Approver?.sno,
//       finalResponsePerson: finalStatus !== 'PENDING' ? level2Approver?.employeeSignedAs : null,
//       finalResponseDate: finalStatus !== 'PENDING' ? new Date(2025, 0, Math.floor(Math.random() * 28) + 20) : null,
//       finalResponseStatus: finalStatus,
//       finalResponseRemarks: finalStatus === 'APPROVED' ? 'PO approved' : finalStatus === 'REJECTED' ? 'PO rejected' : finalStatus === 'HOLD' ? 'On hold for clarification' : '',
//       finalResponseUserId: finalStatus !== 'PENDING' ? level2Approver?.sno : null,
//       requestedDate: new Date(2025, 0, Math.floor(Math.random() * 28) + 1),
//       requestedBy: requisitioner?.empName || 'Raw Mushi',
//       requestedByUserId: requisitioner?.sno,
//       requestedMacAddress: '00:1A:2B:3C:4D:5E',
//       stockCompanyTransferRefNo: null,
//       loadingPortId: purchaseType === 'IMPORT' ? 1 : null,
//       dischargePortId: purchaseType === 'IMPORT' ? 2 : null,
//       shipmentType: purchaseType === 'IMPORT' ? 'FCL' : 'LTL',
//       supplierCompanyId: supplier?.sno,
//       stockStoreId: department?.sno,
//       importsResponse1Person: null,
//       importsResponse1Date: null,
//       importsResponse1Status: null,
//       importsResponse1Remarks: null,
//       importsResponse1MacAddress: null,
//       companyOnbehalfOf: null,
//       purchaseHeadResponsePerson: null,
//       purchaseHeadResponseDate: null,
//       purchaseHeadResponseStatus: null,
//       purchaseHeadResponseRemarks: null,
//       purchaseHeadResponseMacAddress: null,
//       erpPiRefNo: `ERP-PI-${i}`,
//       priceForCnfFob: purchaseType === 'IMPORT' ? 'CIF' : 'FOB',
//       approvalTransactionId: null,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     });
//   }
  
//   for (const po of purchaseOrders) {
//     await db.insert(tblPurchaseOrderHdr).values(po).onConflictDoNothing();
//   }

//   // ============= 9. PURCHASE ORDER DETAILS (50+ records) =============
//   console.log('Seeding purchase order details...');
  
//   const productList = await db.select().from(tblProduct);
  
//   for (let i = 1; i <= 50; i++) {
//     const poRef = poRefs[i % poRefs.length];
//     const product = productList[i % productList.length];
//     const qty = Math.floor(Math.random() * 1000) + 100;
//     const rate = Math.floor(Math.random() * 500) + 50;
//     const amount = qty * rate;
//     const vat = amount * 0.18;
//     const finalAmount = amount + vat;
    
//     await db.insert(tblPurchaseOrderDtl).values({
//       poRefNo: poRef,
//       requestStoreId: departmentList[i % departmentList.length]?.sno,
//       poRequestRefNo: `REQ-${1000 + i}`,
//       proformaInvoiceRefNo: `PI-${2000 + i}`,
//       sectionId: i % 5,
//       machineId: i % 10,
//       mainCategoryId: i % 8,
//       subCategoryId: i % 12,
//       productId: product?.sno,
//       packingType: i % 2 === 0 ? 'Box' : 'Pallet',
//       noPcsPerPacking: '25',
//       totalPcs: qty.toString(),
//       totalPacking: Math.ceil(qty / 25).toString(),
//       ratePerPcs: rate.toString(),
//       productAmount: amount.toString(),
//       discountPercentage: i % 5 === 0 ? '5' : '0',
//       discountAmount: i % 5 === 0 ? (amount * 0.05).toString() : '0',
//       totalProductAmount: (i % 5 === 0 ? amount * 0.95 : amount).toString(),
//       vatPercentage: '18',
//       vatAmount: vat.toString(),
//       finalProductAmount: finalAmount.toString(),
//       remarks: `Order for ${product?.productName || 'Product'}`,
//       statusEntry: 'Active',
//       createdBy: requisitioner?.empName || 'System',
//       createdDate: new Date(),
//       createdMacAddress: '00:1A:2B:3C:4D:5E',
//       alternateProductName: null,
//       lcNeededStatus: i % 10 === 0 ? 'YES' : 'NO',
//       lcApplyStatus: null,
//       lcAppliedDate: null,
//       lcNo: null,
//       supDocFile: null,
//       truckId: null,
//       response1Person: null,
//       response1Date: null,
//       response1Status: 'PENDING',
//       response1Remarks: null,
//       response1ApprovedTotalPacking: null,
//       response1ApprovedTotalPcs: null,
//       response2Person: null,
//       response2Date: null,
//       response2Status: 'PENDING',
//       response2Remarks: null,
//       response2ApprovedTotalPacking: null,
//       response2ApprovedTotalPcs: null,
//       finalResponsePerson: null,
//       finalResponseDate: null,
//       finalResponseStatus: 'PENDING',
//       finalResponseRemarks: null,
//       finalResponseApprovedTotalPacking: null,
//       finalResponseApprovedTotalPcs: null,
//       trailerId: null,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     }).onConflictDoNothing();
//   }

//   // ============= 10. CASH ADVANCE REQUESTS (15 records) =============
//   console.log('Seeding cash advance requests...');
  
//   for (let i = 1; i <= 15; i++) {
//     const employee = userList[i % userList.length];
//     const status = i % 4 === 0 ? 'APPROVED' : i % 6 === 0 ? 'REJECTED' : 'PENDING';
//     const level1Status = i % 4 === 0 ? 'APPROVED' : i % 6 === 0 ? 'REJECTED' : 'PENDING';
//     const level2Status = i % 4 === 0 ? 'APPROVED' : i % 6 === 0 ? 'REJECTED' : i % 8 === 0 ? 'PENDING' : 'PENDING';
    
//     await db.insert(tblCashAdvance).values({
//       requestNo: `CA-${2025}-${100 + i}`,
//       requestDate: new Date(2025, 0, Math.floor(Math.random() * 28) + 1),
//       employeeId: employee?.sno,
//       employeeName: employee?.empName,
//       amount: (Math.floor(Math.random() * 500000) + 50000).toString(),
//       currency: 'TSH',
//       purpose: i % 3 === 0 ? 'Business travel' : i % 3 === 1 ? 'Office supplies' : 'Training expenses',
//       expectedReturnDate: new Date(2025, 1, Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0], // date column usually expects YYYY-MM-DD string or Date
//       level1Approver: level1Approver?.employeeSignedAs,
//       level1Status: level1Status,
//       level1Remarks: level1Status === 'APPROVED' ? 'Approved as requested' : level1Status === 'REJECTED' ? 'Insufficient budget' : null,
//       level1ApprovedAt: level1Status !== 'PENDING' ? new Date(2025, 0, Math.floor(Math.random() * 20) + 10) : null,
//       level1UserId: level1Approver?.sno,
//       level2Approver: level2Approver?.employeeSignedAs,
//       level2Status: level2Status,
//       level2Remarks: level2Status === 'APPROVED' ? 'Final approval granted' : level2Status === 'REJECTED' ? 'Policy violation' : null,
//       level2ApprovedAt: level2Status !== 'PENDING' ? new Date(2025, 0, Math.floor(Math.random() * 25) + 15) : null,
//       level2UserId: level2Approver?.sno,
//       finalStatus: status,
//       finalApprovedAt: status !== 'PENDING' ? new Date(2025, 0, Math.floor(Math.random() * 28) + 20) : null,
//       approvalTransactionId: null,
//       createdBy: requisitioner?.sno,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     }).onConflictDoNothing();
//   }

//   // ============= 11. CREDIT LIMIT REQUESTS (10 records) =============
//   console.log('Seeding credit limit requests...');
  
//   for (let i = 1; i <= 10; i++) {
//     const status = i % 3 === 0 ? 'APPROVED' : i % 5 === 0 ? 'REJECTED' : 'PENDING';
//     const level1Status = i % 3 === 0 ? 'APPROVED' : i % 5 === 0 ? 'REJECTED' : 'PENDING';
//     const level2Status = i % 3 === 0 ? 'APPROVED' : i % 5 === 0 ? 'REJECTED' : 'PENDING';
    
//     await db.insert(tblCreditLimit).values({
//       requestNo: `CL-${2025}-${100 + i}`,
//       customerId: 1000 + i,
//       customerName: i % 2 === 0 ? 'Azam Industries' : 'Bakhresa Group',
//       currentLimit: (Math.floor(Math.random() * 10000000) + 1000000).toString(),
//       requestedLimit: (Math.floor(Math.random() * 15000000) + 2000000).toString(),
//       reason: i % 2 === 0 ? 'Seasonal demand increase' : 'New product line launch',
//       requestDate: new Date(2025, 0, Math.floor(Math.random() * 28) + 1),
//       level1Approver: level1Approver?.employeeSignedAs,
//       level1Status: level1Status,
//       level2Approver: level2Approver?.employeeSignedAs,
//       level2Status: level2Status,
//       level1Remarks: level1Status === 'APPROVED' ? 'Credit check cleared' : level1Status === 'REJECTED' ? 'High risk profile' : null,
//       level2Remarks: level2Status === 'APPROVED' ? 'Approved with monitoring' : level2Status === 'REJECTED' ? 'Exceeds policy limit' : null,
//       finalStatus: status,
//       approvalTransactionId: null,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     }).onConflictDoNothing();
//   }

//   // ============= 12. PRICE APPROVAL REQUESTS (12 records) =============
//   console.log('Seeding price approval requests...');
  
//   for (let i = 1; i <= 12; i++) {
//     const product = productList[i % productList.length];
//     const supplier = supplierList[i % supplierList.length];
//     const oldPrice = Math.floor(Math.random() * 500) + 100;
//     const newPrice = oldPrice + Math.floor(Math.random() * 100) + 10;
    
//     await db.insert(tblPriceApproval).values({
//       requestNo: `PA-${2025}-${100 + i}`,
//       productId: product?.sno,
//       productName: product?.productName,
//       supplierId: supplier?.sno,
//       supplierName: supplier?.supplierName,
//       oldPrice: oldPrice.toString(),
//       newPrice: newPrice.toString(),
//       effectiveDate: new Date(2025, 2, 1).toISOString().split('T')[0],
//       reason: i % 3 === 0 ? 'Raw material cost increase' : i % 3 === 1 ? 'Exchange rate fluctuation' : 'Competitor price adjustment',
//       finalStatus: i % 4 === 0 ? 'APPROVED' : i % 6 === 0 ? 'REJECTED' : 'PENDING',
//       approvalTransactionId: null,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     }).onConflictDoNothing();
//   }

//   // ============= 13. NOTIFICATIONS (20 records) =============
//   console.log('Seeding notifications...');
  
//   for (let i = 1; i <= 20; i++) {
//     const recipient = i % 2 === 0 ? level1Approver?.sno : level2Approver?.sno;
//     const type = i % 4 === 0 ? 'success' : i % 5 === 0 ? 'warning' : i % 7 === 0 ? 'error' : 'info';
//     const status = i % 3 === 0 ? 'APPROVED' : i % 4 === 0 ? 'REJECTED' : 'PENDING';
    
//     await db.insert(tblNotifications).values({
//       userId: recipient,
//       title: `PO ${status}`,
//       message: `Purchase Order #AZ/MOFF/25-28/PO/${2560 + i} has been ${status}`,
//       type: type,
//       read: i % 3 === 0 ? true : false,
//       link: `/approval/po-approval/${i}`,
//       approvalTransactionId: null,
//       date: new Date(2025, 0, Math.floor(Math.random() * 28) + 1),
//       createdAt: new Date(),
//     }).onConflictDoNothing();
//   }

//   console.log('✅ Seeding completed successfully!');
//   console.log('📊 Database populated with comprehensive test data.');
// }

// seed().catch((error) => {
//   console.error('❌ Seeding failed:', error);
//   process.exit(1);
// });