'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Home, Cat } from 'lucide-react';

export default function Header() {
  return (
    <header className="whisker-header">
      <div className="header-content-wrapper">
        <Link 
          href="/now-wiser" 
          className="header-icon-btn"
          aria-label="Go to home"
        >
          <Home className="w-5 h-5" />
        </Link>
        
        <Link href="/now-wiser" className="header-logo-link">
          <Image 
            src="/logo-light.png" 
            alt="Whisker Wise" 
            width={269} 
            height={67}
            className="h-10 sm:h-12 lg:h-[67px] w-auto max-h-[56px] sm:max-h-[72px] lg:max-h-none"
            priority
            unoptimized
          />
        </Link>
        
        <Link 
          href="/profile"
          className="header-icon-btn"
          aria-label="Profile"
        >
          <div className="cat-icon-container">
            <Cat className="w-5 h-5" />
            <svg 
              className="heart-sparkle-icon" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        </Link>
      </div>
      
      <div className="wiggly-border-bottom"></div>
    </header>
  );
}
