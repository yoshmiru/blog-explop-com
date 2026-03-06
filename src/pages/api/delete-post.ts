import type { APIRoute } from 'astro';
import { Octokit } from '@octokit/rest';

export const prerender = false;

export const POST: APIRoute = async (context) => {
	const { request } = context;
	try {
		const data = await request.json();
		const { slug } = data;

		if (!slug) {
			return new Response(
				JSON.stringify({ message: 'Slug is required for deletion.' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Cloudflare Runtime Env から取得
		const env = (context.locals as any).runtime?.env || import.meta.env;
		const token = env.GITHUB_TOKEN;
		if (!token || token === 'your_token_here') {
			return new Response(
				JSON.stringify({ message: 'GitHub token is not configured.' }),
				{ status: 500, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const octokit = new Octokit({ auth: token });
		const owner = 'yoshmiru';
		const repo = 'blog-explop-com';
		const path = `src/content/blog/${slug}.md`;

		// ファイルの SHA を取得する (削除に必要)
		let sha: string;
		try {
			const { data: fileData } = await octokit.repos.getContent({
				owner,
				repo,
				path,
				ref: 'feature/admin',
			});
			if (Array.isArray(fileData)) {
				throw new Error('Path is a directory.');
			}
			sha = fileData.sha;
		} catch (e: any) {
			return new Response(
				JSON.stringify({ message: 'File not found or already deleted.', error: e.message }),
				{ status: 404, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// GitHub からファイルを削除
		await octokit.repos.deleteFile({
			owner,
			repo,
			path,
			message: `cms: Delete post ${slug}`,
			sha,
			branch: 'feature/admin',
		});

		return new Response(
			JSON.stringify({ message: `Post ${slug} deleted successfully.` }),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);
	} catch (error: any) {
		console.error('Error deleting post:', error);
		return new Response(
			JSON.stringify({ message: 'Error deleting post', error: error.message }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};
