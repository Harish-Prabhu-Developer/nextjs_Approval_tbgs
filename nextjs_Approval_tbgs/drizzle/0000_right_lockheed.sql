CREATE TABLE "tbl_approval_details" (
	"sno" integer PRIMARY KEY NOT NULL,
	"ref_no" varchar(50) NOT NULL,
	"product_id" integer,
	"product_name" varchar(200),
	"specification" text,
	"ordered_qty" numeric(15, 4),
	"unit_price" numeric(15, 6),
	"amount" numeric(15, 2),
	"vat_amount" numeric(15, 4),
	"remarks" text
);
--> statement-breakpoint
CREATE TABLE "tbl_approval_requests" (
	"sno" integer PRIMARY KEY NOT NULL,
	"approval_type" varchar(64) NOT NULL,
	"po_ref_no" varchar(50) NOT NULL,
	"po_date" timestamp,
	"purchase_type" varchar(50),
	"company_id" integer,
	"supplier_id" integer,
	"po_store_id" integer,
	"remarks" text,
	"status_entry" varchar(20),
	"created_by" varchar(100),
	"created_date" timestamp,
	"modified_by" varchar(100),
	"modified_date" timestamp,
	"total_final_production_hdr_amount" numeric(15, 2),
	"currency_type" varchar(10),
	"requested_by" varchar(100),
	"requested_date" timestamp,
	"response1_person" varchar(100),
	"response1_status" varchar(20),
	"response1_date" timestamp,
	"response1_remarks" text,
	"response2_person" varchar(100),
	"response2_status" varchar(20),
	"response2_date" timestamp,
	"response2_remarks" text,
	"final_response_person" varchar(100),
	"final_response_status" varchar(20),
	"final_response_date" timestamp,
	"final_response_remarks" text,
	"payment_term" text,
	"mode_of_payment" varchar(50),
	"suplier_proforma_number" varchar(100),
	"shipment_mode" varchar(50),
	"price_terms" varchar(50),
	"shipment_remarks" text,
	"total_production_hdr_amount" numeric(15, 2),
	"total_additional_cost_amount" numeric(15, 2),
	"vat_hdr_amount" numeric(15, 2)
);
--> statement-breakpoint
CREATE TABLE "tbl_chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"receiver_id" integer NOT NULL,
	"message" text NOT NULL,
	"image_url" text,
	"file_url" text,
	"file_name" varchar(255),
	"file_type" varchar(100),
	"is_read" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"reply_to" jsonb
);
--> statement-breakpoint
CREATE TABLE "tbl_companies" (
	"company_id" integer PRIMARY KEY NOT NULL,
	"company_name" varchar(200) NOT NULL,
	"address" text,
	"contact_no" varchar(50),
	"email" varchar(150),
	"status" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tbl_dashboard_cards" (
	"sno" integer PRIMARY KEY NOT NULL,
	"card_title" varchar(150) NOT NULL,
	"permission_column" varchar(64) NOT NULL,
	"route_slug" varchar(64) NOT NULL,
	"approval_type" varchar(64) NOT NULL,
	"icon_key" varchar(64) NOT NULL,
	"background_color" varchar(32) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tbl_main_categories" (
	"main_category_id" integer PRIMARY KEY NOT NULL,
	"category_name" varchar(150) NOT NULL,
	"status" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tbl_products" (
	"product_id" integer PRIMARY KEY NOT NULL,
	"product_name" varchar(200) NOT NULL,
	"main_category_id" integer,
	"sub_category_id" integer,
	"unit" varchar(30),
	"specification" text,
	"status" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tbl_purchase_order_additional_costs" (
	"sno" integer PRIMARY KEY NOT NULL,
	"po_ref_no" varchar(50) NOT NULL,
	"additional_cost_type" varchar(100),
	"amount" numeric(15, 2),
	"vat_amount" numeric(15, 2),
	"remarks" text,
	"status_master" varchar(20),
	"created_by" varchar(50),
	"created_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "tbl_purchase_order_conversation" (
	"sno" integer PRIMARY KEY NOT NULL,
	"po_ref_no" varchar(50) NOT NULL,
	"respond_person" varchar(100),
	"discussion_details" text,
	"response_status" varchar(20),
	"status_entry" varchar(20),
	"remarks" text,
	"created_by" varchar(50),
	"created_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "tbl_purchase_order_dtl" (
	"sno" integer PRIMARY KEY NOT NULL,
	"po_ref_no" varchar(50) NOT NULL,
	"request_store_id" integer,
	"po_request_ref_no" varchar(50),
	"proforma_invoice_ref_no" varchar(50),
	"section_id" integer,
	"machine_id" integer,
	"main_category_id" integer,
	"sub_category_id" integer,
	"product_id" integer,
	"packing_type" varchar(50),
	"no_pcs_per_packing" numeric(15, 4),
	"total_pcs" numeric(15, 4),
	"total_packing" numeric(15, 4),
	"rate_per_pcs" numeric(15, 6),
	"product_amount" numeric(15, 2),
	"discount_percentage" numeric(15, 2),
	"discount_amount" numeric(15, 2),
	"total_product_amount" numeric(15, 4),
	"vat_percentage" numeric(15, 2),
	"vat_amount" numeric(15, 4),
	"final_product_amount" numeric(15, 4),
	"remarks" text,
	"status_entry" varchar(20),
	"created_by" varchar(50),
	"created_date" timestamp,
	"alternate_product_name" varchar(200),
	"lc_needed_status" varchar(20),
	"lc_apply_status" varchar(20),
	"lc_applied_date" timestamp,
	"lc_no" varchar(50),
	"sup_doc_file" text,
	"truck_id" integer,
	"trailer_id" integer,
	"response1_person" varchar(100),
	"response1_date" timestamp,
	"response1_status" varchar(20),
	"response1_remarks" text,
	"response1_approved_total_packing" numeric(15, 2),
	"response1_approved_total_pcs" numeric(15, 2),
	"response2_person" varchar(100),
	"response2_date" timestamp,
	"response2_status" varchar(20),
	"response2_remarks" text,
	"response2_approved_total_packing" numeric(15, 2),
	"response2_approved_total_pcs" numeric(15, 2),
	"final_response_person" varchar(100),
	"final_response_date" timestamp,
	"final_response_status" varchar(20),
	"final_response_remarks" text,
	"final_response_approved_total_packing" numeric(15, 2),
	"final_response_approved_total_pcs" numeric(15, 2)
);
--> statement-breakpoint
CREATE TABLE "tbl_purchase_order_files" (
	"sno" integer PRIMARY KEY NOT NULL,
	"po_ref_no" varchar(50) NOT NULL,
	"description_details" varchar(150),
	"file_name" varchar(150),
	"content_type" varchar(100),
	"content_data" text,
	"status_master" varchar(20),
	"created_by" varchar(50),
	"created_date" timestamp,
	"file_type" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "tbl_purchase_order_hdr" (
	"sno" integer PRIMARY KEY NOT NULL,
	"po_ref_no" varchar(50) NOT NULL,
	"po_date" timestamp,
	"purchase_type" varchar(50),
	"company_id" integer,
	"supplier_id" integer,
	"po_store_id" integer,
	"remarks" text,
	"status_entry" varchar(20),
	"created_by" varchar(50),
	"created_date" timestamp,
	"modified_by" varchar(50),
	"modified_date" timestamp,
	"payment_term" text,
	"mode_of_payment" varchar(50),
	"currency_type" varchar(10),
	"suplier_proforma_number" varchar(100),
	"shipment_mode" varchar(50),
	"price_terms" varchar(50),
	"shipment_remarks" text,
	"total_production_hdr_amount" numeric(15, 2),
	"total_additional_cost_amount" numeric(15, 2),
	"vat_hdr_amount" numeric(15, 2),
	"total_final_production_hdr_amount" numeric(15, 2),
	"requested_by" varchar(100),
	"requested_date" timestamp,
	"response1_person" varchar(100),
	"response1_date" timestamp,
	"response1_status" varchar(20),
	"response1_remarks" text,
	"response2_person" varchar(100),
	"response2_date" timestamp,
	"response2_status" varchar(20),
	"response2_remarks" text,
	"purchase_head_response_person" varchar(100),
	"purchase_head_response_date" timestamp,
	"purchase_head_response_status" varchar(20),
	"purchase_head_response_remarks" text,
	"imports_response1_person" varchar(100),
	"imports_response1_date" timestamp,
	"imports_response1_status" varchar(20),
	"imports_response1_remarks" text,
	"final_response_person" varchar(100),
	"final_response_date" timestamp,
	"final_response_status" varchar(20),
	"final_response_remarks" text,
	"first_shipment_date" timestamp,
	"lc_apply_target_date" timestamp,
	"loading_port_id" integer,
	"discharge_port_id" integer,
	"shipment_type" varchar(50),
	"supplier_company_id" integer,
	"stock_store_id" integer,
	"erp_pi_ref_no" varchar(50),
	"price_for_cnf_fob" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "tbl_stores" (
	"store_id" integer PRIMARY KEY NOT NULL,
	"store_name" varchar(200) NOT NULL,
	"company_id" integer,
	"location" varchar(200),
	"status" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tbl_sub_categories" (
	"sub_category_id" integer PRIMARY KEY NOT NULL,
	"main_category_id" integer,
	"sub_category_name" varchar(150) NOT NULL,
	"status" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tbl_suppliers" (
	"supplier_id" integer PRIMARY KEY NOT NULL,
	"supplier_name" varchar(200) NOT NULL,
	"address" text,
	"contact_no" varchar(50),
	"email" varchar(150),
	"tax_number" varchar(50),
	"status" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tbl_trailers" (
	"trailer_id" integer PRIMARY KEY NOT NULL,
	"trailer_number" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tbl_trucks" (
	"truck_id" integer PRIMARY KEY NOT NULL,
	"truck_number" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tbl_user_status" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"is_online" boolean DEFAULT false,
	"last_seen" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tbl_users" (
	"id" integer PRIMARY KEY NOT NULL,
	"username" varchar(64) NOT NULL,
	"password" varchar(128) NOT NULL,
	"name" varchar(128) NOT NULL,
	"role" varchar(64) NOT NULL,
	"email" varchar(128) NOT NULL,
	"permissions" text[] NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "tbl_approval_details" ADD CONSTRAINT "tbl_approval_details_product_id_tbl_products_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."tbl_products"("product_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_approval_requests" ADD CONSTRAINT "tbl_approval_requests_company_id_tbl_companies_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."tbl_companies"("company_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_approval_requests" ADD CONSTRAINT "tbl_approval_requests_supplier_id_tbl_suppliers_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."tbl_suppliers"("supplier_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_approval_requests" ADD CONSTRAINT "tbl_approval_requests_po_store_id_tbl_stores_store_id_fk" FOREIGN KEY ("po_store_id") REFERENCES "public"."tbl_stores"("store_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_chat_messages" ADD CONSTRAINT "tbl_chat_messages_sender_id_tbl_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."tbl_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_chat_messages" ADD CONSTRAINT "tbl_chat_messages_receiver_id_tbl_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."tbl_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_products" ADD CONSTRAINT "tbl_products_main_category_id_tbl_main_categories_main_category_id_fk" FOREIGN KEY ("main_category_id") REFERENCES "public"."tbl_main_categories"("main_category_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_products" ADD CONSTRAINT "tbl_products_sub_category_id_tbl_sub_categories_sub_category_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."tbl_sub_categories"("sub_category_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_purchase_order_dtl" ADD CONSTRAINT "tbl_purchase_order_dtl_request_store_id_tbl_stores_store_id_fk" FOREIGN KEY ("request_store_id") REFERENCES "public"."tbl_stores"("store_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_purchase_order_dtl" ADD CONSTRAINT "tbl_purchase_order_dtl_main_category_id_tbl_main_categories_main_category_id_fk" FOREIGN KEY ("main_category_id") REFERENCES "public"."tbl_main_categories"("main_category_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_purchase_order_dtl" ADD CONSTRAINT "tbl_purchase_order_dtl_sub_category_id_tbl_sub_categories_sub_category_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."tbl_sub_categories"("sub_category_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_purchase_order_dtl" ADD CONSTRAINT "tbl_purchase_order_dtl_product_id_tbl_products_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."tbl_products"("product_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_purchase_order_dtl" ADD CONSTRAINT "tbl_purchase_order_dtl_truck_id_tbl_trucks_truck_id_fk" FOREIGN KEY ("truck_id") REFERENCES "public"."tbl_trucks"("truck_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_purchase_order_dtl" ADD CONSTRAINT "tbl_purchase_order_dtl_trailer_id_tbl_trailers_trailer_id_fk" FOREIGN KEY ("trailer_id") REFERENCES "public"."tbl_trailers"("trailer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_purchase_order_hdr" ADD CONSTRAINT "tbl_purchase_order_hdr_company_id_tbl_companies_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."tbl_companies"("company_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_purchase_order_hdr" ADD CONSTRAINT "tbl_purchase_order_hdr_supplier_id_tbl_suppliers_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."tbl_suppliers"("supplier_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_purchase_order_hdr" ADD CONSTRAINT "tbl_purchase_order_hdr_po_store_id_tbl_stores_store_id_fk" FOREIGN KEY ("po_store_id") REFERENCES "public"."tbl_stores"("store_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_stores" ADD CONSTRAINT "tbl_stores_company_id_tbl_companies_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."tbl_companies"("company_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_sub_categories" ADD CONSTRAINT "tbl_sub_categories_main_category_id_tbl_main_categories_main_category_id_fk" FOREIGN KEY ("main_category_id") REFERENCES "public"."tbl_main_categories"("main_category_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_user_status" ADD CONSTRAINT "tbl_user_status_user_id_tbl_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_users"("id") ON DELETE no action ON UPDATE no action;