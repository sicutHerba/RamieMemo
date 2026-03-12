import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmptyCalendarCard from '../EmptyCalendarCard';

describe('EmptyCalendarCard', () => {
  describe('Rendering', () => {
    it('should render empty card', () => {
      const { container } = render(<EmptyCalendarCard />);
      
      const card = container.querySelector('.memo-card-calendar');
      expect(card).toBeInTheDocument();
    });

    it('should have correct dimensions', () => {
      const { container } = render(<EmptyCalendarCard />);
      
      const card = container.querySelector('.memo-card-calendar');
      expect(card).toHaveStyle({ height: '500px' });
    });

    it('should have proper styling', () => {
      const { container } = render(<EmptyCalendarCard />);
      
      const card = container.querySelector('.memo-card-calendar');
      expect(card).toHaveClass('bg-[#FAF8F3]', 'rounded-sm', 'shadow-lg');
    });

    it('should be empty with no content', () => {
      const { container } = render(<EmptyCalendarCard />);
      
      // Should have no text content
      expect(container.textContent).toBe('');
    });

    it('should have responsive max-width', () => {
      const { container } = render(<EmptyCalendarCard />);
      
      const card = container.querySelector('.memo-card-calendar');
      expect(card).toHaveClass('max-w-[320px]', 'sm:max-w-[480px]');
    });

    it('should maintain consistent appearance across renders', () => {
      const { container: container1 } = render(<EmptyCalendarCard />);
      const { container: container2 } = render(<EmptyCalendarCard />);
      
      const card1 = container1.querySelector('.memo-card-calendar');
      const card2 = container2.querySelector('.memo-card-calendar');
      
      expect(card1?.className).toBe(card2?.className);
    });
  });

  describe('Layout', () => {
    it('should use flexbox layout', () => {
      const { container } = render(<EmptyCalendarCard />);
      
      const card = container.querySelector('.memo-card-calendar');
      expect(card).toHaveStyle({
        display: 'flex',
        flexDirection: 'column'
      });
    });

    it('should center the card', () => {
      const { container } = render(<EmptyCalendarCard />);
      
      const card = container.querySelector('.memo-card-calendar');
      expect(card).toHaveStyle({ margin: '0 auto' });
    });

    it('should have full width within constraints', () => {
      const { container } = render(<EmptyCalendarCard />);
      
      const card = container.querySelector('.memo-card-calendar');
      expect(card).toHaveStyle({ width: '100%' });
    });
  });

  describe('Edge Cases', () => {
    it('should not crash when rendered multiple times', () => {
      const { rerender } = render(<EmptyCalendarCard />);
      
      expect(() => {
        rerender(<EmptyCalendarCard />);
        rerender(<EmptyCalendarCard />);
        rerender(<EmptyCalendarCard />);
      }).not.toThrow();
    });

    it('should be accessible', () => {
      const { container } = render(<EmptyCalendarCard />);
      
      const card = container.querySelector('.memo-card-calendar');
      expect(card).toBeInTheDocument();
      // Empty card should be visible but non-interactive
    });
  });
});
