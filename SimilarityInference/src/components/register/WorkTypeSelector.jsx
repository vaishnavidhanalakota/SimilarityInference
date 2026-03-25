import React from "react";
import { Image, Video, Music, FileText, Palette, Fingerprint, Zap, File } from "lucide-react";

const workTypes = [
  { value: "image", label: "Image", icon: Image },
  { value: "photograph", label: "Photograph", icon: Image },
  { value: "video", label: "Video", icon: Video },
  { value: "music", label: "Music", icon: Music },
  { value: "song", label: "Song", icon: Music },
  { value: "logo", label: "Logo", icon: Palette },
  { value: "trademark", label: "Trademark", icon: Fingerprint },
  { value: "text", label: "Text/Article", icon: FileText },
  { value: "ai_generated", label: "AI Generated", icon: Zap },
  { value: "other", label: "Other", icon: File },
];

export default function WorkTypeSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {workTypes.map((type) => {
        const isSelected = value === type.value;
        return (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={`
              flex flex-col items-center gap-2 p-4 rounded-xl border transition-all
              ${isSelected 
                ? 'bg-violet-600/20 border-violet-500/50 text-violet-400' 
                : 'bg-gray-800/30 border-gray-800/50 text-gray-400 hover:border-gray-600'}
            `}
          >
            <type.icon className="w-6 h-6" />
            <span className="text-xs font-medium">{type.label}</span>
          </button>
        );
      })}
    </div>
  );
}