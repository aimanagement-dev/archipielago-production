import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth-config';
import { GoogleSheetsService } from '@/lib/google-sheets';
import crypto from 'crypto';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const accessToken = (session as any).accessToken;
    const sheetsService = new GoogleSheetsService(accessToken);
    const spreadsheetId = await sheetsService.getOrCreateDatabase();

    try {
        const response = await sheetsService['sheets'].spreadsheets.values.batchGet({
            spreadsheetId,
            ranges: ['Subscriptions!A2:K', 'Expenses!A2:I']
        });

        const subsRows = response.data.valueRanges?.[0].values || [];
        const expRows = response.data.valueRanges?.[1].values || [];

        const subscriptions = subsRows.map(row => ({
            id: row[0],
            platform: row[1],
            category: row[2],
            cost: parseFloat(row[3]),
            currency: row[4],
            billingCycle: row[5],
            renewalDay: parseInt(row[6]),
            cardUsed: row[7],
            status: row[8],
            owner: row[9],
            notes: row[10]
        }));

        const expenses = expRows.map(row => ({
            id: row[0],
            date: row[1],
            description: row[2],
            amount: parseFloat(row[3]),
            currency: row[4],
            category: row[5],
            type: row[6],
            receiptUrl: row[7],
            status: row[8]
        }));

        return NextResponse.json({ subscriptions, expenses });
    } catch (error) {
        console.error('Error fetching finance data:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const accessToken = (session as any).accessToken;
    const sheetsService = new GoogleSheetsService(accessToken);
    const spreadsheetId = await sheetsService.getOrCreateDatabase();

    const body = await req.json();
    const { type, data } = body; // type: 'subscription' | 'expense' | 'import_legacy'

    try {
        if (type === 'import_legacy') {
            // 1. Read from Legacy Sheet
            const legacySpreadsheetId = '1ZSVEv_c2bZ1PUpX9uWuiaz32rJSJdch14Psy3J7F_qY';
            const response = await sheetsService['sheets'].spreadsheets.values.get({
                spreadsheetId: legacySpreadsheetId,
                range: 'OVERVIEW!A5:I60', // Read enough rows
            });

            const rows = response.data.values;
            if (!rows || rows.length === 0) return NextResponse.json({ success: true, message: 'No data found' });

            // 2. Map to New Schema
            const newSubs = rows
                .filter(row => {
                    const platform = row[0];
                    // Filter out empty rows, summary headers, and rows without a valid status-like look
                    if (!platform) return false;
                    if (['RESUMEN MENSUAL', 'Mes', 'Total Proyecto', 'Promedio Mensual'].includes(platform)) return false;
                    // Check for dates in platform like "November 2025" or "Nov 2025"
                    if (platform.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s\d{4}$/)) return false;

                    // Check Col G (Status). If it is "Total", it's a summary row.
                    if (row[6] === 'Total') return false;

                    return true;
                })
                .map(row => {
                    // Parse Cost: "$11.00" -> 11.00
                    const costString = row[3] ? row[3].replace(/[$,]/g, '') : '0';
                    const renewalMonthStr = row[2] || '';

                    let day = 1;
                    const dayMatch = renewalMonthStr.match(/\d+/);
                    if (dayMatch) day = parseInt(dayMatch[0]);

                    // Map Status (Col G / index 6)
                    let status = 'Active';
                    if (row[6]) {
                        const s = row[6].toLowerCase();
                        if (s.includes('cancel')) status = 'Cancelled';
                        else if (s.includes('activ')) status = 'Active';
                        else if (s.includes('paus')) status = 'Paused';
                    }

                    return [
                        crypto.randomUUID(), // ID
                        row[0], // Platform
                        row[1], // Category
                        parseFloat(costString), // Cost
                        row[4] || 'USD', // Currency
                        'Monthly', // BillingCycle (Default)
                        day, // RenewalDay
                        row[5], // CardUsed
                        status, // Status (Mapped)
                        row[7], // Owner
                        row[8] // Notes
                    ];
                });

            // 3. Write to Subscriptions
            if (newSubs.length > 0) {
                await sheetsService['sheets'].spreadsheets.values.append({
                    spreadsheetId,
                    range: 'Subscriptions!A:K',
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: newSubs }
                });
            }
            return NextResponse.json({ success: true, count: newSubs.length });

        } else if (type === 'subscription') {
            await sheetsService['sheets'].spreadsheets.values.append({
                spreadsheetId,
                range: 'Subscriptions!A:K',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[
                        crypto.randomUUID(),
                        data.platform,
                        data.category,
                        parseFloat(data.cost),
                        data.currency,
                        data.billingCycle,
                        parseInt(data.renewalDay),
                        data.cardUsed,
                        data.status,
                        data.owner,
                        data.notes
                    ]]
                }
            });
        } else if (type === 'expense') {
            await sheetsService['sheets'].spreadsheets.values.append({
                spreadsheetId,
                range: 'Expenses!A:I',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[
                        crypto.randomUUID(),
                        new Date().toISOString(),
                        data.description,
                        parseFloat(data.amount),
                        data.currency,
                        data.category,
                        data.type,
                        '', // Receipt URL placeholder
                        'Pending'
                    ]]
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving finance data:', error);
        return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const accessToken = (session as any).accessToken;
    const sheetsService = new GoogleSheetsService(accessToken);
    const spreadsheetId = await sheetsService.getOrCreateDatabase();

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    try {
        if (action === 'reset_all') {
            // Clear all data leaving header
            await sheetsService['sheets'].spreadsheets.values.clear({
                spreadsheetId,
                range: 'Subscriptions!A2:K',
            });
            // Also clear expenses? potentially.
            await sheetsService['sheets'].spreadsheets.values.clear({
                spreadsheetId,
                range: 'Expenses!A2:I',
            });
            return NextResponse.json({ success: true, message: 'Reset complete' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error deleting finance data:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
