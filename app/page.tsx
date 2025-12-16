"use client";

import { useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import GeneratorInterface from '@/components/GeneratorInterface';
import SampleGallery from '@/components/SampleGallery';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';

export default function Home() {
  const [prompt, setPrompt] = useState('');

  const handleSelectPrompt = (newPrompt: string) => {
    setPrompt(newPrompt);
    // Smooth scroll to top or generator when prompt is selected, for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans">
      <Header />

      <main className="flex flex-col items-center pt-10">
        <Hero />

        <GeneratorInterface
          prompt={prompt}
          setPrompt={setPrompt}
        />

        <SampleGallery
          onSelectPrompt={handleSelectPrompt}
        />

        <CTA />
      </main>

      <Footer />
    </div>
  );
}
