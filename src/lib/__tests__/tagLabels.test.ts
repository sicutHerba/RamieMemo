import { getTagLabel, getTagId, tagLabels } from '../tagLabels';

describe('Tag Labels', () => {
  describe('getTagLabel', () => {
    it('should return Chinese label for mapped tag', () => {
      expect(getTagLabel('legal', 'zh')).toBe('司法');
      expect(getTagLabel('politics', 'zh')).toBe('政治');
      expect(getTagLabel('censorship', 'zh')).toBe('审查');
    });

    it('should return English label for mapped tag', () => {
      expect(getTagLabel('legal', 'en')).toBe('Legal');
      expect(getTagLabel('politics', 'en')).toBe('Politics');
      expect(getTagLabel('censorship', 'en')).toBe('Censorship');
    });

    it('should return tag itself for unmapped tags', () => {
      expect(getTagLabel('unmapped-tag', 'zh')).toBe('unmapped-tag');
      expect(getTagLabel('custom', 'en')).toBe('custom');
    });

    it('should handle all defined tag labels', () => {
      tagLabels.forEach(tagLabel => {
        expect(getTagLabel(tagLabel.id, 'zh')).toBe(tagLabel.label.zh);
        expect(getTagLabel(tagLabel.id, 'en')).toBe(tagLabel.label.en);
      });
    });
  });

  describe('getTagId', () => {
    it('should return tag ID from Chinese display text', () => {
      expect(getTagId('司法')).toBe('legal');
      expect(getTagId('政治')).toBe('politics');
      expect(getTagId('人权')).toBe('human-rights');
    });

    it('should return tag ID from English display text', () => {
      expect(getTagId('Legal')).toBe('legal');
      expect(getTagId('Politics')).toBe('politics');
      expect(getTagId('Human Rights')).toBe('human-rights');
    });

    it('should handle case-insensitive matching', () => {
      expect(getTagId('POLITICS')).toBe('politics');
      expect(getTagId('legal')).toBe('legal');
      expect(getTagId('HuMaN RiGhTs')).toBe('human-rights');
      expect(getTagId('CENSORSHIP')).toBe('censorship');
    });

    it('should return normalized ID for unmapped tags', () => {
      expect(getTagId('Custom Tag')).toBe('custom-tag');
      expect(getTagId('Some New Topic')).toBe('some-new-topic');
      expect(getTagId('Multiple   Spaces')).toBe('multiple-spaces');
    });

    it('should handle tag ID input directly', () => {
      expect(getTagId('politics')).toBe('politics');
      expect(getTagId('human-rights')).toBe('human-rights');
      expect(getTagId('freedom-of-speech')).toBe('freedom-of-speech');
    });

    it('should handle all new mapped tags', () => {
      // Core topics
      expect(getTagId('Legal')).toBe('legal');
      expect(getTagId('司法')).toBe('legal');
      expect(getTagId('Quote')).toBe('quote');
      expect(getTagId('名言')).toBe('quote');
      expect(getTagId('Censorship')).toBe('censorship');
      expect(getTagId('审查')).toBe('censorship');
      
      // People
      expect(getTagId('Tan Zuoren')).toBe('tan-zuoren');
      expect(getTagId('谭作人')).toBe('tan-zuoren');
      expect(getTagId('Ai Weiwei')).toBe('ai-weiwei');
      expect(getTagId('艾未未')).toBe('ai-weiwei');
    });

    it('should normalize special characters in fallback', () => {
      expect(getTagId('Test-Tag')).toBe('test-tag');
      expect(getTagId('Tag_With_Underscores')).toBe('tag_with_underscores');
    });
  });

  describe('tag mapping consistency', () => {
    it('should round-trip tag IDs correctly', () => {
      tagLabels.forEach(tagLabel => {
        // ID -> Chinese -> ID
        const zhLabel = getTagLabel(tagLabel.id, 'zh');
        expect(getTagId(zhLabel)).toBe(tagLabel.id);
        
        // ID -> English -> ID
        const enLabel = getTagLabel(tagLabel.id, 'en');
        expect(getTagId(enLabel)).toBe(tagLabel.id);
      });
    });

    it('should have unique tag IDs', () => {
      const ids = tagLabels.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid bilingual labels', () => {
      tagLabels.forEach(tagLabel => {
        expect(tagLabel.label.zh).toBeTruthy();
        expect(tagLabel.label.en).toBeTruthy();
        expect(typeof tagLabel.label.zh).toBe('string');
        expect(typeof tagLabel.label.en).toBe('string');
      });
    });
  });
});
