import { MemoNotFoundError, MemoIndexLoadError, ValidationError } from '../errors';

describe('Custom Error Types', () => {
  describe('MemoNotFoundError', () => {
    it('should create error with memo ID in message', () => {
      const error = new MemoNotFoundError('memo_123');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(MemoNotFoundError);
      expect(error.message).toBe('Memo not found: memo_123');
      expect(error.name).toBe('MemoNotFoundError');
    });
  });

  describe('MemoIndexLoadError', () => {
    it('should create error with default message', () => {
      const error = new MemoIndexLoadError();
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(MemoIndexLoadError);
      expect(error.message).toBe('Failed to load memo index');
      expect(error.name).toBe('MemoIndexLoadError');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Network timeout';
      const error = new MemoIndexLoadError(customMessage);
      
      expect(error.message).toBe(customMessage);
    });
  });

  describe('ValidationError', () => {
    it('should create error with message and field', () => {
      const error = new ValidationError('Title is required', 'title');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Title is required');
      expect(error.field).toBe('title');
      expect(error.name).toBe('ValidationError');
    });

    it('should create error without field', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.message).toBe('Invalid input');
      expect(error.field).toBeUndefined();
    });
  });
});
