"use client";

import { useState, useRef } from 'react';
import { Upload, Sparkles, ChevronDown, X, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface GeneratorInterfaceProps {
    prompt: string;
    setPrompt: (value: string) => void;
}

import { generateImage } from '@/app/actions';

export default function GeneratorInterface({ prompt, setPrompt }: GeneratorInterfaceProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [modelUsed, setModelUsed] = useState<string | null>(null);
    const [errorLogs, setErrorLogs] = useState<string[]>([]);
    const [analysis, setAnalysis] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        setGeneratedImage(null);
        setAnalysis(null);
        setModelUsed(null);
        setErrorLogs([]);

        try {
            const formData = new FormData();
            formData.append('prompt', prompt);
            if (selectedFile) {
                formData.append('image', selectedFile);
            }

            const result = await generateImage(formData);

            if (result.success) {
                if (result.imageUrl) setGeneratedImage(result.imageUrl);
                if (result.analysis) setAnalysis(result.analysis);
                if (result.modelUsed) setModelUsed(result.modelUsed);
                if (result.errorLogs) setErrorLogs(result.errorLogs);
            } else {
                console.error("Generation failed:", result.error);
                if (result.errorLogs) setErrorLogs(result.errorLogs);
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error("Error calling generation action:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <section className="w-full max-w-4xl px-4 py-8">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl shadow-gray-200/50">

                {/* Main Input Area */}
                <div className="relative mb-6 flex flex-col gap-4 sm:flex-row">
                    <div className="relative flex-grow flex flex-col gap-2">
                        {/* Uploaded Image Preview (Immediately above prompt input) */}
                        {selectedImage && (
                            <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200">
                                <img src={selectedImage} alt="Uploaded" className="h-full w-full object-cover" />
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute top-0 right-0 bg-black/50 p-1 text-white hover:bg-black/70"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        )}

                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="변신하고 싶은 모습을 묘사해주세요 (예: 사이버펑크 스타일의 미래 전사)"
                            className="w-full rounded-xl border border-gray-300 bg-gray-50 py-4 pl-6 pr-14 text-lg outline-none transition-all focus:border-black focus:ring-1 focus:ring-black"
                        />
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-3 right-4 rounded-lg p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                        >
                            <Upload className="h-5 w-5" />
                        </button>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex min-w-[160px] items-center justify-center gap-2 rounded-xl bg-black py-4 px-8 text-lg font-semibold text-white transition-transform hover:scale-105 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Sparkles className="h-5 w-5" />
                        )}
                        {isGenerating ? "생성 중..." : "생성하기"}
                    </button>
                </div>

                {/* Options Bar */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {/* Model Selector */}
                    <div className="relative">
                        <select className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-gray-700 outline-none hover:border-gray-400 focus:border-black">
                            <option>Realism v5.0</option>
                            <option>DreamShaper</option>
                            <option>Anime V6</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>

                    {/* Style Selector */}
                    <div className="relative">
                        <select className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-gray-700 outline-none hover:border-gray-400 focus:border-black">
                            <option>Cinematic</option>
                            <option>Photographic</option>
                            <option>Digital Art</option>
                            <option>Oil Painting</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>

                    {/* Ratio Selector */}
                    <div className="relative">
                        <select className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-gray-700 outline-none hover:border-gray-400 focus:border-black">
                            <option>1:1 Square</option>
                            <option>16:9 Landscape</option>
                            <option>9:16 Portrait</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>

                    {/* Advanced Settings (Placeholder) */}
                    <button className="rounded-lg border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700">
                        + 고급 설정
                    </button>
                </div>

            </div>

            {/* Generated Image Result (Immediately below interface) */}
            {(generatedImage || analysis || (errorLogs && errorLogs.length > 0)) && (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">
                    <h3 className="mb-4 text-lg font-bold text-gray-900">생성된 이미지</h3>

                    {generatedImage ? (
                        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-100 sm:aspect-video">
                            <img
                                src={generatedImage}
                                alt="Generated Result"
                                className="h-full w-full object-cover"
                            />
                        </div>
                    ) : errorLogs && errorLogs.length > 0 ? (
                        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-red-50 sm:aspect-video flex flex-col items-center justify-center border-2 border-red-200 p-6 text-center">
                            <div className="mb-2 rounded-full bg-red-100 p-2 text-red-600">
                                <span className="text-xl">⚠️</span>
                            </div>
                            <h4 className="text-base font-bold text-red-800 mb-2">Generation Failed</h4>

                            {/* Error Summary List */}
                            <div className="w-full max-w-lg bg-white/50 rounded-lg p-3 text-left overflow-y-auto max-h-[140px] text-xs border border-red-100">
                                <ul className="space-y-2">
                                    {errorLogs.map((log, index) => (
                                        <li key={index} className="flex gap-2 text-red-700">
                                            <span className="shrink-0">•</span>
                                            <span className="break-all">{log}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-100 sm:aspect-video flex items-center justify-center border-2 border-dashed border-gray-300">
                            <p className="text-gray-500 font-medium">이미지가 생성되지 않았습니다 (텍스트 분석 모드)</p>
                        </div>
                    )}

                    {/* Analysis Text Display */}
                    {(analysis || generatedImage || (errorLogs && errorLogs.length > 0)) && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
                            {/* Success Info */}
                            <div className="flex items-center gap-2 text-xs font-medium text-green-700">
                                <span className="px-2 py-0.5 rounded-full bg-green-100 border border-green-200">
                                    Used: {analysis?.includes("[Used") ? analysis.match(/\[Used (.*?)\]/)?.[1] : "Gemini AI"}
                                </span>
                            </div>

                            {/* Main Analysis Text */}
                            {analysis && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-1">AI Output</h4>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{analysis}</p>
                                </div>
                            )}


                        </div>
                    )}

                    <div className="mt-4 flex justify-end gap-2">
                        <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
                            다시 생성
                        </button>
                        <button className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
                            다운로드
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
