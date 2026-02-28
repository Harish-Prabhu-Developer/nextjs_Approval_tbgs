"use client";
//app/[approvalType]/[id]/page.tsx
import React, { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Download, Printer, Mail, Calendar, FileText, CheckCircle, Clock, AlertCircle, ArrowLeft, Share2, Tag } from "lucide-react";

// Mock data
import { DASHBOARD_CARDS } from "../../config/mockData";

interface ViewDetailPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const ViewDetailPage = ({ searchParams }: ViewDetailPageProps) => {
    const router = useRouter();
    const params = useParams();
    const approvalType = params.approvalType as string;
    const id = params.id as string;

    // Get query parameters
    const [queryParams, setQueryParams] = useState<Record<string, string>>({});

    useEffect(() => {
        // Convert Promise to actual values
        searchParams.then((params) => {
            const paramsObj: Record<string, string> = {};
            Object.entries(params).forEach(([key, value]) => {
                if (typeof value === 'string') {
                    paramsObj[key] = value;
                }
            });
            setQueryParams(paramsObj);
        });
    }, [searchParams]);

    const [rowData, setRowData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        // Fetch data based on id and approvalType
        const fetchData = async () => {
            try {
                // Replace with actual API call
                // const response = await fetch(`/api/approval/${approvalType}/${id}`);
                // const data = await response.json();

                // Mock data for now
                const mockData = {
                    id: id,
                    poNo: `PO-${id}`,
                    poType: "DOMESTIC",
                    cell: "A1",
                    company: "AZ",
                    department: "ATOZ 1 DEPT",
                    currency: "TSH",
                    amount: "29,500",
                    pendingDays: "0",
                    supplier: "ADDAMO MARINA HARDWARE",
                    product: "RED SILICON B50/PC",
                    requestedBy: "raw / 07-Jan-2026",
                    response1Person: "Mr. Kalpesh",
                    response1Status: "APPROVED",
                    response1Remarks: "Quality checked",
                    response2Person: "Shaaf",
                    response2Status: "PENDING",
                    response2Remarks: "",
                    finalStatus: "HOLD",
                };

                setRowData(mockData);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, approvalType]);

    // Format currency amount
    const formatAmount = (amount: string, currency: string) => {
        if (!amount) return "N/A";
        return `${amount} ${currency}`;
    };

    // Get status badge styling
    const getStatusBadge = (status: string) => {
        const statusText = status || "PENDING";
        let bgColor = "bg-gray-100";
        let textColor = "text-gray-800";

        switch (statusText.toUpperCase()) {
            case "APPROVED":
                bgColor = "bg-green-100";
                textColor = "text-green-800";
                break;
            case "HOLD":
                bgColor = "bg-yellow-100";
                textColor = "text-yellow-800";
                break;
            case "REJECTED":
                bgColor = "bg-red-100";
                textColor = "text-red-800";
                break;
            case "IN PROGRESS":
                bgColor = "bg-blue-100";
                textColor = "text-blue-800";
                break;
            default:
                bgColor = "bg-gray-100";
                textColor = "text-gray-800";
        }

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
                {statusText}
            </span>
        );
    };

    // Action buttons
    const actionButtons = [
        {
            label: "Download",
            icon: <Download className="w-4 h-4" />,
            onClick: () => console.log("Download PO", rowData?.poNo),
            variant: "outline" as const
        },
    ];

    // Main details sections
    const detailSections = [
        {
            title: "Purchase Order Information",
            items: [
                { label: "PO Number", value: rowData?.poNo || "N/A" },
                { label: "PO Type", value: rowData?.poType || "N/A" },
                { label: "Cell", value: rowData?.cell || "N/A" },
                { label: "Company", value: rowData?.company || "N/A" },
                { label: "Department", value: rowData?.department || "N/A" },
                { label: "Currency", value: rowData?.currency || "N/A" },
                { label: "PO Amount", value: formatAmount(rowData?.amount, rowData?.currency) },
                { label: "Pending Days", value: `${rowData?.pendingDays || "0"} days` },
            ]
        },
        {
            title: "Supplier & Product Details",
            items: [
                { label: "Supplier", value: rowData?.supplier || "N/A" },
                { label: "Top Product", value: rowData?.product || "N/A" },
                { label: "Requested By", value: rowData?.requestedBy || "N/A" },
                { label: "Request Date", value: rowData?.requestedBy?.split("/")[1]?.trim() || "N/A" },
            ]
        }
    ];

    // Approval details sections
    const approvalSections = [
        {
            title: "First Approval",
            items: [
                { label: "Approver", value: rowData?.response1Person || "Not Assigned" },
                { label: "Status", value: rowData?.response1Status || "PENDING", isStatus: true },
                { label: "Remarks", value: rowData?.response1Remarks || "No remarks provided" },
            ]
        },
        {
            title: "Second Approval",
            items: [
                { label: "Approver", value: rowData?.response2Person || "Not Assigned" },
                { label: "Status", value: rowData?.response2Status || "PENDING", isStatus: true },
                { label: "Remarks", value: rowData?.response2Remarks || "No remarks provided" },
            ]
        }
    ];

    // Get page title from query params or route
    const pageTitle = React.useMemo(() => {
        if (queryParams.cardTitle) return queryParams.cardTitle;
        const card = DASHBOARD_CARDS.find(c => c.routeSlug === approvalType);
        if (card) return card.cardTitle;
        return approvalType?.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    }, [approvalType, queryParams]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading details...</p>
                </div>
            </div>
        );
    }

    if (!rowData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white rounded-lg shadow-sm p-8 max-w-md text-center">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Data Not Found</h2>
                    <p className="text-gray-600 mb-6">
                        The requested details could not be found. Please go back and try again.
                    </p>
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center justify-center mx-auto"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Page Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {rowData.poNo}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {pageTitle} • ID: {rowData.id} • {getStatusBadge(rowData.finalStatus)}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => router.back()}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg flex items-center"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </button>
                        {/* {actionButtons.map((button, index) => (
                            <button
                                key={index}
                                onClick={button.onClick}
                                className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center space-x-2 ${button.variant === "outline"
                                    ? "border border-gray-300 text-gray-700 hover:bg-gray-50"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                                    }`}
                            >
                                {button.icon}
                                <span>{button.label}</span>
                            </button>
                        ))} */}
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Purchase Order Details */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h3 className="text-lg font-semibold text-gray-900">Purchase Order Details</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {detailSections[0].items.map((item, index) => (
                                <div key={index} className="flex justify-between items-center py-2">
                                    <span className="text-sm text-gray-600">{item.label}</span>
                                    <span className="text-sm font-medium text-gray-900 text-right">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Supplier & Product Details */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h3 className="text-lg font-semibold text-gray-900">Supplier & Product</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {detailSections[1].items.map((item, index) => (
                                <div key={index} className="flex justify-between items-center py-2">
                                    <span className="text-sm text-gray-600">{item.label}</span>
                                    <span className="text-sm font-medium text-gray-900 text-right">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Approval Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {approvalSections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {section.items.map((item, itemIndex) => (
                                    <div key={itemIndex}>
                                        <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                                        {item.isStatus ? (
                                            <div className="mb-3">{getStatusBadge(item.value)}</div>
                                        ) : (
                                            <div className={`text-sm ${item.label === "Remarks" ? "italic text-gray-700 bg-gray-50 p-3 rounded" : "font-medium text-gray-900"}`}>
                                                {item.value}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ViewDetailPage;