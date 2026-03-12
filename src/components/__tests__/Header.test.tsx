import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '../Header';
import { LanguageProvider } from '@/contexts/LanguageContext';

const renderWithLanguage = (component: React.ReactElement) => {
  return render(
    <LanguageProvider>
      {component}
    </LanguageProvider>
  );
};

describe('Header', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render logo and title', () => {
    renderWithLanguage(<Header />);
    
    const logo = screen.getByAltText('Ramie Memo');
    expect(logo).toBeInTheDocument();
    expect(screen.getByText(/苧麻备忘录 Ramie Memo/)).toBeInTheDocument();
  });

  it('should render tagline', () => {
    renderWithLanguage(<Header />);
    
    expect(screen.getByText('丝缕交织，草木绵延')).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    renderWithLanguage(<Header />);
    
    // Check for links that are visible on desktop (hidden on mobile)
    const todayLinks = screen.getAllByText('今日');
    const exploreLinks = screen.getAllByText('浏览');
    const aboutLinks = screen.getAllByText('关于');
    
    expect(todayLinks.length).toBeGreaterThan(0);
    expect(exploreLinks.length).toBeGreaterThan(0);
    expect(aboutLinks.length).toBeGreaterThan(0);
  });

  it('should have mobile menu button', () => {
    renderWithLanguage(<Header />);
    
    const menuButton = screen.getByLabelText('Menu');
    expect(menuButton).toBeInTheDocument();
  });

  it('should have correct navigation hrefs', () => {
    renderWithLanguage(<Header />);
    
    const links = screen.getAllByRole('link');
    const homeLink = links.find(link => link.textContent === '今日');
    const exploreLink = links.find(link => link.textContent === '浏览');
    const aboutLink = links.find(link => link.textContent === '关于');
    
    expect(homeLink).toHaveAttribute('href', '/');
    expect(exploreLink).toHaveAttribute('href', '/explore');
    expect(aboutLink).toHaveAttribute('href', '/about');
  });

  it('should have responsive CSS classes on container', () => {
    const { container } = renderWithLanguage(<Header />);
    
    const headerContainer = container.querySelector('div[class*="px-4"]');
    expect(headerContainer).toBeInTheDocument();
    expect(headerContainer?.className).toMatch(/px-4/);
    expect(headerContainer?.className).toMatch(/sm:px-6/);
    expect(headerContainer?.className).toMatch(/lg:px-12/);
  });

  it('should have responsive sizing classes on logo', () => {
    renderWithLanguage(<Header />);
    
    const logo = screen.getByAltText('Ramie Memo');
    expect(logo.className).toMatch(/w-12/);
    expect(logo.className).toMatch(/h-12/);
    expect(logo.className).toMatch(/sm:w-16/);
    expect(logo.className).toMatch(/sm:h-16/);
  });

  it('should have title visible on all screen sizes', () => {
    const { container } = renderWithLanguage(<Header />);
    
    const title = container.querySelector('h1 a');
    expect(title).toBeInTheDocument();
    expect(title?.textContent).toBe('苧麻备忘录 Ramie Memo');
  });

  it('should have responsive navigation with hidden links on mobile', () => {
    const { container } = renderWithLanguage(<Header />);
    
    const navLinks = container.querySelectorAll('nav a');
    
    const homeLink = Array.from(navLinks).find(link => link.className.includes('hidden md:inline'));
    const exploreLink = Array.from(navLinks).find(link => link.className.includes('hidden sm:inline') && !link.className.includes('md:inline'));
    const aboutLink = Array.from(navLinks).find(link => link.className.includes('hidden md:inline') && link.textContent === '关于');
   
    expect(homeLink).toBeDefined();
    expect(homeLink?.className).toMatch(/hidden/);
    expect(homeLink?.className).toMatch(/md:inline/);
    
    expect(exploreLink).toBeDefined();
    expect(exploreLink?.className).toMatch(/hidden/);
    expect(exploreLink?.className).toMatch(/sm:inline/);
    
    expect(aboutLink).toBeDefined();
    expect(aboutLink?.className).toMatch(/hidden/);
    expect(aboutLink?.className).toMatch(/md:inline/);
  });
});
