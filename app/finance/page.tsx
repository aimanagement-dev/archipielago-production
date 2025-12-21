import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-config';
import FinanceDashboard from '@/components/Finance/FinanceDashboard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function FinancePage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Finanzas & Control</h1>
                        <p className="text-muted-foreground">Gestión de suscripciones y gastos de producción</p>
                    </div>
                </div>

                <FinanceDashboard />
            </div>
        </div>
    );
}
