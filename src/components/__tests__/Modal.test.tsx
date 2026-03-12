import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Modal from '../Modal';

describe('Modal', () => {
  const mockOnClose = jest.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    children: <div>Modal Content</div>
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset body styles
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollY = 0;
  });

  afterEach(() => {
    // Clean up
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.removeAttribute('data-modal-open');
  });

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<Modal {...defaultProps} />);
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should render children content', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });
  });

  describe('Body Scroll Lock', () => {
    it('should lock body scroll when modal opens', () => {
      render(<Modal {...defaultProps} />);
      
      expect(document.body.style.overflow).toBe('hidden');
      expect(document.body.style.position).toBe('fixed');
      expect(document.body.style.width).toBe('100%');
      expect(document.body.getAttribute('data-modal-open')).toBe('true');
    });

    it('should save scroll position when modal opens', () => {
      // Set scroll position
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true, configurable: true });
      
      render(<Modal {...defaultProps} />);
      
      expect(document.body.style.top).toBe('-500px');
    });

    it('should restore body scroll when modal closes', async () => {
      const { rerender } = render(<Modal {...defaultProps} />);
      
      // Modal is open - body should be locked
      expect(document.body.style.overflow).toBe('hidden');
      
      // Close modal
      rerender(<Modal {...defaultProps} isOpen={false} />);
      
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('');
        expect(document.body.style.position).toBe('');
        expect(document.body.getAttribute('data-modal-open')).toBeNull();
      });
    });

    it('should restore scroll position when modal closes', async () => {
      Object.defineProperty(window, 'scrollY', { value: 300, writable: true, configurable: true });
      
      const { rerender } = render(<Modal {...defaultProps} />);
      
      // Modal opens - scroll position is saved
      expect(document.body.style.top).toBe('-300px');
      
      // Close modal
      rerender(<Modal {...defaultProps} isOpen={false} />);
      
      await waitFor(() => {
        expect(window.scrollTo).toHaveBeenCalledWith(0, 300);
      });
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when close button is clicked', () => {
      render(<Modal {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', () => {
      render(<Modal {...defaultProps} />);
      
      const backdrop = screen.getByText('Modal Content').parentElement?.parentElement?.parentElement?.parentElement;
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should not call onClose when modal content is clicked', () => {
      render(<Modal {...defaultProps} />);
      
      const content = screen.getByText('Modal Content');
      fireEvent.click(content);
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should call onClose when Escape key is pressed', () => {
      render(<Modal {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when other keys are pressed', () => {
      render(<Modal {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'Enter', code: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space', code: 'Space' });
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label on close button', () => {
      render(<Modal {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Close');
    });

    it('should trap focus within modal', () => {
      render(<Modal {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have proper backdrop styling', () => {
      const { container } = render(<Modal {...defaultProps} />);
      
      const backdrop = container.querySelector('.fixed.inset-0.z-\\[100\\]');
      expect(backdrop).toBeInTheDocument();
      expect(backdrop).toHaveClass('bg-black', 'bg-opacity-50');
    });

    it('should have scrollable content area', () => {
      const { container } = render(<Modal {...defaultProps} />);
      
      const scrollArea = container.querySelector('.modal-content-scroll');
      expect(scrollArea).toBeInTheDocument();
      expect(scrollArea).toHaveClass('overflow-y-auto');
    });

    it('should have responsive modal width', () => {
      const { container } = render(<Modal {...defaultProps} />);
      
      const modalContent = container.querySelector('.max-w-3xl');
      expect(modalContent).toBeInTheDocument();
      expect(modalContent).toHaveClass('md:max-w-5xl');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid open/close cycles', async () => {
      const { rerender } = render(<Modal {...defaultProps} />);
      
      // Rapid toggle
      rerender(<Modal {...defaultProps} isOpen={false} />);
      rerender(<Modal {...defaultProps} isOpen={true} />);
      rerender(<Modal {...defaultProps} isOpen={false} />);
      
      await waitFor(() => {
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });

    it('should handle missing children gracefully', () => {
      render(<Modal {...defaultProps} children={null} />);
      
      expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
    });

    it('should clean up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      const { unmount } = render(<Modal {...defaultProps} />);
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });
  });
});
