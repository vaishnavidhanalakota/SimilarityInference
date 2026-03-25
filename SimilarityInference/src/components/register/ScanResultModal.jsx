import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, X, ShieldCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ScanResultModal({ isOpen, onClose, result, onProceed }) {
  if (!isOpen) return null;

  const isOriginal = result?.isOriginal;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full text-center"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>

          {isOriginal ? (
            <>
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Content is Original!</h3>
              <p className="text-gray-400 mb-2 text-sm">
                Our AI scan found no matching content. Your work appears to be unique.
              </p>
              <p className="text-green-400 text-sm font-medium mb-6">
                Similarity Score: {result?.similarityScore || 0}%
              </p>
              <Button 
                onClick={onProceed}
                className="bg-green-600 hover:bg-green-700 rounded-full px-8 w-full"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Register & Protect This Work
              </Button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Similar Content Found!</h3>
              <p className="text-gray-400 mb-2 text-sm">
                Our AI scan detected existing content that matches your upload.
              </p>
              <p className="text-red-400 text-sm font-medium mb-3">
                Similarity Score: {result?.similarityScore || 0}%
              </p>
              {result?.similarTo && (
                <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 mb-6">
                  <p className="text-sm text-gray-300">
                    <span className="text-red-400 font-medium">Matches: </span>
                    {result.similarTo}
                  </p>
                </div>
              )}
              <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 mb-4">
                <p className="text-xs text-yellow-400 font-medium mb-1">⚠️ Copyright Notice Generated</p>
                <p className="text-xs text-gray-400">
                  A copyright alert will be created and you will be notified by email. You may still register your work — 
                  if this is your original creation that resembles existing content, you can proceed and provide proof of ownership.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1 border-gray-700 text-gray-300 rounded-full">
                  Cancel
                </Button>
                <Button 
                  onClick={onProceed}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 rounded-full"
                >
                  Register With Flag
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}