'use client';

import Image from 'next/image';
import { Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative bg-[#41624F] text-[#FFFEF5] py-12 mt-16">
      {/* Paper grain texture */}
      <div className="absolute inset-0 z-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27400%27 height=%27400%27%3E%3Cfilter id=%27noise%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27400%27 height=%27400%27 filter=%27url(%23noise)%27 opacity=%270.12%27/%3E%3C/svg%3E')] opacity-50 pointer-events-none"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 flex flex-col items-center">
        <p className="text-xl font-serif">
          Join hundreds others in our community of cat parents!
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-4">
          <a 
            href="https://www.instagram.com/whiskerwise.in/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-110"
          >
            <Instagram className="w-6 h-6" />
            <span className="font-sans font-medium">Instagram</span>
          </a>
          <a 
            href="https://wa.me/919682387557" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-110"
          >
            <Image 
              src="/whatsapp.png" 
              alt="WhatsApp" 
              width={24} 
              height={24}
              unoptimized
            />
            <span className="font-sans font-medium">WhatsApp</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
