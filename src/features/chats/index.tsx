import { useState, useRef, useEffect } from 'react'
import {
  Bot,
  Send,
  PlusIcon,
  GlobeIcon,
  MessageSquareIcon,
  Trash2Icon,
  PanelRight,
  Copy,
  Check
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { api } from '@/lib/axios'
import { useServerStore } from '@/stores/server-store'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  provider?: string
}

const AI_PROVIDERS = [
  { value: "gemini", label: "Gemini", description: "Google — cepat & ringan", color: "bg-blue-500" },
  { value: "openai", label: "OpenAI", description: "GPT — serba bisa", color: "bg-emerald-500" },
  { value: "anthropic", label: "Anthropic", description: "Claude — analisis mendalam", color: "bg-orange-500" },
  { value: "openrouter", label: "OpenRouter", description: "Gateway multi-model", color: "bg-indigo-500" },
]

export function Chats() {
  const { activeServerId, servers, fetchServers } = useServerStore()
  const [sessions, setSessions] = useState<any[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [activeMessages, setActiveMessages] = useState<Message[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>('gemini')

  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)

  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Mention State
  const [mentionState, setMentionState] = useState<{ active: boolean, filter: string, index: number, startIndex: number }>({
    active: false,
    filter: '',
    index: 0,
    startIndex: -1
  })

  useEffect(() => {
    fetchServers()
  }, [])

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoadingSessions(true)
      try {
        const res = await api.get('/ai/chat/sessions')
        setSessions(res.data)
        if (res.data.length > 0 && !activeSessionId) {
          setActiveSessionId(res.data[0].id)
        } else if (res.data.length === 0) {
          setActiveSessionId('new')
        }
      } catch (error) {
        console.error('Gagal mengambil sesi chat', error)
      } finally {
        setIsLoadingSessions(false)
      }
    }
    fetchSessions()
  }, [])

  useEffect(() => {
    if (activeSessionId && activeSessionId !== 'new') {
      const fetchMessages = async () => {
        setIsLoadingMessages(true)
        try {
          const res = await api.get(`/ai/chat/sessions/${activeSessionId}`)
          const msgs = res.data.messages.map((m: any) => ({
            id: m.id,
            role: m.role.toLowerCase() as 'user' | 'assistant',
            content: m.content
          }))
          setActiveMessages(msgs)
        } catch (error) {
          console.error('Gagal mengambil riwayat pesan', error)
        } finally {
          setIsLoadingMessages(false)
        }
      }
      fetchMessages()
    } else {
      setActiveMessages([])
    }
  }, [activeSessionId])

  const activeSessionTitle = activeSessionId === 'new'
    ? 'Percakapan Baru'
    : (sessions.find(s => s.id === activeSessionId)?.title || 'Chat Aktif')

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activeMessages, isSending])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isSending) return

    const question = input.trim()
    const newMessage: Message = { id: Date.now().toString(), role: 'user', content: question }

    setActiveMessages(prev => [...prev, newMessage])
    setInput('')
    setMentionState(prev => ({ ...prev, active: false }))
    setIsSending(true)

    try {
      const payload: any = { question, provider: selectedProvider }

      if (activeSessionId && activeSessionId !== 'new') {
        payload.sessionId = activeSessionId
      }

      // Determine serverId from mentions
      let targetServerId = activeServerId
      for (const s of servers) {
        const tag = s.name.replace(/\s+/g, '')
        if (question.includes(`@${tag}`)) {
          targetServerId = s.id
          break
        }
      }

      if (targetServerId) {
        payload.serverId = targetServerId
      }

      const res = await api.post('/ai/chat', payload)

      const replyMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.answer,
        provider: res.data.provider || selectedProvider
      }
      setActiveMessages(prev => [...prev, replyMessage])

      if (activeSessionId === 'new' && res.data.sessionId) {
        setActiveSessionId(res.data.sessionId)
        const sessionsRes = await api.get('/ai/chat/sessions')
        setSessions(sessionsRes.data)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengirim pesan ke AI')
    } finally {
      setIsSending(false)
    }
  }

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return
    try {
      await api.delete(`/ai/chat/sessions/${sessionToDelete}`)
      setSessions(prev => prev.filter(s => s.id !== sessionToDelete))
      if (activeSessionId === sessionToDelete) {
        setActiveSessionId('new')
      }
      toast.success('Sesi chat dihapus')
    } catch (error) {
      toast.error('Gagal menghapus sesi')
    } finally {
      setSessionToDelete(null)
    }
  }

  const createNewThread = () => {
    setActiveSessionId('new')
    setHistoryOpen(false)
  }

  const handleCopyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedMessageId(id)
    setTimeout(() => setCopiedMessageId(null), 1500)
  }

  const filteredServers = servers.filter(s =>
    s.name.toLowerCase().includes(mentionState.filter.toLowerCase()) ||
    s.host.toLowerCase().includes(mentionState.filter.toLowerCase())
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setInput(val)

    const cursor = e.target.selectionStart || 0
    const textBeforeCursor = val.slice(0, cursor)
    const match = textBeforeCursor.match(/@([a-zA-Z0-9\._-]*)$/)

    if (match) {
      setMentionState({
        active: true,
        filter: match[1],
        index: 0,
        startIndex: match.index!
      })
    } else {
      setMentionState(prev => ({ ...prev, active: false }))
    }
  }

  const selectMention = (serverName: string) => {
    if (!mentionState.active) return
    const before = input.slice(0, mentionState.startIndex)
    const after = input.slice(mentionState.startIndex + mentionState.filter.length + 1)
    const tag = serverName.replace(/\s+/g, '')
    const newValue = `${before}@${tag} ${after}`
    setInput(newValue)
    setMentionState(prev => ({ ...prev, active: false }))
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionState.active && filteredServers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionState(prev => ({ ...prev, index: (prev.index + 1) % filteredServers.length }))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionState(prev => ({ ...prev, index: (prev.index - 1 + filteredServers.length) % filteredServers.length }))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        selectMention(filteredServers[mentionState.index].name)
      } else if (e.key === 'Escape') {
        setMentionState(prev => ({ ...prev, active: false }))
      }
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

  // Empty = belum ada pesan & tidak sedang memuat riwayat → composer pindah ke tengah.
  const isEmpty = !isLoadingMessages && activeMessages.length === 0

  // Composer dipakai di 2 posisi: tengah (empty state) & footer (saat ada chat).
  const composerBlock = (
    <div className="w-full max-w-3xl mx-auto">
      <form ref={formRef} onSubmit={handleSend} className="relative flex w-full items-end gap-3 bg-muted/40 p-2 rounded-3xl border focus-within:ring-2 ring-primary/20 transition-all">

        {/* Mention Autocomplete Dropdown */}
        {mentionState.active && (
          <div className="absolute bottom-[calc(100%+8px)] left-14 w-64 bg-background border shadow-xl rounded-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
            <div className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b bg-muted/30">
              Pilih Router
            </div>
            <div className="max-h-48 overflow-y-auto p-1">
              {filteredServers.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">Tidak ditemukan</div>
              ) : (
                filteredServers.map((s, i) => (
                  <div
                    key={s.id}
                    className={`px-3 py-2.5 mb-0.5 text-sm rounded-lg cursor-pointer flex flex-col transition-colors ${i === mentionState.index ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted'}`}
                    onClick={() => selectMention(s.name)}
                    onMouseEnter={() => setMentionState(prev => ({ ...prev, index: i }))}
                  >
                    <span className="font-semibold flex items-center gap-2">
                      <GlobeIcon className="h-3.5 w-3.5 opacity-80" />
                      {s.name}
                    </span>
                    <span className={`font-mono text-[10px] mt-0.5 ${i === mentionState.index ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {s.host}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <Select value={selectedProvider} onValueChange={setSelectedProvider}>
          <SelectTrigger
            aria-label="Pilih AI Provider"
            className="shrink-0 self-center w-[160px] rounded-full data-[size=default]:h-12 px-4 [&_small]:hidden"
          >
            <SelectValue placeholder="Pilih AI" />
          </SelectTrigger>
          <SelectContent side="top">
            {AI_PROVIDERS.map((provider) => (
              <SelectItem key={provider.value} value={provider.value}>
                <span className="flex flex-col items-start gap-px">
                  <span className="text-sm font-medium">
                    {provider.label}
                  </span>
                  <small className="text-xs text-muted-foreground">
                    {provider.description}
                  </small>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          ref={inputRef}
          placeholder="Ketik pesan Anda... (@ untuk pilih router, Enter kirim)"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isSending}
          autoComplete="off"
          rows={1}
          className="flex-1 min-h-[44px] max-h-40 resize-none bg-transparent border-0 focus-visible:ring-0 shadow-none text-base px-0 py-2.5"
        />
        <Button type="submit" size="icon" disabled={isSending || !input.trim()} className="shrink-0 rounded-full h-12 w-12 shadow-md hover:shadow-lg transition-all">
          <Send className="h-5 w-5" />
          <span className="sr-only">Kirim</span>
        </Button>
      </form>
      <div className="text-center mt-3">
        <span className="text-[11px] text-muted-foreground">AI dapat memberikan informasi yang tidak akurat. Selalu verifikasi konfigurasi router Anda.</span>
      </div>
    </div>
  )

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        {/* Riwayat sesi = overlay Sheet (bukan panel permanen) — chat selalu dapat lebar
            penuh di semua breakpoint, satu kode path mobile & desktop. */}
        <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
          <SheetContent side='right' className='w-72 p-0 flex flex-col'>
            <SheetHeader className='p-4 pb-0'>
              <SheetTitle>Riwayat Percakapan</SheetTitle>
            </SheetHeader>
            <div className='flex-1 overflow-y-auto p-4 space-y-2'>
              <button
                onClick={createNewThread}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 group ${activeSessionId === 'new' ? 'bg-primary/10 text-primary' : 'bg-background hover:bg-muted text-foreground border shadow-sm'}`}
              >
                <PlusIcon className='h-4 w-4 shrink-0' />
                <span className='truncate'>Percakapan Baru</span>
              </button>
              {isLoadingSessions ? (
                <p className='text-sm text-muted-foreground p-2'>Memuat sesi...</p>
              ) : (
                sessions.map((t) => {
                  const isActive = t.id === activeSessionId
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveSessionId(t.id)
                        setHistoryOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between group ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <div className='flex items-center gap-3 truncate'>
                        <MessageSquareIcon className='h-4 w-4 shrink-0' />
                        <span className='truncate'>{t.title || 'Tanpa Judul'}</span>
                      </div>
                      <div
                        role="button"
                        className='opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/20 hover:text-destructive rounded-md transition-all shrink-0'
                        onClick={(e) => {
                          e.stopPropagation()
                          setSessionToDelete(t.id)
                        }}
                        title="Hapus Percakapan"
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Card workspace dashboard EgNET — full-height, chat berada DI DALAM card
            (bukan full-screen). Pola sama seperti /servers: outerBoxClass + flex-1. */}
        <div className={`${outerBoxClass} flex-1 flex flex-col min-h-0`}>
          <div className='flex flex-wrap items-start justify-between gap-2'>
            <div>
              <h2 className='text-2xl font-semibold tracking-tight'>Asisten AI</h2>
              <p className='text-sm text-muted-foreground mt-1'>
                Analisis router, troubleshooting, & insight jaringan lewat percakapan.
              </p>
            </div>
          </div>

          <div className={`flex flex-1 min-h-0 flex-col overflow-hidden rounded-xl border ${nestedCardClass}`}>
            <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Bot className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-medium truncate">{activeSessionTitle}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 shrink-0"
                onClick={() => setHistoryOpen(true)}
              >
                <PanelRight className="h-4 w-4" />
                Riwayat
              </Button>
            </div>

            {/* Kolom pesan dibatasi lebar (max-w-3xl), rata tengah — ala ChatGPT/Claude */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6" ref={scrollRef}>
              <div className="w-full h-full max-w-3xl mx-auto">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Memuat percakapan...
                  </div>
                ) : isEmpty ? (
                  /* Empty state — logo + ajakan + composer, semua rata tengah */
                  <div className="flex flex-col items-center justify-center h-full gap-6">
                    <div className="bg-primary/10 text-primary p-5 rounded-full">
                      <Bot className="h-10 w-10" />
                    </div>
                    <div className="text-center text-muted-foreground">
                      <h3 className="text-2xl font-semibold tracking-tight text-foreground mb-2">Tanyakan Apapun!</h3>
                      <p className="max-w-md mx-auto">
                        Ketik <strong className="text-foreground">@</strong> untuk memilih router spesifik. AI dapat membantu memecahkan masalah koneksi, membuat script hotspot, atau menganalisis traffic jaringan Anda secara instan.
                      </p>
                    </div>
                    {composerBlock}
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {activeMessages.map((msg) => (
                      <div key={msg.id} className="group flex flex-col gap-1">
                        <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'assistant' && (
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mr-3 mt-1">
                              <Bot className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div className={`max-w-none rounded-2xl px-5 py-4 text-base leading-relaxed shadow-sm overflow-hidden ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-card border text-card-foreground'
                          }`}>
                            {msg.role === 'assistant' ? (
                              <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                            ) : (
                              <div className="whitespace-pre-wrap">{msg.content}</div>
                            )}
                          </div>
                        </div>
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-1 pl-11 opacity-0 group-hover:opacity-100 transition-opacity">
                            {msg.provider && (
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mr-2 border border-border/50 bg-muted/30 px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                <span className={`h-1.5 w-1.5 rounded-full ${AI_PROVIDERS.find(p => p.value === msg.provider)?.color || 'bg-primary'}`}></span>
                                Dijawab oleh: {msg.provider}
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => handleCopyMessage(msg.id, msg.content)}
                              title="Salin jawaban"
                            >
                              {copiedMessageId === msg.id ? (
                                <Check className="h-3.5 w-3.5 text-success" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                    {isSending && (
                      <div className="flex justify-start">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mr-3 mt-1">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <div className="bg-card border text-card-foreground rounded-2xl px-5 py-4 text-base flex items-center gap-3 shadow-sm">
                          <span className="flex gap-1">
                            <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></span>
                          </span>
                          <span className="text-muted-foreground text-sm font-medium">Sedang memikirkan jawaban...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Composer di bawah saat ada percakapan; saat kosong pindah ke tengah (empty state). */}
            {!isEmpty && (
              <div className="p-4 border-t shrink-0">{composerBlock}</div>
            )}
          </div>
        </div>
      </Main>

      <AlertDialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Percakapan AI?</AlertDialogTitle>
            <AlertDialogDescription>
              Riwayat percakapan dengan AI ini akan dihapus secara permanen dan tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSessionToDelete(null)}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
