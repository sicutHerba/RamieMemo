import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '关于我们 About',
  description: '苧麻备忘录试图收集那些应该被我们记住的声音。',
  openGraph: {
    title: '关于我们 | 苧麻备忘录 Ramie Memo',
    description: '苧麻备忘录试图收集那些应该被我们记住的声音。',
    type: 'website',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
