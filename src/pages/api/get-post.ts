import type { APIRoute } from 'astro';
import { Octokit } from '@octokit/rest';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
	const id = url.searchParams.get('id');

	if (!id) {
		return new Response(JSON.stringify({ message: 'Post ID (slug) is required.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		const token = import.meta.env.GITHUB_TOKEN;
		if (!token || token === 'your_token_here') {
			return new Response(JSON.stringify({ message: 'GitHub token is not configured.' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const octokit = new Octokit({ auth: token });
		const owner = 'yoshmiru';
		const repo = 'blog-explop-com';
		const path = `src/content/blog/${id}.md`;

		const { data } = await octokit.repos.getContent({
			owner,
			repo,
			path,
			ref: 'feature/admin',
		});

		if (Array.isArray(data)) {
			throw new Error('Path is a directory, not a file.');
		}

		// Base64 デコードして生のテキストを取得
		const content = Buffer.from(data.content, 'base64').toString('utf-8');

		// フロントマター（メタデータ）と本文をパースするための簡易処理
		// 本格的なパースライブラリを使わず、まずはそのまま返してエディタでパースするか
		// あるいはメタデータだけ抜き出すことも可能。
		// 今回は「メタデータ込みの生テキスト」と「SHA」を返します。
		return new Response(JSON.stringify({
			content,
			sha: data.sha
		}), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error: any) {
		console.error('Error fetching post content:', error);
		return new Response(JSON.stringify({ message: 'Error fetching post', error: error.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
