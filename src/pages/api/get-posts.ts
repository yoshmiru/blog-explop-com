import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = false;

export const GET: APIRoute = async () => {
	try {
		const posts = await getCollection('blog');
		// 日付順にソートして、必要なデータ（id, title, description）だけを返す
		const sortedPosts = posts
			.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
			.map(post => ({
				id: post.id,
				title: post.data.title,
				pubDate: post.data.pubDate,
			}));

		return new Response(JSON.stringify(sortedPosts), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error: any) {
		return new Response(JSON.stringify({ message: 'Error fetching posts', error: error.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
