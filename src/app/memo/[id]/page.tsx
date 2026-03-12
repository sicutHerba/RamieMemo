import { Memo, MemoIndex } from '@/types/memo';
import MemoDetailClient from './MemoDetailClient';
import fs from 'fs';
import path from 'path';
import { Metadata } from 'next';

// Generate static params for all memos at build time
export async function generateStaticParams() {
  try {
    const indexPath = path.join(process.cwd(), 'public', 'data', 'memos', 'index.json');
    const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as MemoIndex;
    
    return indexData.memos.map((memo) => ({
      id: memo.id,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Generate metadata for each memo page
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const indexPath = path.join(process.cwd(), 'public', 'data', 'memos', 'index.json');
    const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as MemoIndex;
    
    const memoInfo = indexData.memos.find((m) => m.id === params.id);
    
    if (!memoInfo) {
      return {
        title: 'Memo Not Found',
      };
    }

    const title = memoInfo.title.zh || memoInfo.title.en || 'Untitled Memo';
    const date = memoInfo.date ? `- 记录于 ${memoInfo.date.slice(0, 2)}月${memoInfo.date.slice(2, 4)}日` : '';
    const description = `${title} ${date}`;
    const baseUrl = 'https://sicutherba.github.io/RamieMemo';
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
        url: `${baseUrl}/memo/${params.id}`,
        siteName: '苧麻备忘录 Ramie Memo',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Ramie Memo',
    };
  }
}

export default function MemoDetailPage({ params }: { params: { id: string } }) {
  return <MemoDetailClient memoId={params.id} />;
}

