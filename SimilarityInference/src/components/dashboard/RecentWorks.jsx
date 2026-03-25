import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Image, Video, Music, FileText, Palette, Zap } from "lucide-react";
import { format } from "date-fns";

const typeIcons = {
  image: Image,
  photograph: Image,
  video: Video,
  music: Music,
  song: Music,
  logo: Palette,
  trademark: Palette,
  text: FileText,
  ai_generated: Zap,
  other: FileText,
};

const statusColors = {
  scanning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  registered: "bg-green-500/10 text-green-400 border-green-500/20",
  conflict_found: "bg-red-500/10 text-red-400 border-red-500/20",
  rejected: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export default function RecentWorks({ works }) {
  if (!works || works.length === 0) {
    return (
      <Card className="bg-gray-900/50 border-gray-800/50">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-violet-400" />
            Recent Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No works registered yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800/50">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-violet-400" />
          Recent Works
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {works.slice(0, 5).map((work) => {
          const Icon = typeIcons[work.work_type] || FileText;
          return (
            <div key={work.id} className="p-3 rounded-xl bg-gray-800/30 border border-gray-800/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-600/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{work.title}</p>
                <p className="text-xs text-gray-500">
                  {work.work_type?.replace(/_/g, ' ')} · {format(new Date(work.created_date), "MMM d, yyyy")}
                </p>
              </div>
              <Badge className={`${statusColors[work.status] || statusColors.scanning} border text-xs shrink-0`}>
                {work.status?.replace(/_/g, ' ')}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}