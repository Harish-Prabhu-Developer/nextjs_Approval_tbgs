-- Script to diagnose and fix foreign key constraint violation
-- Issue: tbl_purchase_order_hdr has company_id=2 but tbl_company doesn't have sno=2

-- ============================================
-- STEP 1: Check existing companies
-- ============================================
SELECT sno, company_code, company_name, short_name, status 
FROM tbl_company 
ORDER BY sno;

-- ============================================
-- STEP 2: Check purchase orders with invalid company_id
-- ============================================
SELECT po.sno, po.po_ref_no, po.company_id, po.po_date, po.status_entry
FROM tbl_purchase_order_hdr po
LEFT JOIN tbl_company c ON po.company_id = c.sno
WHERE c.sno IS NULL;

-- ============================================
-- STEP 3: Count of orphaned records
-- ============================================
SELECT COUNT(*) as orphaned_po_count
FROM tbl_purchase_order_hdr po
LEFT JOIN tbl_company c ON po.company_id = c.sno
WHERE c.sno IS NULL;

-- ============================================
-- SOLUTIONS (Run ONE of these based on your needs)
-- ============================================

-- SOLUTION A: Add missing company with sno=2 (if you need this company)
-- Uncomment and modify the values below:
/*
INSERT INTO tbl_company (sno, company_code, company_name, short_name, status, created_at, updated_at)
VALUES (2, 'COMP002', 'Company Name 2', 'CN2', 'Active', NOW(), NOW());
*/

-- SOLUTION B: Update orphaned PO records to use an existing company
-- First, check what company exists:
-- SELECT sno, company_code, company_name FROM tbl_company LIMIT 1;
-- Then update (uncomment and replace <existing_company_id>):
/*
UPDATE tbl_purchase_order_hdr
SET company_id = <existing_company_id>
WHERE company_id = 2;
*/

-- SOLUTION C: Delete orphaned purchase order records (if they're test data)
-- WARNING: This will permanently delete data!
/*
DELETE FROM tbl_purchase_order_hdr
WHERE sno IN (
  SELECT po.sno
  FROM tbl_purchase_order_hdr po
  LEFT JOIN tbl_company c ON po.company_id = c.sno
  WHERE c.sno IS NULL
);
*/

-- SOLUTION D: Set company_id to NULL temporarily (if column allows NULL)
-- Note: This won't work if the column is NOT NULL
/*
UPDATE tbl_purchase_order_hdr
SET company_id = NULL
WHERE company_id = 2;
*/
