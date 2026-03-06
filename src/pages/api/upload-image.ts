import type { APIRoute } from 'astro';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const prerender = false;

const s3Client = new S3Client({
	region: 'auto',
	endpoint: import.meta.env.R2_ENDPOINT,
	credentials: {
		accessKeyId: import.meta.env.R2_ACCESS_KEY_ID,
		secretAccessKey: import.meta.env.R2_SECRET_ACCESS_KEY,
	},
});

export const POST: APIRoute = async ({ request }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('image') as File;

		if (!file) {
			return new Response(JSON.stringify({ message: 'No image file provided.' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// ファイル名の生成 (重複防止のためにタイムスタンプを付与)
		const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
		const arrayBuffer = await file.arrayBuffer();

		// R2 にアップロード (Key から blog/ を削除して重複を防止)
		await s3Client.send(new PutObjectCommand({
			Bucket: import.meta.env.R2_BUCKET_NAME,
			Key: fileName,
			Body: new Uint8Array(arrayBuffer),
			ContentType: file.type,
		}));

		// 公開URLの生成 (baseUrl + fileName のシンプルな形にする)
		const baseUrl = import.meta.env.R2_PUBLIC_URL.replace(/\/$/, '');
		const publicUrl = `${baseUrl}/${fileName}`;

		return new Response(JSON.stringify({ url: publicUrl }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error: any) {
		console.error('Error uploading to R2:', error);
		return new Response(JSON.stringify({ message: 'Error uploading image', error: error.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
