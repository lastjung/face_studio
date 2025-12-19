"use client";

import { Download, Trash2 } from "lucide-react";
import Image from "next/image";
import { type GalleryImage } from "./ImageModal";

interface GalleryGridProps {
    images: GalleryImage[];
    onImageClick: (image: GalleryImage) => void;
    onDelete?: (imageId: string) => void;
}

export default function GalleryGrid({ images, onImageClick, onDelete }: GalleryGridProps) {
    if (images.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <p>생성된 이미지가 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-10">
            {images.map((image) => (
                <div
                    key={image.id}
                    className="group relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                    onClick={() => onImageClick(image)}
                >
                    {/* Image */}
                    <Image
                        src={image.url}
                        alt={image.prompt}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, 25vw"
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                    {/* Top Right Icons */}
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                            className="p-2 bg-white/90 dark:bg-black/60 rounded-full text-gray-700 dark:text-white hover:text-blue-500 hover:scale-110 transition-all shadow-sm"
                            onClick={(e) => {
                                e.stopPropagation(); // Don't trigger modal
                                // TODO: Implement Download properly later
                                console.log("Download", image.id);
                            }}
                        >
                            <Download size={16} />
                        </button>
                        <button
                            className="p-2 bg-white/90 dark:bg-black/60 rounded-full text-gray-700 dark:text-white hover:text-red-500 hover:scale-110 transition-all shadow-sm"
                            onClick={(e) => {
                                e.stopPropagation(); // Don't trigger modal
                                if (onDelete) onDelete(image.id);
                            }}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
