const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import AuthGate from "@/components/AuthGate";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { 
  FolderOpen, Upload, Search, Image, Video, Music, 
  FileText, Palette, Fingerprint, Zap, File, ExternalLink,
  ShieldCheck, AlertTriangle, Loader2, Clock, Copy, CheckCircle2,
  Trash2, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const typeIcons = {
  image: Image, photograph: Image, video: Video, music: Music,
  song: Music, logo: Palette, trademark: Fingerprint,
  text: FileText, ai_generated: Zap, other: File,
};

const statusConfig = {
  scanning: { color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: Loader2, label: "Scanning" },
  registered: { color: "bg-green-500/10 text-green-400 border-green-500/20", icon: ShieldCheck, label: "Protected" },
  conflict_found: { color: "bg-red-500/10 text-red-400 border-red-500/20", icon: AlertTriangle, label: "Conflict" },
  rejected: { color: "bg-gray-500/10 text-gray-400 border-gray-500/20", icon: X, label: "Rejected" },
};

export default function MyWorks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedWork, setSelectedWork] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    db.auth.me().then((u) => {
      queryClient.clear();
      setUser(u);
    });
  }, []);

  const { data: works = [], isLoading, refetch } = useQuery({
    queryKey: ["my-works", user?.email],
    queryFn: () => db.entities.ProtectedWork.filter({ created_by: user.email }, "-created_date", 100),
    enabled: !!user,
  });

  const filteredWorks = works.filter(w => {
    const matchSearch = !searchQuery || 
      w.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.tags?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === "all" || w.work_type === typeFilter;
    const matchStatus = statusFilter === "all" || w.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const copyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (workId) => {
    await db.entities.ProtectedWork.delete(workId);
    setSelectedWork(null);
    refetch();
  };

  return (
    <AuthGate>
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">My Protected Works</h1>
          <p className="text-gray-400 mt-1">{works.length} works registered</p>
        </div>
        <Link to={createPageUrl("RegisterWork")}>
          <Button className="bg-violet-600 hover:bg-violet-700 rounded-full px-6">
            <Upload className="w-4 h-4 mr-2" /> Register New
          </Button>
        </Link>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search works..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-900/50 border-gray-800/50 text-white placeholder:text-gray-500"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-gray-900/50 border border-gray-800/50">
            <TabsTrigger value="all" className="data-[state=active]:bg-violet-600 text-xs">All</TabsTrigger>
            <TabsTrigger value="registered" className="data-[state=active]:bg-green-600 text-xs">Protected</TabsTrigger>
            <TabsTrigger value="conflict_found" className="data-[state=active]:bg-red-600 text-xs">Conflicts</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Works Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
        </div>
      ) : filteredWorks.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {works.length === 0 ? "No works registered yet" : "No results found"}
          </h3>
          <p className="text-gray-500 mb-6">
            {works.length === 0 ? "Upload and register your first work to get started" : "Try adjusting your filters"}
          </p>
          {works.length === 0 && (
            <Link to={createPageUrl("RegisterWork")}>
              <Button className="bg-violet-600 hover:bg-violet-700 rounded-full px-6">
                <Upload className="w-4 h-4 mr-2" /> Register First Work
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredWorks.map((work, i) => {
              const Icon = typeIcons[work.work_type] || File;
              const status = statusConfig[work.status] || statusConfig.scanning;
              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={work.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedWork(work)}
                  className="cursor-pointer"
                >
                  <Card className="bg-gray-900/50 border-gray-800/50 hover:border-violet-500/30 transition-all group overflow-hidden">
                    {/* Thumbnail */}
                    <div className="h-40 bg-gray-800/30 flex items-center justify-center overflow-hidden">
                      {work.thumbnail_url && (work.work_type === "image" || work.work_type === "photograph" || work.work_type === "logo") ? (
                        <img src={work.thumbnail_url} alt={work.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <Icon className="w-12 h-12 text-gray-600" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-medium text-white text-sm truncate flex-1">{work.title}</h3>
                        <Badge className={`${status.color} border text-[10px] shrink-0`}>
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Icon className="w-3 h-3" />
                        <span>{work.work_type?.replace(/_/g, ' ')}</span>
                        <span>·</span>
                        <Clock className="w-3 h-3" />
                        <span>{format(new Date(work.created_date), "MMM d, yyyy")}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Modal */}
      {selectedWork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedWork(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
          >
            <button onClick={() => setSelectedWork(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            {selectedWork.thumbnail_url && (selectedWork.work_type === "image" || selectedWork.work_type === "photograph" || selectedWork.work_type === "logo") && (
              <img src={selectedWork.thumbnail_url} alt={selectedWork.title} className="w-full h-48 object-cover rounded-xl mb-4" />
            )}

            <h2 className="text-xl font-bold text-white mb-1">{selectedWork.title}</h2>
            <p className="text-sm text-gray-400 mb-4">{selectedWork.description}</p>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-500">Type</span>
                <span className="text-white capitalize">{selectedWork.work_type?.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-500">Status</span>
                <Badge className={`${(statusConfig[selectedWork.status] || statusConfig.scanning).color} border`}>
                  {(statusConfig[selectedWork.status] || statusConfig.scanning).label}
                </Badge>
              </div>
              {selectedWork.registration_id && (
                <div className="flex justify-between py-2 border-b border-gray-800 items-center">
                  <span className="text-gray-500">Registration ID</span>
                  <button onClick={() => copyId(selectedWork.registration_id)} className="flex items-center gap-1 text-violet-400 hover:text-violet-300">
                    <span className="font-mono text-xs">{selectedWork.registration_id}</span>
                    {copiedId === selectedWork.registration_id ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}
              {selectedWork.similarity_score > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-500">Similarity Score</span>
                  <span className={selectedWork.similarity_score >= 50 ? "text-red-400" : "text-green-400"}>
                    {selectedWork.similarity_score}%
                  </span>
                </div>
              )}
              {selectedWork.similar_to && (
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-500">Similar To</span>
                  <span className="text-orange-400 text-right max-w-[200px]">{selectedWork.similar_to}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-500">Registered</span>
                <span className="text-white">{format(new Date(selectedWork.created_date), "MMM d, yyyy HH:mm")}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {selectedWork.file_url && (
                <a href={selectedWork.file_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full border-gray-700 text-gray-300">
                    <ExternalLink className="w-4 h-4 mr-2" /> View File
                  </Button>
                </a>
              )}
              <Button 
                variant="outline" 
                className="border-red-800 text-red-400 hover:bg-red-500/10"
                onClick={() => handleDelete(selectedWork.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
    </AuthGate>
  );
}