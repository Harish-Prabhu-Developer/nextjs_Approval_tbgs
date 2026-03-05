import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileExtension = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const uploadPath = join(process.cwd(), 'public', 'uploads', fileName);

        await writeFile(uploadPath, buffer);

        const fileUrl = `/uploads/${fileName}`;

        return NextResponse.json({
            fileUrl,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size
        });
    } catch (error) {
        console.error("Error uploading file:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
