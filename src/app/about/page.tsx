'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Modal from '@/components/Modal';
import MemoModalContent from '@/components/MemoModalContent';

export default function AboutPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMemoId, setSelectedMemoId] = useState<string | null>(null);

  const handleMemoClick = (memoId: string) => {
    setSelectedMemoId(memoId);
    setIsModalOpen(true);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen mt-[80px] sm:mt-[104px]">
            {/* Hero Section */}
            <section className="container mx-auto px-4 sm:px-6 lg:px-12 xl:px-24 pt-6 sm:pt-8 pb-4 max-w-5xl">
              {/* Main Content */}
              <div className="space-y-6 text-base sm:text-lg text-gray-700 leading-relaxed">
                <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-6">
                  项目愿景
                </h2>
                
                <p>
                  "苧麻备忘录"试图收集那些应该被我们记住的声音。
                </p>
                
                <p>
                  这里不是一间完备的档案馆，而是一册轻便、可随身携带的备忘录。
                </p>
                
                <p>
                  这里永远是不完整的。无论如何努力，没有人能够记下所有的声音。正因欠缺，我们才必须学会包容。
                </p>
              </div>
            </section>
            {/* Contribution Section */}
            <section>
              <div className="container mx-auto px-4 sm:px-6 lg:px-12 xl:px-24 pt-6 pb-12 max-w-5xl">
                <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-6">
                  如何贡献
                </h2>
                <p className="text-base sm:text-lg text-gray-700 mb-10">
                  本项目在
                  <a 
                    href="https://github.com/sicutHerba/RamieMemo" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block text-gray-700 hover:text-black transition-colors mx-1 align-middle"
                    title="View on GitHub"
                  >
                    <span className="inline-flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                      RamieMemo
                    </span>
                  </a>
                  完全开源，欢迎各种形式的贡献：报告错误、上传新内容、更新现有备忘录、改进代码。
                </p>
                
                <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
                  {/* GitHub Card */}
                  <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ring-1 ring-gray-200">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">提交新备忘录</h3>
                      <span className="text-[10px] sm:text-xs font-medium text-gray-700 bg-gray-100 rounded-full px-2 py-0.5">推荐</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">使用 Issue 模板自动提交</p>
                    <a
                      href="https://github.com/sicutHerba/RamieMemo/issues/new?template=new-memo.yml"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-gray-700 hover:text-black transition-colors font-medium"
                    >
                      打开模板
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>

                  {/* Form Card */}
                  <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">填写表单</h3>
                    <p className="text-sm text-gray-600 mb-3">通过 Google 表单提交您的内容</p>
                    <a 
                      href="https://forms.gle/w81nXqYXf8Z1hUxV8" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-gray-700 hover:text-black transition-colors font-medium"
                    >
                      前往投稿表单
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>

                  {/* Email Card */}
                  <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">发送邮件</h3>
                    <p className="text-sm text-gray-600 mb-3">直接发送邮件至我们的邮箱</p>
                    <a 
                      href="mailto:sicut.herba@hotmail.com"
                      className="inline-flex items-center text-sm text-gray-700 hover:text-black transition-colors font-medium break-all"
                    >
                      sicut.herba@hotmail.com
                      <svg className="w-4 h-4 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* Copyright Disclaimer */}
            <section className="pb-8">
              <div className="container mx-auto px-4 sm:px-6 lg:px-12 xl:px-24 max-w-5xl">
                <p className="text-sm text-gray-500">
                  本项目收录的内容来源于公开资料，若有侵权，请通过以下方式联系我们，我们将及时处理：
                  <a 
                    href="mailto:sicut.herba@hotmail.com"
                    className="text-gray-500 hover:text-gray-700 transition-colors ml-1"
                  >
                    sicut.herba@hotmail.com
                  </a>
                </p>
              </div>
            </section>
      </main>
      
      {/* Memo Detail Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {selectedMemoId && (
          <MemoModalContent initialMemoId={selectedMemoId} />
        )}
      </Modal>
    </>
  );
}
