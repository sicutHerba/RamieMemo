// Predefined search keywords for the explore page
// These are suggested search terms that appear in the search bar
// Different from tags - these are actual search queries users might type
// Keywords are extracted from actual memo content in the database

export const searchKeywords = [
  '献花',
  '孙志刚',
  '北京',
  '宪法',
  '死亡',
  '火灾',
  '爆炸',
  '核酸',
  '罢工',
  '河南',
  '水库',
  '许志永',
  '共产党',
];

/**
 * Get a random search keyword from the predefined list
 */
export function getRandomSearchKeyword(): string {
  return searchKeywords[Math.floor(Math.random() * searchKeywords.length)];
}
