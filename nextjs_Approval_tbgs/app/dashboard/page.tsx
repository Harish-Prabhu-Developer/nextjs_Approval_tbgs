// app/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import DashboardCard from "../components/DashboardCard";

import { DASHBOARD_CARDS, MOCK_COUNTS } from "../config/mockData";

const MOCK_CARDS = DASHBOARD_CARDS;
const MOCK_COUNTS_DATA = MOCK_COUNTS;

const DashboardPage = () => {
    const router = useRouter();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [approvalCounts, setApprovalCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate delay

            // Get user permissions
            const userStr = localStorage.getItem("tbgs_user");
            let allowedPermissions: string[] = [];

            if (userStr) {
                const user = JSON.parse(userStr);
                allowedPermissions = user.permissions || [];
            }

            // Filter cards based on permissions
            const filteredCards = MOCK_CARDS.filter((card: any) =>
                allowedPermissions.includes(card.permissionColumn)
            );

            setCards(filteredCards as any);
            setApprovalCounts(MOCK_COUNTS_DATA);
        } catch (error) {
            console.error("Failed to load dashboard data:", error);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (card: any) => {
        const pendingCount = approvalCounts[card.permissionColumn] || 0;

        if (pendingCount > 0) {
            router.push(`/${card.routeSlug}`);
        } else {
            toast.error(`No pending requests for ${card.cardTitle}`);
        }
    };

    const handleRefresh = async () => {
        try {
            setLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 500));
            setApprovalCounts(MOCK_COUNTS_DATA); // Use mock counts
            toast.success('Dashboard refreshed successfully');
        } catch (error) {
            toast.error('Failed to refresh dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading && cards.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Loading your dashboard...</p>
                    <p className="text-gray-400 text-sm mt-2">Fetching pending approvals</p>
                </div>
            </div>
        );
    }

    // Merge approval counts with cards and ensure field names match DashboardCardProps
    const cardsWithCounts = cards.map((card: any) => ({
        ...card,
        id: card.sno || card.id,
        title: card.cardTitle,
        value: approvalCounts[card.permissionColumn] || 0
    }));

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-sm text-gray-500 mt-2">
                            Overview of pending approvals and operational requests
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        )}
                        <span>Refresh</span>
                    </button>
                </div>

                {cardsWithCounts.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Cards Available</h3>
                        <p className="text-gray-500">
                            You don't have permission to view any dashboard cards.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {cardsWithCounts.map((card: any) => (
                            <DashboardCard
                                key={card.sno || card.id}
                                card={card}
                                onClick={() => handleCardClick(card)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;