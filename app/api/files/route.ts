import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { FileService } from '@/lib/services/file.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const relatedType = searchParams.get('relatedType') as 'task' | 'gate' | 'message';
    const relatedId = searchParams.get('relatedId');

    if (!relatedType || !relatedId) {
      return NextResponse.json(
        { error: 'relatedType and relatedId are required' },
        { status: 400 }
      );
    }

    const attachments = await FileService.getAttachments(relatedType, relatedId);
    return NextResponse.json({ attachments });
  } catch (error: any) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const relatedType = formData.get('relatedType') as 'task' | 'gate' | 'message';
    const relatedId = formData.get('relatedId') as string;
    const accessToken = formData.get('accessToken') as string;

    if (!file || !relatedType || !relatedId || !accessToken) {
      return NextResponse.json(
        { error: 'file, relatedType, relatedId, and accessToken are required' },
        { status: 400 }
      );
    }

    const attachment = await FileService.uploadAndSaveFile(
      file,
      accessToken,
      session.user.email,
      relatedType,
      relatedId
    );

    return NextResponse.json({ attachment });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('attachmentId');

    if (!attachmentId) {
      return NextResponse.json(
        { error: 'attachmentId is required' },
        { status: 400 }
      );
    }

    await FileService.deleteAttachment(attachmentId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
