
import { MoreHorizontal, PlusCircle, Printer, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import Link from 'next/link';
import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';
import VowsClientPage from './client-page';

export default async function VowsPage() {
    const vows = await prisma.vow.findMany({
        orderBy: { date: 'desc' },
        include: {
            livestock: {
                include: {
                    livestockType: true
                }
            }
        }
    });

    return (
        <>
            <PageHeader
                title="سجل النذور الحية"
            />
            <VowsClientPage vows={vows} />
        </>
    );
}
