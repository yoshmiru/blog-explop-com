import type { APIRoute } from 'astro';
import { Octokit } from '@octokit/rest';

export const prerender = false;

export const POST: APIRoute = async (context) => {
	const { request } = context;
	try {
		const data = await request.json();
		const { title, description, pubDate, heroImage, content, slug } = data;

		if (!title || !content || !slug) {
			return new Response(
				JSON.stringify({ message: 'Title, content, and slug are required.' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Cloudflare Runtime Env から取得 (fallback として import.meta.env も残す)
		const env = (context.locals as any).runtime?.env || import.meta.env;
		const token = env.GITHUB_TOKEN;
		if (!token || token === 'your_token_here') {
			return new Response(
				JSON.stringify({ message: 'GitHub token is not configured or still has placeholder value.' }),
				{ status: 500, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const octokit = new Octokit({ auth: token });
		const owner = 'yoshmiru';
		const repo = 'blog-explop-com';
		const path = `src/content/blog/${slug}.md`;

		// 既存のファイルを検索して SHA を取得する (更新の場合に必要)
		let sha: string | undefined;
		try {
			const { data: existingFile } = await octokit.repos.getContent({
				owner,
				repo,
				path,
				ref: 'feature/admin',
			});
			if (!Array.isArray(existingFile)) {
				sha = (existingFile as any).sha;
			}
		} catch (e) {
			// ファイルが存在しない場合は新規作成
		}

		const today = new Date().toLocaleDateString('en-us', { year: 'numeric', month: 'short', day: 'numeric' });
		
		let fileContent = '';
		if (sha) {
			// 更新時: 元の pubDate を維持し、updatedDate を今日にする
			fileContent = `---
title: '${title}'
description: '${description || ''}'
pubDate: '${pubDate}'
updatedDate: '${today}'
heroImage: '${heroImage || ''}'
---

${content}
`;
		} else {
			// 新規作成時: pubDate を今日にする
			fileContent = `---
title: '${title}'
description: '${description || ''}'
pubDate: '${today}'
heroImage: '${heroImage || ''}'
---

${content}
`;
		}

		await octokit.repos.createOrUpdateFileContents({
			owner,
			repo,
			path,
			message: `cms: ${sha ? 'Update' : 'Create'} ${title}`,
			content: Buffer.from(fileContent).toString('base64'),
			sha,
			branch: 'feature/admin', // 現在の開発用ブランチ
		});

		return new Response(
			JSON.stringify({ message: 'Post saved successfully to GitHub!' }),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);
	} catch (error: any) {
		console.error('Error saving post:', error);
		const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
		return new Response(
			JSON.stringify({ message: 'Error saving post to GitHub', details: errorMessage }),
			{ status: error.status || 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};
