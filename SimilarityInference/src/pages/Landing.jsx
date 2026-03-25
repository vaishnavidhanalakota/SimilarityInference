const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { 
  Shield, Upload, Search, Bell, ArrowRight, CheckCircle2, 
  Image, Video, Music, FileText, Palette, Fingerprint, 
  Globe, Lock, Zap, Users, Star, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  { icon: Upload, title: "Upload & Register", desc: "Register your photos, videos, music, logos, and more in our secure vault." },
  { icon: Search, title: "AI Similarity Scan", desc: "Our AI scans the web to detect if your content already exists or is being copied." },
  { icon: Bell, title: "Instant Alerts", desc: "Get notified immediately when someone uses your content without permission." },
  { icon: Lock, title: "Copyright Protection", desc: "Automatic copyright notices sent to infringers with your ownership proof." },
  { icon: Globe, title: "Global Monitoring", desc: "We scan across social media, websites, and marketplaces worldwide." },
  { icon: Fingerprint, title: "Digital Fingerprinting", desc: "Every registered work gets a unique digital fingerprint for identification." },
];

const contentTypes = [
  { icon: Image, label: "Photos & Images" },
  { icon: Video, label: "Videos" },
  { icon: Music, label: "Music & Songs" },
  { icon: Palette, label: "Logos & Trademarks" },
  { icon: FileText, label: "Text & Articles" },
  { icon: Zap, label: "AI-Generated Content" },
];

const steps = [
  { step: "01", title: "Create Account", desc: "Sign up and set up your creator profile" },
  { step: "02", title: "Upload Your Work", desc: "Upload content — images, videos, music, logos, text" },
  { step: "03", title: "AI Scans the Web", desc: "Our system checks if similar content already exists" },
  { step: "04", title: "Get Protected", desc: "If original, it's registered. If copied, you and the infringer are notified." },
];

export default function Landing() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    db.auth.isAuthenticated().then(setIsAuthenticated);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <style>{`
        body { background: #030712; }
      `}</style>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-gray-950/60 backdrop-blur-xl border-b border-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              ShieldContent
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link to={createPageUrl("Dashboard")}>
                <Button className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-6">
                  Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  className="text-gray-300 hover:text-white hidden sm:inline-flex"
                  onClick={() => db.auth.redirectToLogin()}
                >
                  Sign In
                </Button>
                <Button 
                  className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-6"
                  onClick={() => db.auth.redirectToLogin()}
                >
                  Get Started <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px]" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-[128px]" />
        </div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-8">
              <Shield className="w-4 h-4" />
              Protect Your Creative Work Worldwide
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
              Your Content.{" "}
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Your Rights.
              </span>
              <br />
              <span className="text-gray-400">Our Protection.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              AI-powered content protection for creators, artists, small businesses, and anyone who 
              needs their work safe from theft and unauthorized use.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-8 h-14 text-base"
                onClick={() => isAuthenticated ? window.location.href = createPageUrl("RegisterWork") : db.auth.redirectToLogin()}
              >
                Protect Your Work Now <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 rounded-full px-8 h-14 text-base"
                onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
              >
                See How It Works
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content Types */}
      <section className="py-16 px-4 border-y border-gray-800/30">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-sm text-gray-500 uppercase tracking-widest mb-8">We Protect All Types of Content</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {contentTypes.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-gray-900/50 border border-gray-800/50 hover:border-violet-500/30 transition-all"
              >
                <item.icon className="w-7 h-7 text-violet-400" />
                <span className="text-sm text-gray-300 text-center">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Everything You Need to{" "}
              <span className="text-violet-400">Stay Protected</span>
            </h2>
            <p className="mt-4 text-gray-400 max-w-xl mx-auto">
              Advanced AI technology combined with global monitoring to keep your creative work safe.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-gray-900/50 border-gray-800/50 p-6 h-full hover:border-violet-500/30 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-violet-600/10 flex items-center justify-center mb-4 group-hover:bg-violet-600/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-violet-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 bg-gray-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              How It <span className="text-violet-400">Works</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="text-5xl font-black text-violet-600/20 mb-4">{step.step}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden lg:block absolute top-8 -right-4 w-6 h-6 text-gray-700" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-b from-violet-600/20 to-indigo-600/10 border border-violet-500/20">
            <Shield className="w-14 h-14 text-violet-400 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Don't Wait Until It's Too Late
            </h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Start protecting your creative work today. Register your content and let our AI guard it 24/7.
            </p>
            <Button 
              size="lg"
              className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-10 h-14 text-base"
              onClick={() => isAuthenticated ? window.location.href = createPageUrl("RegisterWork") : db.auth.redirectToLogin()}
            >
              Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800/30">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-500" />
            <span className="font-semibold">ShieldContent</span>
          </div>
          <p className="text-sm text-gray-500">© 2026 ShieldContent. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}