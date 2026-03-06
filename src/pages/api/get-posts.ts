import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = false;

export const GET: APIRoute = async () => {
	try {
		const posts = (await getCollection('blog')) || [];
		// 日付順にソートして、必要なデータ（id, title, description）だけを返す
		const sortedPosts = posts
			.sort((a, b) => {
				const dateA = a.data.pubDate?.getTime() || 0;
				const dateB = b.data.pubDate?.getTime() || 0;
				return dateB - dateA;
			})
			.map(post => ({
				id: post.id,
				title: post.data.title || 'Untitled',
				pubDate: post.data.pubDate || new Date(),
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
