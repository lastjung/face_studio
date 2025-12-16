"use client";

import { useState } from 'react';
import Image from 'next/image';
import { clsx } from 'clsx';

type Category = 'woman' | 'man' | 'baby';

interface SampleGalleryProps {
    onSelectPrompt: (prompt: string) => void;
}

const SAMPLE_DATA = {
    woman: {
        original: "/samples/woman/original.webp",
        examples: [
            { id: 1, src: "/samples/woman/1.webp", prompt: "Professional LinkedIn headshot, suit, studio lighting, confident smile" },
            { id: 2, src: "/samples/woman/2.webp", prompt: "Cyberpunk vivid colors, neon lights, futuristic city background" },
            { id: 3, src: "/samples/woman/3.webp", prompt: "Vintage 1950s hollywood glamour style, black and white portrait" },
            { id: 4, src: "/samples/woman/4.webp", prompt: "Ethereal fairy queen, forest background, magical glowing particles" },
            { id: 5, src: "/samples/woman/5.webp", prompt: "Oil painting style, renaissance era noblewoman" },
            { id: 6, src: "/samples/woman/6.webp", prompt: "Minimalist vector art illustration, flat colors" },
            { id: 7, src: "/samples/woman/7.webp", prompt: "Pixar style 3D character animation render" },
            { id: 8, src: "/samples/woman/8.webp", prompt: "Watercolor splash art, artistic dreamy portrait" },
            { id: 9, src: "/samples/woman/9.webp", prompt: "Detailed pencil sketch, charcoal shading" },
        ]
    },
    man: {
        original: "/samples/man/original.webp",
        examples: [
            { id: 1, src: "/samples/man/1.webp", prompt: "CEO in modern office, suit, arms crossed, confident" },
            { id: 2, src: "/samples/man/2.webp", prompt: "Viking warrior, rugged beard, fur armor, snowy mountains" },
            { id: 3, src: "/samples/man/3.webp", prompt: "Astronaut in sci-fi spacesuit, galaxy background reflected in visor" },
            { id: 4, src: "/samples/man/4.webp", prompt: "1920s gangster style, fedora hat, noir atmosphere" },
            { id: 5, src: "/samples/man/5.webp", prompt: "Cybernetic cyborg enhancement, glowing red eye, metal skin" },
            { id: 6, src: "/samples/man/6.webp", prompt: "Hogwarts wizard student, holding wand, magical library" },
            { id: 7, src: "/samples/man/7.webp", prompt: "Claymation style character, stop motion aesthetic" },
            { id: 8, src: "/samples/man/8.webp", prompt: "Pop art comic book style, halftone dots, bold outlines" },
            { id: 9, src: "/samples/man/9.webp", prompt: "Samurai in traditional armor, cherry blossoms falling" },
        ]
    },
    baby: {
        original: "/samples/baby/original.webp",
        examples: [
            { id: 1, src: "/samples/baby/1.webp", prompt: "Pixar movie protagonist, cute, big eyes, 3D render" },
            { id: 2, src: "/samples/baby/2.webp", prompt: "Little prince style, watercolor, planet and stars" },
            { id: 3, src: "/samples/baby/3.webp", prompt: "Superhero kid with cape, flying in the clouds" },
            { id: 4, src: "/samples/baby/4.webp", prompt: "Fantasy elf child, pointed ears, magic forest" },
            { id: 5, src: "/samples/baby/5.webp", prompt: "Studio Ghibli style, peaceful meadow, fluffy clouds" },
            { id: 6, src: "/samples/baby/6.webp", prompt: "LEGO minifigure version of the child" },
            { id: 7, src: "/samples/baby/7.webp", prompt: "Oil painting, cherub style, classical art" },
            { id: 8, src: "/samples/baby/8.webp", prompt: "Futuristic space cadet, cute spacesuit" },
            { id: 9, src: "/samples/baby/9.webp", prompt: "Pencil sketch, cute doodle style" },
        ]
    }
};

export default function SampleGallery({ onSelectPrompt }: SampleGalleryProps) {
    const [activeTab, setActiveTab] = useState<Category>('woman');
    const activeData = SAMPLE_DATA[activeTab];

    return (
        <section className="mt-20 flex w-full max-w-6xl flex-col items-center px-4">
            {/* Header */}
            <h2 className="mb-2 text-3xl font-bold tracking-tight text-gray-900">SAMPLE GALLERY</h2>
            <p className="mb-10 text-center text-gray-600">
                프리미엄 AI 모델링이 만든 놀라운 변화<br />
                원하는 스타일을 선택하여 바로 적용해보세요.
            </p>

            {/* Tabs */}
            <div className="mb-8 flex gap-6">
                {(['woman', 'man', 'baby'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={clsx(
                            "group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl transition-all hover:scale-105",
                            activeTab === tab
                                ? "ring-4 ring-black ring-offset-2"
                                : "opacity-70 hover:opacity-100"
                        )}
                    >
                        {/* Background Image */}
                        <img
                            src={SAMPLE_DATA[tab].original}
                            alt={tab}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />

                        {/* Dark Overlay for Text Readability */}
                        <div className={clsx(
                            "absolute inset-0 transition-colors",
                            activeTab === tab ? "bg-black/20" : "bg-black/50 group-hover:bg-black/30"
                        )} />

                        {/* Label */}
                        <span className="relative z-10 text-sm font-bold text-white drop-shadow-md">
                            {tab === 'woman' ? "여성" : tab === 'man' ? "남성" : "아이"}
                        </span>
                    </button>
                ))}
            </div>

            <div className="flex w-full flex-col gap-12 lg:flex-row lg:items-start">
                {/* Original Image (Left Side) */}
                <div className="flex flex-col items-center gap-4 lg:w-1/3">
                    <div className="relative overflow-hidden rounded-2xl shadow-xl transition-all duration-500 hover:shadow-2xl">
                        <div className="absolute top-4 left-4 z-10 rounded-md bg-black/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                            원본 사진
                        </div>
                        {/* Using Unsplash source URLs directly for valid images */}
                        <img
                            src={activeData.original}
                            alt="Original"
                            className="h-[400px] w-full object-cover sm:h-[500px] lg:h-[600px]"
                        />
                    </div>
                </div>

                {/* AI Generated Grid (Right Side) */}
                <div className="flex-1">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">AI 생성 이미지</h3>
                        <span className="text-sm text-gray-500">클릭하여 프롬프트 사용</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {activeData.examples.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => onSelectPrompt(item.prompt)}
                                className="group relative cursor-pointer overflow-hidden rounded-xl bg-gray-100 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                            >
                                <div className="absolute top-2 w-full text-center opacity-0 transition-opacity group-hover:opacity-100 z-10">
                                    <span className="rounded-full bg-black/70 px-2 py-1 text-[10px] text-white backdrop-blur-md">사용하기</span>
                                </div>
                                <img
                                    src={item.src}
                                    alt={item.prompt}
                                    className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                {/* Overlay on hover */}
                                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
