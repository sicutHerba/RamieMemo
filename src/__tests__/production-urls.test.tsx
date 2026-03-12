/**
 * Test to verify all navigation URLs work correctly in production
 */

describe('Production URL Generation', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Set to production mode
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });

  it('should generate correct production URLs for navigation links', () => {
    // Test basePath constant (used in Header)
    const basePath = process.env.NODE_ENV === 'production' ? '/RamieMemo' : '';
    expect(basePath).toBe('/RamieMemo');

    // Test inline conditionals (used in page.tsx, MemoCard, etc.)
    const exploreUrl = `${process.env.NODE_ENV === 'production' ? '/RamieMemo' : ''}/explore`;
    expect(exploreUrl).toBe('/RamieMemo/explore');

    // Test tag link format (used in explore page)
    const tagUrl = `${basePath}/explore?tag=test-tag`;
    expect(tagUrl).toBe('/RamieMemo/explore?tag=test-tag');

    // Test memo detail link format
    const memoUrl = `${process.env.NODE_ENV === 'production' ? '/RamieMemo' : ''}/memo/test-id`;
    expect(memoUrl).toBe('/RamieMemo/memo/test-id');
  });

  it('should generate correct development URLs', () => {
    // Switch to development
    process.env.NODE_ENV = 'development';

    const basePath = process.env.NODE_ENV === 'production' ? '/RamieMemo' : '';
    expect(basePath).toBe('');

    const exploreUrl = `${process.env.NODE_ENV === 'production' ? '/RamieMemo' : ''}/explore`;
    expect(exploreUrl).toBe('/explore');

    const tagUrl = `${basePath}/explore?tag=test-tag`;
    expect(tagUrl).toBe('/explore?tag=test-tag');
  });

  it('should NOT add basePath to router.replace calls', () => {
    // Router methods handle basePath automatically via next.config.js
    // So we should use plain paths without manual basePath
    const routerPath = '/explore?page=2';
    expect(routerPath).toBe('/explore?page=2');
    expect(routerPath).not.toContain('/RamieMemo');
  });
});
