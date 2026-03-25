const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useMemo } from "react";

import AuthGate from "@/components/AuthGate";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { 
  Bell, AlertTriangle, Shield, Clock, MapPin, Globe, 
  CheckCircle2, Eye, XCircle, Loader2, Search, 
  ExternalLink, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const severityConfig = {
  low: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", dot: "bg-blue-400" },
  medium: { color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", dot: "bg-yellow-400" },
  high: { color: "bg-orange-500/10 text-orange-400 border-orange-500/20", dot: "bg-orange-400" },
  critical: { color: "bg-red-500/10 text-red-400 border-red-500/20", dot: "bg-red-400" },
};

const statusConfig = {
  new: { color: "bg-violet-500/10 text-violet-400 border-violet-500/20", label: "New" },
  reviewed: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", label: "Reviewed" },
  action_taken: { color: "bg-orange-500/10 text-orange-400 border-orange-500/20", label: "Action Taken" },
  resolved: { color: "bg-green-500/10 text-green-400 border-green-500/20", label: "Resolved" },
  dismissed: { color: "bg-gray-500/10 text-gray-400 border-gray-500/20", label: "Dismissed" },
};

export default function Alerts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [user, setUser] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    db.auth.me().then((u) => {
      queryClient.clear();
      setUser(u);
    });
  }, []);

  // Fetch alerts where current user is the uploader (created_by) OR the original owner (detected_url tag)
  const { data: myAlerts = [], isLoading: loadingMine } = useQuery({
    queryKey: ["alerts-mine", user?.email],
    queryFn: () => db.entities.CopyrightAlert.filter({ created_by: user.email }, "-created_date", 100),
    enabled: !!user,
  });

  const { data: ownerAlerts = [], isLoading: loadingOwner } = useQuery({
    queryKey: ["alerts-owner", user?.email],
    queryFn: () => db.entities.CopyrightAlert.filter({ detected_url: `owner:${user.email}` }, "-created_date", 100),
    enabled: !!user,
  });

  // Merge and deduplicate
  const alerts = useMemo(() => {
    const seen = new Set();
    return [...myAlerts, ...ownerAlerts].filter(a => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    }).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [myAlerts, ownerAlerts]);

  const isLoading = loadingMine || loadingOwner;

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.CopyrightAlert.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      setSelectedAlert(null);
    },
  });

  const filteredAlerts = alerts.filter(a => {
    const matchSearch = !searchQuery || 
      a.work_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.infringer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <AuthGate>
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Copyright Alerts</h1>
        <p className="text-gray-400 mt-1">Monitor and respond to content infringements</p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-900/50 border-gray-800/50 text-white placeholder:text-gray-500"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-gray-900/50 border border-gray-800/50">
            <TabsTrigger value="all" className="data-[state=active]:bg-violet-600 text-xs">All</TabsTrigger>
            <TabsTrigger value="new" className="data-[state=active]:bg-violet-600 text-xs">New</TabsTrigger>
            <TabsTrigger value="resolved" className="data-[state=active]:bg-green-600 text-xs">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Alerts List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="text-center py-20">
          <Shield className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {alerts.length === 0 ? "No alerts yet" : "No matching alerts"}
          </h3>
          <p className="text-gray-500">
            {alerts.length === 0 ? "Your content is safe — no infringements detected!" : "Try adjusting your filters"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredAlerts.map((alert, i) => {
              const severity = severityConfig[alert.severity] || severityConfig.medium;
              const status = statusConfig[alert.status] || statusConfig.new;

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedAlert(alert)}
                  className="cursor-pointer"
                >
                  <Card className="bg-gray-900/50 border-gray-800/50 hover:border-violet-500/30 transition-all">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start gap-4">
                        <div className={`w-3 h-3 rounded-full ${severity.dot} mt-2 shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {alert.alert_recipient === "owner" && (
                                <span className="shrink-0 text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                                  YOUR WORK COPIED
                                </span>
                              )}
                              <h3 className="font-medium text-white truncate">{alert.work_title}</h3>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge className={`${severity.color} border text-xs`}>
                                {alert.severity}
                              </Badge>
                              <Badge className={`${status.color} border text-xs`}>
                                {status.label}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">
                            {alert.alert_type?.replace(/_/g, ' ')}
                            {alert.similarity_score ? ` · ${alert.similarity_score}% match` : ''}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            {alert.infringer_name && (
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {alert.infringer_name}
                              </span>
                            )}
                            {alert.infringer_location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {alert.infringer_location}
                              </span>
                            )}
                            {alert.detected_platform && (
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {alert.detected_platform}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(alert.created_date), "MMM d, yyyy HH:mm")}
                            </span>
                          </div>
                        </div>
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
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedAlert(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
          >
            <button onClick={() => setSelectedAlert(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className={`w-4 h-4 rounded-full ${(severityConfig[selectedAlert.severity] || severityConfig.medium).dot}`} />
              <h2 className="text-xl font-bold text-white">{selectedAlert.work_title}</h2>
            </div>

            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-500">Alert Type</span>
                <span className="text-white capitalize">{selectedAlert.alert_type?.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-500">Severity</span>
                <Badge className={`${(severityConfig[selectedAlert.severity] || severityConfig.medium).color} border`}>
                  {selectedAlert.severity}
                </Badge>
              </div>
              {selectedAlert.infringer_name && (
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-500">Infringer</span>
                  <span className="text-red-400">{selectedAlert.infringer_name}</span>
                </div>
              )}
              {selectedAlert.infringer_location && (
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-500">Location</span>
                  <span className="text-white">{selectedAlert.infringer_location}</span>
                </div>
              )}
              {selectedAlert.detected_platform && (
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-500">Platform</span>
                  <span className="text-white">{selectedAlert.detected_platform}</span>
                </div>
              )}
              {selectedAlert.similarity_score && (
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-500">Similarity</span>
                  <span className={selectedAlert.similarity_score >= 70 ? "text-red-400" : "text-yellow-400"}>
                    {selectedAlert.similarity_score}%
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-500">Detected</span>
                <span className="text-white">{format(new Date(selectedAlert.created_date), "MMM d, yyyy HH:mm")}</span>
              </div>
            </div>

            {selectedAlert.details && (
              <div className="p-3 rounded-xl bg-gray-800/30 border border-gray-800/50 mb-6">
                <p className="text-sm text-gray-300">{selectedAlert.details}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="border-green-700 text-green-400 hover:bg-green-500/10"
                onClick={() => updateMutation.mutate({ id: selectedAlert.id, data: { status: "resolved" } })}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Resolve
              </Button>
              <Button
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                onClick={() => updateMutation.mutate({ id: selectedAlert.id, data: { status: "dismissed" } })}
              >
                <XCircle className="w-4 h-4 mr-2" /> Dismiss
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
    </AuthGate>
  );
}