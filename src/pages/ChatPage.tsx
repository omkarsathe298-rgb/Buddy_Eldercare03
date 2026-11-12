import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Bot,
  User as UserIcon,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';
import { useVoice } from '../context/VoiceContext';
import { AudioSpeakButton } from '../components/AudioSpeakButton';
import { api } from '../services/api';
import { Conversation, Message, AppLanguage } from '../types';

export const ChatPage: React.FC = () => {
  const { language, setLanguage, t } = usePreferences();
  const { isListening, startListening, stopListening, isRecognitionSupported } = useVoice();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [modelUsed, setModelUsed] = useState<string>('gemini-3.8-flash');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // When active conversation changes, load messages
  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    }
  }, [activeConvId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadConversations = async () => {
    try {
      const res = await api.getConversations();
      setConversations(res.conversations || []);
      if (res.conversations && res.conversations.length > 0) {
        if (!activeConvId) {
          setActiveConvId(res.conversations[0].id);
        }
      } else {
        handleNewChat();
      }
    } catch (err: any) {
      console.warn('Failed to load conversations:', err);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const res = await api.getConversation(convId);
      setMessages(res.messages || []);
    } catch (err: any) {
      console.warn('Failed to load messages:', err);
    }
  };

  const handleNewChat = async () => {
    try {
      const title = language === 'hi' ? 'नई बातचीत' : language === 'mr' ? 'नवीन संवाद' : 'New Conversation';
      const res = await api.createConversation(title, language);
      setConversations(prev => [res.conversation, ...prev]);
      setActiveConvId(res.conversation.id);
      setMessages([]);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Could not start new chat');
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isLoading) return;

    setInputText('');
    setError(null);
    setIsLoading(true);

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      conversationId: activeConvId || '',
      sender: 'user',
      text: textToSend.trim(),
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await api.sendMessage({
        conversationId: activeConvId || undefined,
        text: textToSend.trim(),
        language
      });

      setModelUsed(res.modelUsed);

      // If active conversation was created by server
      if (!activeConvId || activeConvId !== res.conversationId) {
        setActiveConvId(res.conversationId);
        loadConversations();
      }

      setMessages(prev => [
        ...prev.filter(m => m.id !== tempUserMsg.id),
        res.userMessage,
        res.buddyMessage
      ]);
    } catch (err: any) {
      setError(err?.message || 'Failed to send message. Please try again.');
      // Keep optimistic message or mark error
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = (lastUserMsgText: string) => {
    handleSendMessage(lastUserMsgText);
  };

  const handleCopy = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(convId);
      const remaining = conversations.filter(c => c.id !== convId);
      setConversations(remaining);
      if (activeConvId === convId) {
        if (remaining.length > 0) {
          setActiveConvId(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (err: any) {
      console.warn('Failed to delete conversation:', err);
    }
  };

  const handleClearMessages = async () => {
    if (!activeConvId) return;
    try {
      await api.clearConversation(activeConvId);
      setMessages([]);
    } catch (err: any) {
      console.warn('Failed to clear conversation:', err);
    }
  };

  const handleRenameSave = async (convId: string) => {
    if (!newTitle.trim()) return;
    try {
      await api.updateConversation(convId, { title: newTitle.trim() });
      setConversations(prev =>
        prev.map(c => (c.id === convId ? { ...c, title: newTitle.trim() } : c))
      );
      setEditingTitleId(null);
    } catch (err) {
      console.warn('Failed to rename conversation:', err);
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(transcript => {
        setInputText(prev => (prev ? `${prev} ${transcript}` : transcript));
      });
    }
  };

  // Senior-tailored starter prompt questions
  const SUGGESTED_PROMPTS = [
    {
      en: 'How do I make a WhatsApp video call to my family?',
      hi: 'व्हाट्सएप पर परिवार को वीडियो कॉल कैसे करें?',
      mr: 'मुलांना व्हॉट्सअ‍ॅपवर व्हिडिओ कॉल कसा करावा?'
    },
    {
      en: 'What is an OTP and why should I never share it?',
      hi: 'ओटीपी (OTP) क्या होता है और इसे किसी को क्यों नहीं बताना चाहिए?',
      mr: 'ओटीपी म्हणजे काय आणि तो कोणालाही का सांगू नये?'
    },
    {
      en: 'Someone sent a message saying my electricity will be cut off tonight. Is it real?',
      hi: 'किसी ने मैसेज भेजा है कि आज रात बिजली कट जाएगी। क्या यह सच है?',
      mr: 'आज रात्री वीज बंद होईल असा मेसेज आला आहे, हा खरा आहे का?'
    },
    {
      en: 'Someone asks for my UPI PIN to receive ₹5,000 lottery. What should I do?',
      hi: 'कोई ₹5,000 लॉटरी देने के लिए यूपीआई पिन मांग रहा है। मुझे क्या करना चाहिए?',
      mr: '५,००० रुपये देण्यासाठी समोरची व्यक्ती यूपीआय पिन मागत आहे. मी काय करावे?'
    }
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)] min-h-[600px] pb-6">
      {/* Sidebar: Conversation Management */}
      <div className="w-full lg:w-80 bg-white rounded-2xl border-2 border-stone-200 shadow-sm flex flex-col p-4 shrink-0">
        <button
          onClick={handleNewChat}
          className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>{t('newChat')}</span>
        </button>

        {/* Model active indicator */}
        <div className="mt-3 px-3 py-1.5 bg-stone-100 rounded-lg flex items-center justify-between text-xs text-stone-600 border border-stone-200">
          <span className="flex items-center gap-1.5 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Model:
          </span>
          <span className="font-mono bg-white px-2 py-0.5 rounded text-stone-800 border border-stone-200">
            {modelUsed}
          </span>
        </div>

        {/* Conversation List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-600 px-2">
            Recent Conversations
          </div>

          {conversations.length === 0 ? (
            <div className="text-sm text-stone-600 p-4 text-center">
              No conversations yet. Tap "New Conversation" to start.
            </div>
          ) : (
            conversations.map(conv => {
              const isActive = conv.id === activeConvId;
              const isEditing = editingTitleId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`group p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-2 ${
                    isActive
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-xs'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700 font-medium'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleRenameSave(conv.id)}
                        className="flex-1 bg-white border border-stone-300 rounded px-2 py-1 text-sm text-stone-900"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRenameSave(conv.id)}
                        className="p-1 text-emerald-700 hover:bg-emerald-100 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="truncate flex-1 text-base">
                        {conv.title}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setEditingTitleId(conv.id);
                            setNewTitle(conv.title);
                          }}
                          title="Rename"
                          className="p-1 hover:bg-stone-200 rounded text-stone-500"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => handleDeleteConversation(conv.id, e)}
                          title="Delete"
                          className="p-1 hover:bg-rose-100 rounded text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {activeConvId && messages.length > 0 && (
          <button
            onClick={handleClearMessages}
            className="mt-3 w-full py-2 px-3 text-sm text-stone-600 hover:text-rose-700 hover:bg-rose-50 border border-stone-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t('clearChat')}</span>
          </button>
        )}
      </div>

      {/* Main Chat Panel */}
      <div className="flex-1 bg-white rounded-2xl border-2 border-stone-200 shadow-sm flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-xl text-stone-900 flex items-center gap-2">
                Buddy Elder Companion
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  Grounded with Official RAG
                </span>
              </div>
              <div className="text-xs text-stone-600">
                Presents numbered steps, speaks English, Hindi & Marathi, never shares passwords
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={e => setLanguage(e.target.value as AppLanguage)}
              className="bg-white border border-stone-300 text-stone-800 text-sm font-semibold rounded-lg px-2.5 py-1.5 focus:outline-emerald-600"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="mr">मराठी (Marathi)</option>
            </select>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto text-center py-8 space-y-6">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-inner">
                <Bot className="w-12 h-12" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
                  {language === 'mr'
                    ? 'नमस्कार! आज मी तुम्हाला काय मदत करू?'
                    : language === 'hi'
                    ? 'नमस्ते जी! आज मैं आपकी क्या सहायता कर सकता हूँ?'
                    : 'Hello! How can Buddy help you today?'}
                </h3>
                <p className="text-lg text-stone-600 max-w-lg mx-auto">
                  Tap any common question below or type/speak your own question:
                </p>
              </div>

              {/* Starter Prompt Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {SUGGESTED_PROMPTS.map((promptObj, idx) => {
                  const promptText = promptObj[language] || promptObj.en;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(promptText)}
                      className="p-4 rounded-xl border-2 border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-stone-800 text-base font-semibold transition-all flex items-start gap-3 cursor-pointer shadow-2xs"
                    >
                      <HelpCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{promptText}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            messages.map(msg => {
              const isUser = msg.sender === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                      <Bot className="w-6 h-6" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 sm:p-5 shadow-sm text-lg leading-relaxed ${
                      isUser
                        ? 'bg-emerald-700 text-white font-medium rounded-tr-none'
                        : 'bg-stone-50 border-2 border-stone-200 text-stone-900 rounded-tl-none space-y-3'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Citations Box (RAG Grounding) */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="pt-3 border-t border-stone-200 space-y-1.5">
                        <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-700" />
                          <span>{t('verifiedSources')}:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.citations.map((cite, cIdx) => (
                            <a
                              key={cIdx}
                              href={cite.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 text-xs font-semibold rounded-md border border-stone-200 transition-colors shadow-2xs"
                            >
                              <span>{cite.publisher}: {cite.title}</span>
                              <ExternalLink className="w-3 h-3 text-stone-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Message Actions Bar */}
                    <div
                      className={`flex items-center justify-between text-xs pt-1 ${
                        isUser ? 'text-emerald-200' : 'text-stone-600 border-t border-stone-100'
                      }`}
                    >
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {!isUser && (
                        <div className="flex items-center gap-2">
                          <AudioSpeakButton text={msg.text} size="sm" />

                          <button
                            onClick={() => handleCopy(msg.text, msg.id)}
                            title="Copy message"
                            className="p-1.5 hover:bg-stone-200 rounded text-stone-600 cursor-pointer"
                          >
                            {copiedMsgId === msg.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-10 h-10 rounded-xl bg-stone-700 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                      <UserIcon className="w-6 h-6" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3 justify-start">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-6 h-6" />
              </div>
              <div className="bg-stone-100 border-2 border-stone-200 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2 text-stone-600 font-medium text-base">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-bounce"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]"></span>
                <span className="ml-2">Buddy is thinking patiently...</span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-900 text-base flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <div className="font-bold">Notice from Buddy:</div>
                <div>{error}</div>
                {messages.length > 0 && messages[messages.length - 1].sender === 'user' && (
                  <button
                    onClick={() => handleRetry(messages[messages.length - 1].text)}
                    className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-rose-600 text-white rounded-lg text-sm font-bold hover:bg-rose-700"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Try Asking Again</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with Voice Mic */}
        <div className="p-4 border-t border-stone-200 bg-stone-50">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-3"
          >
            {/* Speech to text Mic Button */}
            {isRecognitionSupported && (
              <button
                type="button"
                onClick={toggleVoiceInput}
                title={isListening ? t('listening') : t('micTip')}
                className={`p-3.5 rounded-2xl font-bold flex items-center justify-center transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-200'
                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                }`}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
            )}

            {/* Large Accessible Text Input */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={isListening ? t('listening') : t('askBuddyPlaceholder')}
                rows={2}
                className="w-full bg-white text-stone-900 border-2 border-stone-300 focus:border-emerald-600 rounded-2xl p-3.5 text-lg placeholder:text-stone-400 focus:outline-none resize-none shadow-xs"
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className={`p-3.5 rounded-2xl font-bold flex items-center justify-center transition-all cursor-pointer ${
                inputText.trim() && !isLoading
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-6 h-6" />
            </button>
          </form>
          <div className="mt-2 text-xs text-stone-600 flex items-center justify-between">
            <span>
              💡 Tip: Press Enter to send, or tap the microphone to speak your question aloud.
            </span>
            <span className="font-semibold text-emerald-700">
              Emergency: Dial 112 | Cyber Fraud: Dial 1930
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
