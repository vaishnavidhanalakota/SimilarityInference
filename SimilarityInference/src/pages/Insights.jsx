const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import AuthGate from "@/components/AuthGate";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, subDays, startOfDay, parseISO } from "date-fns";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  TrendingUp, Shield, AlertTriangle, CheckCircle2,
  FileWarning, Globe, Gavel
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ["#7c3aed", "#10b981", "#f97316", "#ef4444", "#3b82f6", "#ec4899"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function Insights() {
  const [user, setUser] = useState(null);

  useEffect(() => { db.auth.me().then(setUser); }, []);

  const { data: works = [] } = useQuery({
    queryKey: ["works-insights", user?.email],
    queryFn: () => db.entities.ProtectedWork.filter({ created_by: user.email }, "-created_date", 200),
    enabled: !!user,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts-insights", user?.email],
    queryFn: () => db.entities.CopyrightAlert.filter({ created_by: user.email }, "-created_date", 200),
    enabled: !!user,
  });

  // --- Trend data: last 14 days infringements ---
  const infringementTrend = Array.from({ length: 14 }, (_, i) => {
    const day = subDays(new Date(), 13 - i);
    const label = format(day, "MMM d");
    const dayStart = startOfDay(day).getTime();
    const dayEnd = dayStart + 86400000;
    const count = alerts.filter(a => {
      const t = a.detection_time ? new Date(a.detection_time).getTime() : new Date(a.created_date).getTime();
      return t >= dayStart && t < dayEnd;
    }).length;
    return { date: label, infringements: count };
  });

  // --- Registrations over last 14 days ---
  const registrationTrend = Array.from({ length: 14 }, (_, i) => {
    const day = subDays(new Date(), 13 - i);
    const label = format(day, "MMM d");
    const dayStart = startOfDay(day).getTime();
    const dayEnd = dayStart + 86400000;
    const count = works.filter(w => {
      const t = new Date(w.created_date).getTime();
      return t >= dayStart && t < dayEnd;
    }).length;
    return { date: label, registered: count };
  });

  // --- Alert severity breakdown ---
  const severityData = ["low", "medium", "high", "critical"].map(s => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: alerts.filter(a => a.severity === s).length,
  })).filter(d => d.value > 0);

  // --- Takedown status breakdown ---
  const statusData = [
    { name: "New", value: alerts.filter(a => a.status === "new").length },
    { name: "Reviewed", value: alerts.filter(a => a.status === "reviewed").length },
    { name: "Action Taken", value: alerts.filter(a => a.status === "action_taken").length },
    { name: "Resolved", value: alerts.filter(a => a.status === "resolved").length },
    { name: "Dismissed", value: alerts.filter(a => a.status === "dismissed").length },
  ].filter(d => d.value > 0);

  // --- Platform breakdown ---
  const platformCounts = {};
  alerts.forEach(a => {
    const p = a.detected_platform || "Unknown";
    platformCounts[p] = (platformCounts[p] || 0) + 1;
  });
  const platformData = Object.entries(platformCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // --- Work type breakdown ---
  const typeCounts = {};
  works.forEach(w => {
    const t = w.work_type || "other";
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const workTypeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

  // --- Summary stats ---
  const resolvedAlerts = alerts.filter(a => a.status === "resolved" || a.status === "action_taken").length;
  const takedownRate = alerts.length > 0 ? Math.round((resolvedAlerts / alerts.length) * 100) : 0;
  const avgSimilarity = alerts.length > 0
    ? Math.round(alerts.reduce((sum, a) => sum + (a.similarity_score || 0), 0) / alerts.length)
    : 0;

  const summaryCards = [
    { icon: Shield, label: "Total Protected Works", value: works.length, color: "text-violet-400", bg: "bg-violet-600/10" },
    { icon: AlertTriangle, label: "Total Infringements", value: alerts.length, color: "text-orange-400", bg: "bg-orange-500/10" },
    { icon: Gavel, label: "Takedown Success Rate", value: `${takedownRate}%`, color: "text-green-400", bg: "bg-green-500/10" },
    { icon: TrendingUp, label: "Avg Similarity Score", value: `${avgSimilarity}%`, color: "text-red-400", bg: "bg-red-500/10" },
  ];

  return (
    <AuthGate>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Insights</h1>
          <p className="text-gray-400 mt-1">Track trends, infringements, and takedown impact</p>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card className="bg-gray-900/50 border-gray-800/50">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bg}`}>
                    <card.icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 leading-tight">{card.label}</p>
                    <p className="text-2xl font-bold text-white mt-0.5">{card.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Infringement Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gray-900/50 border-gray-800/50">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" /> Infringement Detections — Last 14 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={infringementTrend}>
                  <defs>
                    <linearGradient id="infGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="infringements" stroke="#f97316" strokeWidth={2} fill="url(#infGrad)" name="Infringements" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Registration Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="bg-gray-900/50 border-gray-800/50">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-violet-400" /> New Registrations — Last 14 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={registrationTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="registered" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Registered" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bottom row: Severity + Takedown Status + Platform */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Severity Breakdown */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gray-900/50 border-gray-800/50 h-full">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <FileWarning className="w-4 h-4 text-red-400" /> Severity Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {severityData.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">No alerts yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={severityData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {severityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", color: "#9ca3af" }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Takedown Impact */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card className="bg-gray-900/50 border-gray-800/50 h-full">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-green-400" /> Takedown Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statusData.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">No alerts yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", color: "#9ca3af" }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Platform Breakdown */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gray-900/50 border-gray-800/50 h-full">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" /> Top Platforms
                </CardTitle>
              </CardHeader>
              <CardContent>
                {platformData.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">No data yet</p>
                ) : (
                  <div className="space-y-3 mt-1">
                    {platformData.map((p, i) => (
                      <div key={p.name} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-sm text-gray-300 flex-1 truncate">{p.name}</span>
                        <span className="text-sm font-semibold text-white">{p.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Work Type Distribution */}
        {workTypeData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <Card className="bg-gray-900/50 border-gray-800/50">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-violet-400" /> Protected Works by Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={workTypeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#7c3aed" radius={[0, 4, 4, 0]} name="Works" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </AuthGate>
  );
}