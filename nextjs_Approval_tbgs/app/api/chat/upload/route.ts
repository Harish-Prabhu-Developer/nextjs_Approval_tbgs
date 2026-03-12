import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

export async function POST(req: Request) {
    console.log(">>> [UPLOAD] Request started");
    try {
        const formData = await req.formData().catch(err => {
            console.error(">>> [UPLOAD] Error parsing formData:", err);
            throw new Error(`FormData parsing failed: ${err.message}`);
        });
        
        const file = formData.get('file');
        console.log(">>> [UPLOAD] Received field 'file':", file ? "Yes" : "No");

        if (!file || typeof file === 'string') {
            console.error(">>> [UPLOAD] Invalid file field");
            return NextResponse.json({ message: 'No file uploaded or invalid file format' }, { status: 400 });
        }

        const fileObj = file as any;
        console.log(">>> [UPLOAD] File details:", {
            name: fileObj.name,
            type: fileObj.type,
            size: fileObj.size
        });

        const bytes = await fileObj.arrayBuffer().catch((err: any) => {
            console.error(">>> [UPLOAD] Error reading arrayBuffer:", err);
            throw new Error(`ArrayBuffer conversion failed: ${err.message}`);
        });
        const buffer = Buffer.from(bytes);
        console.log(">>> [UPLOAD] Buffer created, size:", buffer.length);

        const originalName = fileObj.name || 'unknown_file';
        const fileExtension = originalName.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        console.log(">>> [UPLOAD] Targeted directory:", uploadDir);
        
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            console.log(">>> [UPLOAD] Creating directory...");
            await mkdir(uploadDir, { recursive: true });
        }
        
        const uploadPath = join(uploadDir, fileName);
        console.log(">>> [UPLOAD] Writing to path:", uploadPath);
        
        await writeFile(uploadPath, buffer).catch(err => {
            console.error(">>> [UPLOAD] Error writing file:", err);
            throw new Error(`FileSystem write failed: ${err.message}`);
        });

        const fileUrl = `/uploads/${fileName}`;
        const contentType = fileObj.type || 'application/octet-stream';
        
        // For serverless deployments (like Netlify/Vercel), local filesystem writes aren't persistent.
        // We provide a base64 version for images so they work everywhere.
        let base64Data = null;
        if (contentType.startsWith('image/')) {
            base64Data = `data:${contentType};base64,${buffer.toString('base64')}`;
            console.log(">>> [UPLOAD] Image detected, generated base64 (length:", base64Data.length, ")");
        }

        console.log(">>> [UPLOAD] Success! URL:", fileUrl);

        return NextResponse.json({
            fileUrl: base64Data || fileUrl, // Use base64 for images as fallback
            fileName: originalName,
            fileType: contentType,
            fileSize: fileObj.size,
            internalPath: fileUrl
        });
    } catch (error: any) {
        console.error(">>> [UPLOAD] FATAL ERROR:", error);
        return NextResponse.json({ 
            message: error.message || 'Internal Server Error',
            details: error.toString(),
            stack: error.stack
        }, { status: 500 });
    }
}
