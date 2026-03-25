const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import AuthGate from "@/components/AuthGate";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Upload, FileUp, Loader2, Shield, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WorkTypeSelector from "@/components/register/WorkTypeSelector";
import ScanResultModal from "@/components/register/ScanResultModal";

export default function RegisterWork() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    work_type: "",
    tags: "",
  });
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    db.auth.me().then(setUser);
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  const handleScan = async () => {
    if (!file || !formData.title || !formData.work_type) return;
    
    setIsScanning(true);
    
    // Upload file first
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    
    // Use AI to analyze if this content already exists
    const scanPrompt = `You are a copyright and content similarity scanner. A user is trying to register the following content:

Title: "${formData.title}"
Description: "${formData.description}"
Type: ${formData.work_type}
Tags: ${formData.tags}

Analyze whether this content (based on the title, description, and the uploaded file) is likely to already exist as copyrighted content. Consider:
1. Is this a well-known brand logo, trademark, or copyrighted image?
2. Does the title match any known copyrighted works (songs, movies, books, brands)?
3. Is this likely original user content or a copy of existing content?

Be realistic - if the title mentions well-known brands like Amazon, Apple, Nike, Google, Disney, etc., or known songs/movies, flag it as existing.
For generic or clearly personal content, mark it as original.`;

    const scanResponse = await db.integrations.Core.InvokeLLM({
      prompt: scanPrompt,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          isOriginal: { type: "boolean", description: "true if the content appears to be original, false if similar/existing content found" },
          similarityScore: { type: "number", description: "Estimated similarity percentage 0-100. 0 means completely original, 100 means exact copy." },
          similarTo: { type: "string", description: "What existing content this is similar to, if any. Empty string if original." },
          explanation: { type: "string", description: "Brief explanation of the scan result" },
        }
      }
    });

    setScanResult({ ...scanResponse, file_url });
    setShowResult(true);
    setIsScanning(false);
  };

  const handleRegister = async () => {
    setIsUploading(true);
    const registrationId = `SC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const workData = {
      title: formData.title,
      description: formData.description,
      work_type: formData.work_type,
      file_url: scanResult.file_url,
      thumbnail_url: scanResult.file_url,
      tags: formData.tags,
      owner_name: user?.full_name || "Unknown",
      registration_id: registrationId,
      similarity_score: scanResult.similarityScore || 0,
      similar_to: scanResult.similarTo || "",
      status: scanResult.isOriginal ? "registered" : "conflict_found",
    };

    await db.entities.ProtectedWork.create(workData);

    // If conflict found, create a copyright alert and notify BOTH parties
    if (!scanResult.isOriginal) {
      const severity = scanResult.similarityScore >= 80 ? "critical" : scanResult.similarityScore >= 50 ? "high" : "medium";
      const detectedTime = new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });

      // Find the original owner's registered work from the database
      const allWorks = await db.entities.ProtectedWork.filter({ status: "registered" }, "-created_date", 100);
      const originalWork = allWorks.find(w =>
        scanResult.similarTo?.toLowerCase().includes(w.title?.toLowerCase()) ||
        w.title?.toLowerCase().includes(scanResult.similarTo?.toLowerCase()?.split(" ")[0])
      );
      const originalOwnerEmail = originalWork?.created_by || null;
      const originalOwnerName = originalWork?.owner_name || "the original creator";

      const sharedAlertFields = {
        alert_type: "similar_content",
        severity,
        infringer_name: user?.full_name || "Unknown",
        infringer_email: user?.email,
        detected_platform: "ShieldContent Upload",
        similarity_score: scanResult.similarityScore || 0,
        details: `Copyright conflict: "${formData.title}" is similar to ${scanResult.similarTo}. ${scanResult.explanation}`,
        status: "new",
        detection_time: new Date().toISOString(),
        original_work_title: originalWork?.title || scanResult.similarTo || "",
      };

      // Alert for the UPLOADER — shown in their Alerts page
      await db.entities.CopyrightAlert.create({
        ...sharedAlertFields,
        work_title: formData.title,
        alert_recipient: "uploader",
      });

      // Alert for the ORIGINAL OWNER — create under their email so their filter picks it up
      if (originalOwnerEmail) {
        // We use a direct create; created_by will be the current user, so we
        // store the owner's email in a dedicated field and filter by it on their page.
        await db.entities.CopyrightAlert.create({
          ...sharedAlertFields,
          work_title: originalWork?.title || scanResult.similarTo,
          alert_recipient: "owner",
          // tag this with the owner's email so their query can find it
          detected_url: `owner:${originalOwnerEmail}`,
        });
      }

      // Email to the UPLOADER (the one trying to use similar content)
      await db.integrations.Core.SendEmail({
        to: user?.email,
        subject: `⚠️ Copyright Alert: "${formData.title}" matches existing content`,
        body: `
          <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#0f0f1a;color:#e5e7eb;padding:32px;border-radius:12px;">
            <h2 style="color:#f87171;">⚠️ Copyright Similarity Detected</h2>
            <p>Hi <strong>${user?.full_name || "there"}</strong>,</p>
            <p>Your uploaded work <strong>"${formData.title}"</strong> was flagged during our AI similarity scan.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <tr><td style="padding:8px;color:#9ca3af;">Similarity Score</td><td style="padding:8px;color:#f87171;font-weight:bold;">${scanResult.similarityScore}%</td></tr>
              <tr><td style="padding:8px;color:#9ca3af;">Matches</td><td style="padding:8px;">${scanResult.similarTo}</td></tr>
              <tr><td style="padding:8px;color:#9ca3af;">Detected At</td><td style="padding:8px;">${detectedTime}</td></tr>
              <tr><td style="padding:8px;color:#9ca3af;">Registration ID</td><td style="padding:8px;font-family:monospace;">${registrationId}</td></tr>
            </table>
            <p style="color:#fbbf24;font-size:13px;"><strong>Details:</strong> ${scanResult.explanation}</p>
            <p style="font-size:13px;color:#9ca3af;">Your work has been registered with a conflict flag. If this is your original creation, please provide proof of ownership. Otherwise, cease use of this content to avoid copyright infringement.</p>
            <p style="margin-top:24px;font-size:12px;color:#6b7280;">— ShieldContent Protection Team</p>
          </div>
        `,
      });

      // Email to the ORIGINAL OWNER (if found in our database)
      if (originalOwnerEmail) {
        await db.integrations.Core.SendEmail({
          to: originalOwnerEmail,
          subject: `🚨 Someone uploaded content similar to your work: "${originalWork?.title || scanResult.similarTo}"`,
          body: `
            <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#0f0f1a;color:#e5e7eb;padding:32px;border-radius:12px;">
              <h2 style="color:#f87171;">🚨 Unauthorized Use Detected</h2>
              <p>Hi <strong>${originalOwnerName}</strong>,</p>
              <p>We detected that someone uploaded content that is similar to your registered work.</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                <tr><td style="padding:8px;color:#9ca3af;">Your Work</td><td style="padding:8px;font-weight:bold;">${originalWork?.title || scanResult.similarTo}</td></tr>
                <tr><td style="padding:8px;color:#9ca3af;">Uploaded By</td><td style="padding:8px;color:#f87171;">${user?.full_name || "Unknown User"}</td></tr>
                <tr><td style="padding:8px;color:#9ca3af;">Their Email</td><td style="padding:8px;">${user?.email}</td></tr>
                <tr><td style="padding:8px;color:#9ca3af;">Similarity Score</td><td style="padding:8px;color:#f87171;font-weight:bold;">${scanResult.similarityScore}%</td></tr>
                <tr><td style="padding:8px;color:#9ca3af;">Detected At</td><td style="padding:8px;">${detectedTime}</td></tr>
              </table>
              <p style="color:#fbbf24;font-size:13px;"><strong>AI Analysis:</strong> ${scanResult.explanation}</p>
              <p style="font-size:13px;color:#9ca3af;">A copyright alert has been automatically generated and the uploader has been notified. You can log in to your ShieldContent account to review and take action.</p>
              <p style="margin-top:24px;font-size:12px;color:#6b7280;">— ShieldContent Protection Team</p>
            </div>
          `,
        });
      }
    } else {
      // Send confirmation email for registered work
      await db.integrations.Core.SendEmail({
        to: user?.email,
        subject: `✅ Work Registered: "${formData.title}"`,
        body: `
          <h2>Content Successfully Protected</h2>
          <p>Your work "<strong>${formData.title}</strong>" has been registered and is now protected.</p>
          <p><strong>Registration ID:</strong> ${registrationId}</p>
          <p><strong>Type:</strong> ${formData.work_type}</p>
          <p><strong>Status:</strong> Registered & Protected</p>
          <br/>
          <p>We will monitor the web for any unauthorized use of your content and notify you immediately.</p>
          <br/>
          <p>— ShieldContent Team</p>
        `,
      });
    }

    setIsUploading(false);
    setShowResult(false);
    navigate(createPageUrl("MyWorks"));
  };

  return (
    <AuthGate>
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Register Your Work</h1>
        <p className="text-gray-400 mt-1">Upload your content to protect it from theft and misuse</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="bg-gray-900/50 border-gray-800/50">
          <CardHeader>
            <CardTitle className="text-white text-lg">Content Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label className="text-gray-300">Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Give your work a name"
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-gray-300">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your work in detail..."
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 min-h-[100px]"
              />
            </div>

            {/* Work Type */}
            <div className="space-y-2">
              <Label className="text-gray-300">Content Type *</Label>
              <WorkTypeSelector
                value={formData.work_type}
                onChange={(val) => setFormData({ ...formData, work_type: val })}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-gray-300">Tags</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g. photography, landscape, nature"
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500">Separate tags with commas</p>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label className="text-gray-300">Upload File *</Label>
              <div 
                className={`
                  relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                  ${file ? 'border-violet-500/50 bg-violet-600/5' : 'border-gray-700 hover:border-gray-600 bg-gray-800/20'}
                `}
                onClick={() => document.getElementById('file-input').click()}
              >
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                />
                {filePreview ? (
                  <div className="space-y-3">
                    <img src={filePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                    <p className="text-sm text-violet-400">{file.name}</p>
                    <p className="text-xs text-gray-500">Click to change file</p>
                  </div>
                ) : file ? (
                  <div className="space-y-2">
                    <FileUp className="w-10 h-10 text-violet-400 mx-auto" />
                    <p className="text-sm text-violet-400">{file.name}</p>
                    <p className="text-xs text-gray-500">Click to change file</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 text-gray-500 mx-auto" />
                    <p className="text-sm text-gray-400">Click to upload your work</p>
                    <p className="text-xs text-gray-500">Images, videos, audio, documents</p>
                  </div>
                )}
              </div>
            </div>

            {/* Info box */}
            <div className="p-4 rounded-xl bg-violet-600/5 border border-violet-500/20 flex gap-3">
              <Info className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
              <div className="text-sm text-gray-400">
                <p className="text-violet-400 font-medium mb-1">How it works</p>
                <p>When you click "Scan & Register", our AI will analyze your content against existing works worldwide. If original, it will be registered under your name. If a match is found, you'll be notified.</p>
              </div>
            </div>

            {/* Submit */}
            <Button
              onClick={handleScan}
              disabled={!formData.title || !formData.work_type || !file || isScanning}
              className="w-full bg-violet-600 hover:bg-violet-700 rounded-xl h-12 text-base disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Scanning for Similar Content...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Scan & Register
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Scan Result Modal */}
      <ScanResultModal
        isOpen={showResult}
        onClose={() => setShowResult(false)}
        result={scanResult}
        onProceed={handleRegister}
      />

      {/* Loading overlay for registration */}
      {isUploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-violet-400 animate-spin mx-auto mb-4" />
            <p className="text-white font-medium">Registering your work...</p>
            <p className="text-gray-400 text-sm mt-1">This won't take long</p>
          </div>
        </div>
      )}
    </div>
    </AuthGate>
  );
}