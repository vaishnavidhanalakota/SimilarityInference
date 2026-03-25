const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from "react";

import { Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthGate({ children }) {
  const [status, setStatus] = useState("loading"); // loading | authenticated | unauthenticated

  useEffect(() => {
    db.auth.isAuthenticated().then((authed) => {
      setStatus(authed ? "authenticated" : "unauthenticated");
    });
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-violet-600/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-violet-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Sign in Required</h2>
          <p className="text-gray-400 mb-8 text-sm leading-relaxed">
            Create a free account or sign in to protect your creative work and monitor copyright infringements.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              className="bg-violet-600 hover:bg-violet-700 rounded-full h-12 text-base"
              onClick={() => db.auth.redirectToLogin(window.location.href)}
            >
              Create Account / Sign In
            </Button>
            <p className="text-xs text-gray-500">
              Forgot your password? Use "Forgot password?" on the sign-in screen to reset it via email.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
}