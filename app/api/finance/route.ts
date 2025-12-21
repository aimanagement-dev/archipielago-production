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
        // Fetch Subscriptions
        const subsResponse = await sheetsService['sheets'].spreadsheets.values.get({
            spreadsheetId,
            range: 'Subscriptions!A2:K',
        });
        const subscriptions = (subsResponse.data.values || []).map(row => ({
            id: row[0],
            platform: row[1],
            category: row[2],
            cost: parseFloat(row[3] || '0'),
            currency: row[4],
            billingCycle: row[5],
            renewalDay: parseInt(row[6] || '1'),
            cardUsed: row[7],
            status: row[8],
            owner: row[9],
            notes: row[10]
        }));

        // Fetch Expenses
        const expResponse = await sheetsService['sheets'].spreadsheets.values.get({
            spreadsheetId,
            range: 'Expenses!A2:I',
        });
        const expenses = (expResponse.data.values || []).map(row => ({
            id: row[0],
            date: row[1],
            description: row[2],
            amount: parseFloat(row[3] || '0'),
            currency: row[4],
            category: row[5],
            type: row[6],
            receiptUrl: row[7],
            status: row[8]
        }));

        return NextResponse.json({ subscriptions, expenses });
    } catch (error) {
        console.error('Error fetching finance data:', error);
        return NextResponse.json({ error: 'Failed to fetch finance data' }, { status: 500 });
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
                range: 'OVERVIEW!A5:I30', // Read enough rows
            });

            const rows = response.data.values;
            if (!rows || rows.length === 0) return NextResponse.json({ success: true, message: 'No data found' });

            // 2. Map to New Schema
            const newSubs = rows
                .filter(row => row[0]) // Ensure Platform exists
                .map(row => {
                    // Parse Cost: "$11.00" -> 11.00
                    const costString = row[3] ? row[3].replace(/[$,]/g, '') : '0';
                    const renewalMonthStr = row[2] || '';
                    // Try to extract Day from "Day 21" or "21/11/2025" or just "21"
                    let day = 1;
                    const dayMatch = renewalMonthStr.match(/\d+/);
                    if (dayMatch) day = parseInt(dayMatch[0]);

                    return [
                        crypto.randomUUID(), // ID
                        row[0], // Platform
                        row[1], // Category
                        parseFloat(costString), // Cost
                        row[4] || 'USD', // Currency
                        'Monthly', // BillingCycle (Default)
                        day, // RenewalDay
                        row[5], // CardUsed
                        'Active', // Status (Default active)
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
                        data.id, data.platform, data.category, data.cost, data.currency,
                        data.billingCycle, data.renewalDay, data.cardUsed, data.status,
                        data.owner, data.notes
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
                        data.id, data.date, data.description, data.amount, data.currency,
                        data.category, data.type, data.receiptUrl, data.status
                    ]]
                }
            });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving finance data:', error);

        export async function DELETE(req: Request) {
            const session = await getServerSession(authOptions);
            if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            const accessToken = (session as any).accessToken;
            const sheetsService = new GoogleSheetsService(accessToken);
            const spreadsheetId = await sheetsService.getOrCreateDatabase();

            // Check if query params or body to determine type of delete
            // For now, simpler: user wants to CLEAR ALL for reset. 
            // BUT we should be careful. 
            // Let's rely on a specific header or just assume this route is flexible. 
            // Actually, `fetch` DELETE usually doesn't have body. 
            // Let's use ?action=reset_all
            const { searchParams } = new URL(req.url);
            const action = searchParams.get('action');

            try {
                if (action === 'reset_all') {
                    const sheetId = await sheetsService['getSheetId'](spreadsheetId, 'Subscriptions');
                    // Clear all data leaving header
                    await sheetsService['sheets'].spreadsheets.values.clear({
                        spreadsheetId,
                        range: 'Subscriptions!A2:K',
                    });
                    return NextResponse.json({ success: true, message: 'Reset complete' });
                }

                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
            } catch (error) {
                console.error('Error deleting finance data:', error);
                return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
            }
        }
