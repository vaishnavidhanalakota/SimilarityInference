const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from "react";

import AuthGate from "@/components/AuthGate";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Shield, FolderOpen, AlertTriangle, CheckCircle2, Upload, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/dashboard/StatCard";
import RecentAlerts from "@/components/dashboard/RecentAlerts";
import RecentWorks from "@/components/dashboard/RecentWorks";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    db.auth.me().then((u) => {
      queryClient.clear();
      setUser(u);
    });
  }, []);

  const { data: works = [] } = useQuery({
    queryKey: ["works", user?.email],
    queryFn: () => db.entities.ProtectedWork.filter({ created_by: user.email }, "-created_date", 50),
    enabled: !!user,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts", user?.email],
    queryFn: () => db.entities.CopyrightAlert.filter({ created_by: user.email }, "-created_date", 50),
    enabled: !!user,
  });

  const registeredCount = works.filter(w => w.status === "registered").length;
  const conflictCount = works.filter(w => w.status === "conflict_found").length;
  const newAlerts = alerts.filter(a => a.status === "new").length;

  return (
    <AuthGate>
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Welcome back{user?.full_name ? `, ${user.full_name}` : ''}
          </h1>
          <p className="text-gray-400 mt-1">Monitor and protect your creative content</p>
        </div>
        <Link to={createPageUrl("RegisterWork")}>
          <Button className="bg-violet-600 hover:bg-violet-700 rounded-full px-6">
            <Upload className="w-4 h-4 mr-2" />
            Register New Work
          </Button>
        </Link>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderOpen} label="Total Works" value={works.length} color="bg-violet-600" delay={0} />
        <StatCard icon={CheckCircle2} label="Registered" value={registeredCount} color="bg-green-600" delay={0.1} />
        <StatCard icon={AlertTriangle} label="Conflicts Found" value={conflictCount} color="bg-orange-500" delay={0.2} />
        <StatCard icon={Shield} label="New Alerts" value={newAlerts} color="bg-red-500" delay={0.3} />
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        <RecentWorks works={works} />
        <RecentAlerts alerts={alerts} />
      </div>

      {/* Empty state prompt */}
      {works.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-12 px-4"
        >
          <div className="w-20 h-20 rounded-2xl bg-violet-600/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-violet-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Start Protecting Your Work</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Upload your first piece of content to begin. We'll scan the web and register it under your name.
          </p>
          <Link to={createPageUrl("RegisterWork")}>
            <Button className="bg-violet-600 hover:bg-violet-700 rounded-full px-8">
              Upload Your First Work <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      )}
    </div>
    </AuthGate>
  );
}