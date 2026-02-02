'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { Plus, Edit2 } from 'lucide-react';

interface Cat {
  name: string;
  avatar: string;
  age: { years: number; months: number };
  bodyCondition: string;
  healthConditions: string[];
}

export default function ProfilePage() {
  const [userName, setUserName] = useState('');
  const [cats, setCats] = useState<Cat[]>([]);

  useEffect(() => {
    // Load user data from localStorage
    const storedUserName = localStorage.getItem('userName');
    const storedCats = localStorage.getItem('cats');
    
    if (storedUserName) setUserName(storedUserName);
    if (storedCats) setCats(JSON.parse(storedCats));
  }, []);

  return (
    <>
      <Header />
      <main className="pt-8 pb-16 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-serif mb-2 text-gray-900">
              {userName ? `Welcome back, ${userName}!` : 'Your Profile'}
            </h1>
            <p className="text-gray-600">Manage your cats and view your scan history</p>
          </div>

          {/* Your Cats Section */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif text-gray-900">Your Cats</h2>
              <Link 
                href="/food-input?addCat=true"
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-dark text-white hover:text-[#f0fdf4] font-semibold px-6 py-2 rounded-full shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-soft transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Add Cat
              </Link>
            </div>

            {cats.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cats.map((cat, i) => (
                  <div 
                    key={i}
                    className="bg-white rounded-2xl p-6 border-2 border-emerald-100 shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-2xl">
                        {cat.avatar || '🐱'}
                      </div>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    <h3 className="font-serif text-xl mb-2 text-gray-900">{cat.name}</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Age: {cat.age.years}y {cat.age.months}m</p>
                      <p>Condition: {cat.bodyCondition}</p>
                      {cat.healthConditions && cat.healthConditions.length > 0 && (
                        <p className="text-xs mt-2 text-gray-500">
                          Conditions: {cat.healthConditions.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 border-2 border-dashed border-emerald-200 text-center">
                <div className="text-6xl mb-4">🐱</div>
                <p className="text-gray-600 mb-4">No cats added yet</p>
                <Link 
                  href="/food-input?addCat=true"
                  className="inline-block bg-primary-600 hover:bg-primary-dark text-white hover:text-[#f0fdf4] font-semibold px-8 py-3 rounded-full shadow-soft-lg hover:shadow-soft-xl hover:-translate-y-1 active:translate-y-0 active:shadow-soft transition-all duration-200"
                >
                  Add Your First Cat
                </Link>
              </div>
            )}
          </section>

          {/* Scan History Section */}
          <section>
            <h2 className="text-2xl font-serif text-gray-900 mb-6">Scan History</h2>
            <div className="bg-white rounded-2xl p-12 border-2 border-dashed border-emerald-200 text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-600 mb-4">No scans yet</p>
              <Link 
                href="/food-input"
                className="inline-block bg-primary-600 hover:bg-primary-dark text-white hover:text-[#f0fdf4] font-semibold px-8 py-3 rounded-full shadow-soft-lg hover:shadow-soft-xl hover:-translate-y-1 active:translate-y-0 active:shadow-soft transition-all duration-200"
              >
                Start Your First Scan
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
