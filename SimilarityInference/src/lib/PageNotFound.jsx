import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-violet-600/10 flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-violet-400" />
        </div>
        <h1 className="text-6xl font-bold text-white mb-2">404</h1>
        <p className="text-gray-400 mb-8">This page doesn't exist</p>
        <Link to={createPageUrl("Landing")}>
          <Button className="bg-violet-600 hover:bg-violet-700 rounded-full px-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}