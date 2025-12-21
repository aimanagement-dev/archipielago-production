import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth-config';
import { GoogleSheetsService } from '@/lib/google-sheets';

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
    const { type, data } = body; // type: 'subscription' | 'expense'

    try {
        if (type === 'subscription') {
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
        return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }
}
