import { Navbar } from "@/components/navbar"
import { ChatInterface } from "@/components/chat-interface"

export default function ChatPage() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex flex-col h-[calc(100vh-64px)] relative bg-background">
        <ChatInterface />
      </div>
    </main>
  )
}

