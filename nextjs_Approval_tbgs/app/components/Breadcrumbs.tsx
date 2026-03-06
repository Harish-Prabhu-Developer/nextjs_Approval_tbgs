"use client";

import React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbsProps {
    customTitle?: string;
    className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ customTitle, className = "" }) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    if (!pathname) return null;

    const pathnames = pathname.split("/").filter((x) => x);

    // Get card title from query parameters if available
    const cardTitle = searchParams ? searchParams.get("cardTitle") : null;

    // Function to format breadcrumb text
    const formatBreadcrumb = (text: string) => {
        if (!text) return "";
        return text
            .split("-")
            .map(word => {
                const specialWords: Record<string, string> = {
                    'po': 'PO',
                    'pi': 'PI',
                    'pfl': 'PFL',
                    'pprb': 'PPRB',
                    'yn': 'YN'
                };
                const lowerWord = word.toLowerCase();
                return specialWords[lowerWord] || (lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1));
            })
            .join(" ");
    };

    // Function to get route title based on path segment
    const getRouteTitle = (segment: string, index: number) => {
        // Use customTitle prop if provided
        if (index === pathnames.length - 1 && customTitle) {
            return customTitle;
        }

        // For dynamic routes (IDs)
        if (/^\d+$/.test(segment)) {
            return "Details";
        }

        // For approval pages, use cardTitle from query params if available
        if (segment.startsWith("approval") && index === pathnames.length - 1 && cardTitle) {
            return cardTitle;
        }

        return formatBreadcrumb(segment);
    };

    const breadcrumbItems: Array<{
        path: string;
        title: string;
        icon?: React.ReactNode;
        isLast: boolean;
    }> = [];

    // Root Dashboard item
    breadcrumbItems.push({
        path: "/dashboard",
        title: "Dashboard",
        icon: <Home className="w-4 h-4" />,
        isLast: pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === "dashboard")
    });

    // Additional segments (skipping 'dashboard' if it's the first segment to avoid 'Dashboard > Dashboard')
    pathnames.forEach((segment, index) => {
        if (segment.toLowerCase() === "dashboard" && index === 0) return;

        const path = `/${pathnames.slice(0, index + 1).join("/")}`;
        const title = getRouteTitle(segment, index);

        breadcrumbItems.push({
            path,
            title,
            isLast: index === pathnames.length - 1,
        });
    });

    return (
        <nav className={`flex items-center text-sm ${className}`} aria-label="Breadcrumb">
            <ol className="flex items-center space-x-1">
                {breadcrumbItems.map((item, index) => (
                    <li key={item.path} className="flex items-center">
                        {index > 0 && (
                            <ChevronRight className="w-4 h-4 text-gray-400 mx-1 shrink-0" />
                        )}

                        {item.isLast ? (
                            <div className="flex items-center text-indigo-900 font-semibold px-2 py-1 bg-indigo-50/50 rounded-md">
                                {item.icon && <span className="mr-1.5 text-indigo-600">{item.icon}</span>}
                                <span className="truncate max-w-[150px] md:max-w-[250px]">{item.title}</span>
                            </div>
                        ) : (
                            <Link
                                href={item.path}
                                className="flex items-center text-gray-500 hover:text-indigo-600 hover:bg-white/50 px-2 py-1 rounded-md transition-all duration-200 group"
                            >
                                {item.icon && (
                                    <span className="mr-1.5 text-gray-400 group-hover:text-indigo-500 transition-colors">
                                        {item.icon}
                                    </span>
                                )}
                                <span className="font-medium">{item.title}</span>
                            </Link>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;