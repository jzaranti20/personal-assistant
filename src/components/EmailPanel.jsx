import React, { useState } from 'react';
import { Mail, Check, Reply, ExternalLink, X, Send, Loader2, CheckCircle, CheckCheck } from 'lucide-react';

export function EmailPanel({ 
  emails = [], 
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
  onCreateDraft,
}) {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [draftInstructions, setDraftInstructions] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const handleOpenDraftInstructions = (email) => {
    setSelectedEmail(email);
    setDraftInstructions('');
    setShowInstructionsModal(true);
  };

  const handleCreateDraft = async () => {
    setIsSending(true);
    
    const success = await onCreateDraft(selectedEmail, draftInstructions);
    
    setIsSending(false);
    setShowInstructionsModal(false);
    
    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (emails.length === 0) return;
    setIsMarkingAll(true);
    await onMarkAllAsRead(emails);
    setIsMarkingAll(false);
  };

  const handleOpenInGmail = (email) => {
    const gmailUrl = `https://mail.google.com/mail/u/0/#inbox/${email.threadId}`;
    window.open(gmailUrl, '_blank');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      
      // Format in Chicago timezone
      const options = { timeZone: 'America/Chicago' };
      const chicagoDate = new Date(date.toLocaleString('en-US', options));
      const chicagoNow = new Date(now.toLocaleString('en-US', options));
      
      const isToday = chicagoDate.toDateString() === chicagoNow.toDateString();
      
      if (isToday) {
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          timeZone: 'America/Chicago'
        });
      }
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        timeZone: 'America/Chicago'
      });
    } catch {
      return dateStr;
    }
  };

  const extractSenderName = (from) => {
    if (!from) return 'Unknown';
    const match = from.match(/^([^<]+)/);
    if (match) {
      return match[1].trim();
    }
    return from.split('@')[0];
  };

  return (
    <>
      <div className="h-full flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white/80">Inbox</span>
            <span className="text-xs text-white/40">{emails.length}</span>
          </div>
          {emails.length > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded text-white/60 hover:text-white transition-colors disabled:opacity-50"
            >
              {isMarkingAll ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCheck className="w-3 h-3" />
              )}
              <span>All</span>
            </button>
          )}
        </div>

        {/* Success Toast */}
        {showSuccess && (
          <div className="mx-2 mt-2 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-400">Draft created in Gmail</span>
          </div>
        )}

        {/* Email List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-5 h-5 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin"></div>
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/30 text-sm">
              <Mail className="w-6 h-6 mb-1 opacity-50" />
              <p className="text-xs">No new emails</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className="p-3 hover:bg-white/5 transition-colors"
                >
                  {/* Email Header */}
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-medium text-white/90 truncate flex-1">
                      {extractSenderName(email.from)}
                    </span>
                    <span className="text-xs text-white/40 ml-2">
                      {formatDate(email.date)}
                    </span>
                  </div>
                  
                  {/* Subject */}
                  <p className="text-sm text-white/70 truncate mb-1">
                    {email.subject}
                  </p>
                  
                  {/* Summary as bullet points */}
                  <div className="text-xs text-white/50 mb-2 space-y-0.5">
                    {email.summary.split(/[-•]\s*/).filter(point => point.trim()).map((point, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="text-white/30 mt-0.5">•</span>
                        <span className="line-clamp-1">{point.trim()}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onMarkAsRead(email)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded text-white/60 hover:text-white transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      Reviewed
                    </button>
                    <button
                      onClick={() => handleOpenDraftInstructions(email)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 rounded text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Reply className="w-3 h-3" />
                      Draft Reply
                    </button>
                    <button
                      onClick={() => handleOpenInGmail(email)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded text-white/60 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Draft Instructions Modal */}
      {showInstructionsModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl max-w-lg w-full flex flex-col">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white">Draft Reply</h3>
                <p className="text-xs text-white/40 truncate">
                  Re: {selectedEmail?.subject}
                </p>
              </div>
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Instructions Input */}
            <div className="p-4">
              <label className="block text-xs text-white/60 mb-2">
                What would you like to say?
              </label>
              <textarea
                value={draftInstructions}
                onChange={(e) => setDraftInstructions(e.target.value)}
                placeholder="e.g., Tell him no that is not what I am looking for..."
                className="w-full bg-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-blue-400 resize-none"
                rows={3}
                autoFocus
              />
            </div>
            
            {/* Modal Footer */}
            <div className="px-4 py-3 border-t border-white/10 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowInstructionsModal(false)}
                disabled={isSending}
                className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded text-white/60 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDraft}
                disabled={isSending || !draftInstructions.trim()}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 rounded text-white transition-colors disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    Create Draft
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
