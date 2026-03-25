import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";

const severityColors = {
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function RecentAlerts({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return (
      <Card className="bg-gray-900/50 border-gray-800/50">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-violet-400" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No alerts yet — your content is safe!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800/50">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-violet-400" />
          Recent Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.slice(0, 5).map((alert) => (
          <div key={alert.id} className="p-3 rounded-xl bg-gray-800/30 border border-gray-800/50">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{alert.work_title}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {alert.alert_type?.replace(/_/g, ' ')}
                </p>
                {alert.infringer_name && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {alert.infringer_name} {alert.infringer_location && `· ${alert.infringer_location}`}
                  </p>
                )}
              </div>
              <Badge className={`${severityColors[alert.severity] || severityColors.medium} border text-xs shrink-0`}>
                {alert.severity}
              </Badge>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {format(new Date(alert.created_date), "MMM d, yyyy HH:mm")}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}