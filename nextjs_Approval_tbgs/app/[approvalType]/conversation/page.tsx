"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import {
    X,
    MessageSquare,
    Calendar,
    User,
    CheckCircle2,
    Clock,
    AlertCircle,
    ChevronLeft
} from 'lucide-react';
import { PURCHASE_ORDER_CONVERSATION_DTL } from '../../config/mockData';
import toast from 'react-hot-toast';

interface ConversationItem {
    sno: number;
    poRefNo: string;
    respondPerson: string;
    discussionDetails?: string;
    responseStatus: string;
    statusEntry: string;
    remarks: string;
    createdBy: string;
    createdDate: string;
}

const ConversationContent = () => {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const poRefNo = searchParams.get('poRefNo');
    const [data, setData] = useState<ConversationItem[]>([]);

    useEffect(() => {
        if (poRefNo) {
            const conversationData = PURCHASE_ORDER_CONVERSATION_DTL.filter(
                (item: any) => item.poRefNo === poRefNo
            );
            setData(conversationData);
        }
    }, [poRefNo]);

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'APPROVED': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
            case 'PENDING': return 'text-amber-500 bg-amber-50 border-amber-100';
            case 'REJECTED': return 'text-rose-500 bg-rose-50 border-rose-100';
            case 'PROCESSED': return 'text-blue-500 bg-blue-50 border-blue-100';
            default: return 'text-slate-500 bg-slate-50 border-slate-100';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toUpperCase()) {
            case 'APPROVED': return <CheckCircle2 size={14} strokeWidth={2.5} />;
            case 'PENDING': return <Clock size={14} strokeWidth={2.5} />;
            case 'REJECTED': return <X size={14} strokeWidth={2.5} />;
            case 'PROCESSED': return <CheckCircle2 size={14} strokeWidth={2.5} />;
            default: return <AlertCircle size={14} strokeWidth={2.5} />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                    >
                        <ChevronLeft size={20} strokeWidth={2.5} />
                    </button>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-[16px] font-bold text-slate-800 uppercase tracking-tight">
                            Conversation - {poRefNo || 'Unknown Reference'}
                        </h2>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                            Conversation History
                        </p>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full">
                {data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 space-y-4">
                        <div className="p-6 bg-white rounded-full border border-slate-100 shadow-sm">
                            <MessageSquare size={40} strokeWidth={1.5} />
                        </div>
                        <p className="text-base font-medium">No conversation history found for this reference.</p>
                        <button
                            onClick={() => router.back()}
                            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                        >
                            Go Back
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-slate-200 before:to-transparent pb-10">
                        {data.map((item, index) => (
                            <div key={item.sno} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group animate-in slide-in-from-bottom-5 duration-500" style={{ animationDelay: `${index * 100}ms` }}>

                                {/* Timeline Icon */}
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ml-0 md:ml-0 overflow-hidden">
                                    <div className="bg-white w-full h-full flex items-center justify-center">
                                        {getStatusIcon(item.responseStatus)}
                                    </div>
                                </div>

                                {/* Card */}
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative group-hover:border-indigo-100">

                                    {/* Connector Line for mobile */}
                                    <div className="absolute top-5 -left-2 w-2 h-0 border-t-10 border-t-transparent border-r-10 border-r-white border-b-10 border-b-transparent md:hidden filter drop-shadow-sm"></div>

                                    {/* Connector Arrow for Desktop */}
                                    <div className="hidden md:block absolute top-1/2 -translate-y-1/2 group-even:-left-2 group-odd:-right-2 w-2 h-0 border-t-8 border-t-transparent group-even:border-r-8 group-even:border-r-white group-odd:border-l-8 group-odd:border-l-white border-b-8 border-b-transparent filter drop-shadow-sm"></div>

                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-slate-50 rounded-xl text-slate-500 border border-slate-100">
                                                <User size={14} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-slate-800 capitalize leading-none mb-1">
                                                    {item.respondPerson.replace('.', ' ')}
                                                </span>
                                                <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                                    {item.createdBy}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase border shadow-sm ${getStatusColor(item.responseStatus)}`}>
                                            {item.responseStatus}
                                        </span>
                                    </div>

                                    {item.discussionDetails && (
                                        <div className="mb-4 pb-4 border-b border-slate-50">
                                            <div className="flex items-center space-x-2 mb-1.5">
                                                <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
                                                <h4 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Theme</h4>
                                            </div>
                                            <p className="text-[13px] text-slate-600 leading-relaxed font-medium pl-3">
                                                {item.discussionDetails}
                                            </p>
                                        </div>
                                    )}

                                    <div className="relative pl-3 border-l-2 border-indigo-100 bg-slate-50/50 p-3 rounded-r-lg">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Remarks</h4>
                                        <p className="text-[13px] text-slate-700 leading-relaxed italic">
                                            "{item.remarks}"
                                        </p>
                                    </div>

                                    <div className="mt-5 pt-3 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex items-center space-x-1.5 text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                                            <Calendar size={12} />
                                            <span className="text-[10px] font-bold tracking-tight">{item.createdDate.split(' ')[0]}</span>
                                        </div>
                                        <div className="flex items-center space-x-1.5 text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                                            <Clock size={12} />
                                            <span className="text-[10px] font-bold tracking-tight">{item.createdDate.split(' ')[1]}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Wrap in Suspense to avoid de-opt of entire page
export default function ConversationPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>
            <ConversationContent />
        </Suspense>
    );
}
