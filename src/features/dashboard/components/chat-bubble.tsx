import { useState, useRef, useEffect } from 'react'
import { 
  Bot, 
  RotateCwIcon, 
  MessageCircleDashedIcon, 
  Send, 
  PlusIcon, 
  ImageIcon, 
  TelescopeIcon, 
  GlobeIcon, 
  PaperclipIcon, 
  X, 
  MessageSquareIcon,
  Trash2Icon,
  Maximize2Icon
} from 'lucide-react'
import { api } from '@/lib/axios'
import { useServerStore } from '@/stores/server-store'
import { toast } from 'sonner'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Link } from '@tanstack/react-router'
import ReactMarkdown from 'react-markdown'
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type Thread = {
  id: string
  title: string
  messages: Message[]
}

export function ChatBubble() {
  const { activeServerId, servers, fetchServers } = useServerStore()
  const [step, setStep] = useState<'welcome' | 'chat'>('welcome')
  const [sessions, setSessions] = useState<any[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [activeMessages, setActiveMessages] = useState<Message[]>([])
  
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)

  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

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

  // Fetch Session List
  useEffect(() => {
    if (step === 'chat') {
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
    }
  }, [step])

  // Fetch Message History when session changes
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
  }, [activeMessages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isSending) return

    const question = input.trim()
    const newMessage: Message = { id: Date.now().toString(), role: 'user', content: question }
    
    // Update local messages optimistically
    setActiveMessages(prev => [...prev, newMessage])
    setInput('')
    setMentionState(prev => ({ ...prev, active: false }))
    setIsSending(true)

    try {
      const payload: any = { question }
      
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
        content: res.data.answer 
      }
      setActiveMessages(prev => [...prev, replyMessage])

      if (activeSessionId === 'new' && res.data.sessionId) {
        setActiveSessionId(res.data.sessionId)
        // Refresh session list to get the new title
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
  }

  const resetChat = () => {
    setActiveMessages([])
  }

  const filteredServers = servers.filter(s => 
    s.name.toLowerCase().includes(mentionState.filter.toLowerCase()) || 
    s.host.toLowerCase().includes(mentionState.filter.toLowerCase())
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInput(val)
    const cursor = e.target.selectionStart || 0
    const textBeforeCursor = val.slice(0, cursor)
    const match = textBeforeCursor.match(/@([a-zA-Z0-9\._-]*)$/)
    if (match) {
      setMentionState({ active: true, filter: match[1], index: 0, startIndex: match.index! })
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
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
    }
  }

  return (
    <div className='fixed bottom-6 right-6 z-50'>
      <Popover onOpenChange={(open) => { if (!open) setStep('welcome') }}>
        <PopoverTrigger asChild>
          <Button size='icon' className='h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all'>
            <Bot className='h-6 w-6' />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          align='end' 
          sideOffset={16} 
          className={`p-0 overflow-hidden shadow-2xl rounded-xl border-none transition-all duration-300 ${
            step === 'welcome' 
              ? 'w-80 bg-[#2d2d2d] text-white' 
              : 'w-[360px] sm:w-[600px] bg-background text-foreground border'
          }`}
        >
          {step === 'welcome' ? (
            <div className='p-6'>
              <h3 className='text-2xl font-semibold tracking-tight mb-2'>
                Your always-on AI companion.
              </h3>
              <p className='text-sm text-gray-300 mb-6'>
                Get quick answers, smart ideas, and instant support whenever you need it.
              </p>
              
              <div className='flex justify-center mb-6'>
                <img 
                  src='https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=400&auto=format&fit=crop' 
                  alt='AI Robot' 
                  className='w-full h-48 object-cover rounded-lg'
                />
              </div>

              <Button 
                variant='secondary' 
                className='w-fit flex items-center gap-2 bg-white text-black hover:bg-gray-200'
                onClick={() => {
                  setStep('chat')
                }}
              >
                Next <span className='text-lg'>&raquo;</span>
              </Button>
            </div>
          ) : (
            <div className='flex h-[500px] w-full overflow-hidden'>
              {/* Sidebar List di Samping */}
              <div className='hidden sm:flex w-[200px] border-e bg-muted/60 dark:bg-zinc-900/60 p-3 flex-col justify-between shrink-0 backdrop-blur-sm'>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between px-1'>
                    <span className='text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                      Riwayat Chat
                    </span>
                    <Button 
                      variant='ghost' 
                      size='icon' 
                      className='h-6 w-6 rounded-md hover:bg-background/80 text-muted-foreground hover:text-foreground' 
                      onClick={createNewThread} 
                      title='Mulai Percakapan Baru'
                    >
                      <PlusIcon className='h-3.5 w-3.5' />
                    </Button>
                  </div>
                  <div className='space-y-1 max-h-[360px] overflow-y-auto pr-1'>
                    {isLoadingSessions ? (
                      <p className='text-xs text-muted-foreground p-2'>Memuat sesi...</p>
                    ) : (
                      <>
                        {activeSessionId === 'new' && (
                          <button className='w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 group truncate bg-background text-foreground border shadow-sm'>
                            <MessageSquareIcon className='h-3.5 w-3.5 shrink-0 text-primary' />
                            <span className='truncate'>Percakapan Baru</span>
                          </button>
                        )}
                        {sessions.map((t) => {
                          const isActive = t.id === activeSessionId
                          return (
                            <button
                              key={t.id}
                              onClick={() => setActiveSessionId(t.id)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between group truncate ${
                                isActive
                                  ? 'bg-background text-foreground border shadow-sm'
                                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                              }`}
                            >
                              <div className='flex items-center gap-2 truncate'>
                                <MessageSquareIcon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground/60 group-hover:text-foreground'}`} />
                                <span className='truncate'>{t.title || 'Tanpa Judul'}</span>
                              </div>
                              <div 
                                role="button"
                                className='opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-all shrink-0'
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSessionToDelete(t.id)
                                }}
                                title="Hapus Percakapan"
                              >
                                <Trash2Icon className="h-3.5 w-3.5" />
                              </div>
                            </button>
                          )
                        })}
                      </>
                    )}
                  </div>
                </div>
                <div className='rounded-lg bg-primary/5 p-2.5 border border-primary/20 text-[11px] text-muted-foreground leading-relaxed shadow-sm'>
                  <p className='font-semibold text-primary mb-1 flex items-center gap-1'>
                    <span>💡</span> Tips AI
                  </p>
                  Ketik <strong className="text-foreground">@</strong> untuk memilih router spesifik yang ingin dianalisis (contoh: <em className="text-foreground">@RouterCafeA kenapa sering putus?</em>).
                </div>
              </div>

              {/* Main Chat Panel */}
              <Card className="border-0 shadow-none rounded-none flex flex-col flex-1 h-full min-w-0 bg-background">
                <CardHeader className="flex flex-row justify-between items-center border-b px-4 py-3 space-y-0 shrink-0">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary" />
                      <span>{activeSessionTitle}</span>
                    </CardTitle>
                    <CardDescription className="text-xs">Bagaimana saya bisa membantu hari ini?</CardDescription>
                  </div>
                  <div className='flex items-center gap-1'>
                    <HoverCard openDelay={10} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <Button variant="ghost" size="icon" className='h-8 w-8' asChild>
                          <Link to="/chats" onClick={() => setStep('welcome')}>
                            <Maximize2Icon className="h-4 w-4" />
                          </Link>
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent side="top" className="w-auto p-3 flex flex-col gap-1 text-sm bg-background border shadow-lg rounded-xl z-[60]">
                        <div className="font-semibold flex items-center gap-2">
                          <Maximize2Icon className="h-4 w-4 text-primary" />
                          Mode Layar Penuh
                        </div>
                        <div className="text-muted-foreground text-xs w-48">
                          Pindah ke halaman khusus untuk membaca riwayat obrolan atau menganalisis log sistem dengan area yang lebih luas.
                        </div>
                      </HoverCardContent>
                    </HoverCard>

                    <Button variant="ghost" size="icon" className='h-8 w-8' onClick={resetChat} title="Reset percakapan">
                      <RotateCwIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className='h-8 w-8' onClick={() => setStep('welcome')} title="Kembali ke sambutan">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Mengambil riwayat pesan...
                    </div>
                  ) : activeMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-3">
                      <div className="bg-muted p-3 rounded-full">
                        <MessageCircleDashedIcon className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Mulai obrolan baru!</p>
                        <p className="text-xs mt-1">Kirim pesan di bawah untuk memulai sesi tanya jawab.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {activeMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed overflow-hidden ${
                          msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground shadow-sm' 
                            : 'bg-muted text-foreground'
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
                      ))}
                      {isSending && (
                        <div className="flex justify-start">
                          <div className="bg-muted text-foreground max-w-[85%] rounded-2xl px-4 py-2.5 text-sm flex items-center gap-2">
                            <Bot className="h-4 w-4 animate-pulse" />
                            <span className="animate-pulse">Mengetik...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-3 border-t shrink-0 relative">
                  <form onSubmit={handleSend} className="relative flex w-full items-center space-x-2">
                    
                    {/* Mention Autocomplete Dropdown */}
                    {mentionState.active && (
                      <div className="absolute bottom-[calc(100%+8px)] left-10 w-64 bg-background border shadow-xl rounded-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
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
                                className={`px-3 py-2.5 mb-0.5 text-xs rounded-lg cursor-pointer flex flex-col transition-colors ${i === mentionState.index ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted'}`}
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

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" size="icon" variant="outline" className="shrink-0 rounded-full h-9 w-9">
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" side="top" className="w-48">
                        <DropdownMenuItem><PaperclipIcon className="mr-2 h-4 w-4" /> Unggah Foto & File</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem><ImageIcon className="mr-2 h-4 w-4" /> Generate Gambar</DropdownMenuItem>
                        <DropdownMenuItem><TelescopeIcon className="mr-2 h-4 w-4" /> Riset Mendalam</DropdownMenuItem>
                        <DropdownMenuItem><GlobeIcon className="mr-2 h-4 w-4" /> Pencarian Web</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Input 
                      placeholder="Ketik @router atau masalah..." 
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      disabled={isSending}
                      autoComplete="off"
                      className="flex-1 rounded-full bg-muted/50 border-transparent focus-visible:ring-1" 
                    />
                    <Button type="submit" size="icon" disabled={isSending || !input.trim()} className="shrink-0 rounded-full h-9 w-9">
                      <Send className="h-4 w-4" />
                      <span className="sr-only">Kirim</span>
                    </Button>
                  </form>
                </CardFooter>
              </Card>
            </div>
          )}

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
        </PopoverContent>
      </Popover>
    </div>
  )
}
