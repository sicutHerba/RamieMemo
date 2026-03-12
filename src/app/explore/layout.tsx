import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '探索 Explore',
  description: '搜索和浏览所有备忘录,通过标签、日期和关键词筛选重要的历史事件。',
  openGraph: {
    title: '探索 | 苧麻备忘录 Ramie Memo',
    description: '搜索和浏览所有备忘录,通过标签、日期和关键词筛选重要的历史事件。',
    type: 'website',
  },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
