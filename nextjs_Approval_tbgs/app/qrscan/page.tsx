import type { Metadata } from "next";
import { Suspense } from 'react';
import { RefreshCw } from 'lucide-react';
import QrScanClient from './QrScanClient';
import { MOCK_APPROVAL_DATA } from '@/app/config/mockData';

type Props = {
    params: Promise<any>;
    searchParams: Promise<{ id?: string }>;
};

// Helper function to centralize validation logic
const getValidationResult = (idParam: string | undefined) => {
    const id = idParam?.replace(/^"|"$/g, '') || null;
    const normalize = (str: string) => str.replace(/-/g, '/').toUpperCase();

    const isValid = id ? Object.values(MOCK_APPROVAL_DATA)
        .flat()
        .some(item => (item.poRefNo && normalize(item.poRefNo) === normalize(id))) : false;

    return { id, isValid };
};

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { id: rawId } = await props.searchParams;
    const { isValid } = getValidationResult(rawId);

    if (!rawId) return { title: "Verification" };

    return {
        title: isValid ? "Verification Success" : "Verification Failed"
    };
}

export default async function QrScanPage(props: Props) {
    const { id: rawId } = await props.searchParams;
    const { id, isValid } = getValidationResult(rawId);

    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <RefreshCw className="animate-spin text-indigo-600" />
            </div>
        }>
            <QrScanClient initialId={id} initialIsValid={isValid} />
        </Suspense>
    );
}
