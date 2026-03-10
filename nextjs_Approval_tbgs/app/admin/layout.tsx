"use client";
import { useEffect } from 'react';
import { useAppSelector } from '@/redux/hooks';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated } = useAppSelector((state: any) => state.auth);
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated && user && user.role?.toLowerCase() !== 'admin') {
            router.push('/dashboard');
        }
    }, [user, isAuthenticated, router]);

    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
            </div>
        );
    }

    if (user.role?.toLowerCase() !== 'admin') {
        return null;
    }

    return <div className="animate-in fade-in duration-500">{children}</div>;
}
