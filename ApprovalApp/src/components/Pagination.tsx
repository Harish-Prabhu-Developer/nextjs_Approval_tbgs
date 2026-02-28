import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalFilteredCount: number;
    entriesPerPage: number | string;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalFilteredCount,
    entriesPerPage,
    onPageChange,
}) => {
    if (typeof entriesPerPage === 'number' && totalPages <= 1 && totalFilteredCount <= entriesPerPage) return null;

    const pageNumbers: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    const isAll = entriesPerPage === 'All';

    if (isAll) {
        return (
            <View className="flex-col items-center justify-between py-2">
                <View className="flex-row items-center bg-slate-50 px-5 py-2 rounded-full border border-slate-100">
                    <Text className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                        Showing all <Text className="text-indigo-600 font-black">{totalFilteredCount}</Text> records
                    </Text>
                </View>
            </View>
        );
    }

    const limit = Number(entriesPerPage);
    const indexOfLastEntry = currentPage * limit;
    const indexOfFirstEntry = totalFilteredCount === 0 ? 0 : (currentPage - 1) * limit + 1;
    const currentEnd = Math.min(indexOfLastEntry, totalFilteredCount);

    return (
        <View className="flex-col items-center justify-between py-2 gap-y-4">
            {/* Entry Summary */}
            <View className="flex-row items-center bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                <Text className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                    Showing <Text className="text-indigo-600 font-black">{indexOfFirstEntry}</Text>
                    <Text className="text-slate-300 mx-1">—</Text>
                    <Text className="text-indigo-600 font-black">{currentEnd}</Text> of{' '}
                    <Text className="text-slate-800 font-black">{totalFilteredCount}</Text> entries
                </Text>
            </View>

            {/* Page Controls */}
            <View className="flex-row items-center gap-x-2">
                <Pressable
                    onPress={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-100 ${currentPage === 1 ? 'opacity-30' : 'active:bg-slate-50 active:scale-95'
                        }`}
                >
                    <ChevronLeft size={18} color="#475569" strokeWidth={3} />
                </Pressable>

                <View className="flex-row items-center gap-x-1.5">
                    {pageNumbers.map((number) => (
                        <Pressable
                            key={number}
                            onPress={() => onPageChange(number)}
                            className={`h-10 w-10 items-center justify-center rounded-xl ${currentPage === number
                                ? 'bg-indigo-600 shadow-lg shadow-indigo-200 border border-indigo-500'
                                : 'bg-white border border-slate-200 active:bg-slate-50 active:scale-95'
                                }`}
                        >
                            <Text
                                className={`text-[13px] font-black ${currentPage === number ? 'text-white' : 'text-slate-600'
                                    }`}
                            >
                                {number}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                <Pressable
                    onPress={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className={`h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-100 ${currentPage === totalPages || totalPages === 0 ? 'opacity-30' : 'active:bg-slate-50 active:scale-95'
                        }`}
                >
                    <ChevronRight size={18} color="#475569" strokeWidth={3} />
                </Pressable>
            </View>
        </View>
    );
};

export default Pagination;
