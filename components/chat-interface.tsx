"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Upload, Info, X, ArrowUp, Trash2, ArrowLeft, Clock, Search } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

// Add this import at the top of the file
import { trackAnalytics } from "@/lib/analytics"
import { useAuth } from "@/lib/auth-context"

// First, add these imports at the top of the file (after existing imports)
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Product {
  id: number | string
  name: string
  image: string
  category?: string
  subCategory?: string
  articleType?: string
  baseColor?: string
  gender?: string
  usage?: string
  similarity?: number
  brand?: string
  price?: string
}

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  image?: string
  products?: Product[]
  source?: "openai" | "vlm"
  timestamp: Date
}

export function ChatInterface() {
  // Add the useAuth hook to check if the user is authenticated
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hello! I'm KAATCHI, your fashion assistant. I can help you find fashion items using text descriptions or images. How can I assist you today?",
      role: "assistant",
      source: "openai",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showTip, setShowTip] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<number[]>([])
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0)
  // Then, add this state near the other state declarations
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const scrollToTop = () => {
    messagesContainerRef.current?.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop } = messagesContainerRef.current
      setShowScrollTop(scrollTop > 300)
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Add paste event listener for image upload
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0]
        if (file.type.startsWith("image/")) {
          setSelectedFile(file)
          const reader = new FileReader()
          reader.onloadend = () => {
            setPreviewUrl(reader.result as string)
          }
          reader.readAsDataURL(file)
          e.preventDefault()
        }
      }
    }

    document.addEventListener("paste", handlePaste)

    // Add scroll event listener
    const messagesContainer = messagesContainerRef.current
    if (messagesContainer) {
      messagesContainer.addEventListener("scroll", handleScroll)
    }

    return () => {
      document.removeEventListener("paste", handlePaste)
      if (messagesContainer) {
        messagesContainer.removeEventListener("scroll", handleScroll)
      }
    }
  }, [])

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([])
      return
    }

    const query = searchQuery.toLowerCase()
    const results = messages
      .map((message, index) => ({
        index,
        content: message.content.toLowerCase(),
      }))
      .filter((item) => item.content.includes(query))
      .map((item) => item.index)

    setSearchResults(results)
    setCurrentSearchIndex(results.length > 0 ? 0 : -1)

    // Scroll to first result if there are any
    if (results.length > 0) {
      scrollToSearchResult(results[0])
    }
  }, [searchQuery, messages])

  // Focus search input when search is shown
  useEffect(() => {
    if (showSearch) {
      searchInputRef.current?.focus()
    }
  }, [showSearch])

  const scrollToSearchResult = (index: number) => {
    const messageId = messages[index]?.id
    if (messageId && messageRefs.current[messageId]) {
      messageRefs.current[messageId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }
  }

  const navigateSearchResults = (direction: "next" | "prev") => {
    if (searchResults.length === 0) return

    let newIndex = currentSearchIndex
    if (direction === "next") {
      newIndex = (currentSearchIndex + 1) % searchResults.length
    } else {
      newIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length
    }

    setCurrentSearchIndex(newIndex)
    scrollToSearchResult(searchResults[newIndex])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedFile(file)

    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreviewUrl(null)
    }
  }

  // Modify the handleSendMessage function to check authentication before sending a message
  const handleSendMessage = async () => {
    if ((!input.trim() && !selectedFile) || isLoading) return

    // Check if user is authenticated
    if (!isAuthenticated) {
      setShowAuthDialog(true)
      return
    }

    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      image: previewUrl || undefined,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newUserMessage])
    setInput("")
    setIsLoading(true)
    setSelectedFile(null)
    setPreviewUrl(null)

    try {
      // Track the chat query if the user is authenticated
      if (isAuthenticated) {
        await trackAnalytics("chat_query", input, {
          hasImage: !!previewUrl,
          timestamp: new Date().toISOString(),
        })
      }

      // Call the API with the message and image
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          imageBase64: previewUrl,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const newBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: "assistant",
        products: data.products,
        source: data.source,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, newBotMessage])
    } catch (error) {
      console.error("Error sending message:", error)

      // Fallback message in case of error
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      // Focus the input field after sending
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        navigateSearchResults("prev")
      } else {
        navigateSearchResults("next")
      }
    } else if (e.key === "Escape") {
      setShowSearch(false)
      setSearchQuery("")
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const clearChat = () => {
    if (window.confirm("Are you sure you want to clear the chat history?")) {
      setMessages([
        {
          id: "1",
          content:
            "Hello! I'm KAATCHI, your fashion assistant. I can help you find fashion items using text descriptions or images. How can I assist you today?",
          role: "assistant",
          source: "openai",
          timestamp: new Date(),
        },
      ])
    }
  }

  const goBack = () => {
    router.back()
  }

  const toggleSearch = () => {
    setShowSearch(!showSearch)
    if (!showSearch) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    } else {
      setSearchQuery("")
    }
  }

  // Function to highlight search terms in text
  const highlightSearchTerms = (text: string) => {
    if (!searchQuery.trim()) return text

    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"))
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="bg-yellow-500 text-black px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }

  // Add this at the end of the component, right before the final closing tag
  // Add the authentication dialog
  return (
    <>
      {/* Existing component JSX */}
      <div className="flex flex-col h-full bg-background text-foreground relative">
        {/* Go Back Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
          className="fixed top-[72px] left-4 z-30 text-foreground hover:bg-[#1e293b] h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Go back</span>
        </Button>

        {/* Search Button and Input */}
        <div className="fixed top-[72px] right-4 z-30 flex items-center gap-2">
          {showSearch && (
            <div className="relative flex items-center">
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search messages..."
                className="w-48 h-8 bg-muted border-input text-foreground text-sm rounded-lg pr-16"
              />
              {searchResults.length > 0 && (
                <div className="absolute right-2 text-xs text-gray-400">
                  {currentSearchIndex + 1}/{searchResults.length}
                </div>
              )}
              <div className="absolute right-1 flex">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateSearchResults("prev")}
                  disabled={searchResults.length === 0}
                  className="h-6 w-6 text-gray-400 hover:text-foreground"
                >
                  <span className="sr-only">Previous result</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateSearchResults("next")}
                  disabled={searchResults.length === 0}
                  className="h-6 w-6 text-gray-400 hover:text-foreground"
                >
                  <span className="sr-only">Next result</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </Button>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSearch}
            className="text-foreground hover:bg-[#1e293b] h-8 w-8"
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        </div>

        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto py-4 px-4 md:px-8 pb-20 mt-10">
          {showTip && (
            <div className="mb-4 bg-muted border border-input rounded-lg p-3 mx-auto max-w-4xl">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium mb-1 text-base">Tips for using KAATCHI</h3>
                  <ul className="text-sm text-gray-300 space-y-1 list-disc pl-4">
                    <li>Describe fashion items with specific details (color, style, type)</li>
                    <li>Upload images of fashion items you like (paste with Ctrl+V or upload)</li>
                    <li>Combine text and images for more precise results</li>
                    <li>Ask about fashion trends, styles, or outfit recommendations</li>
                  </ul>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-foreground hover:bg-[#334155] -mt-1 -mr-1 h-7 w-7"
                  onClick={() => setShowTip(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((message, index) => (
              <div
                key={message.id}
                ref={(el) => {
                  messageRefs.current[message.id] = el
                }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} group ${
                  searchResults.includes(index) && searchResults[currentSearchIndex] === index
                    ? "bg-[#1e293b]/30 rounded-3xl px-2"
                    : ""
                }`}
              >
                <div
                  className={`flex ${message.role === "user" ? "flex-row-reverse" : "flex-row"} items-start gap-2 ${
                    message.products && message.products.length > 0 ? "max-w-[95%]" : "max-w-[75%]"
                  }`}
                >
                  <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 mt-1">
                    <Image
                      src={message.role === "assistant" ? "/images/bot.gif" : "/images/user.gif"}
                      alt={message.role === "assistant" ? "Bot" : "User"}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === "assistant" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {message.image && (
                      <div className="mb-2">
                        <div className="relative h-[120px] w-[120px] overflow-hidden rounded-lg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={message.image || "/placeholder.svg"}
                            alt="Uploaded"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    <div className="text-base leading-relaxed whitespace-pre-wrap">
                      {searchQuery.trim() ? highlightSearchTerms(message.content) : message.content}
                    </div>

                    {/* Display products if available */}
                    {message.products && message.products.length > 0 && (
                      <div className="mt-3">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {message.products.map((product) => (
                            <Link href={`/product/${product.id}`} key={product.id} className="block group/product">
                              <div className="relative aspect-square overflow-hidden rounded-lg border border-input transition-all group-hover/product:border-primary">
                                <Image
                                  src={product.image || "/placeholder.svg"}
                                  alt={product.name}
                                  fill
                                  className="object-cover transition-transform group-hover/product:scale-105"
                                  onError={(e) => {
                                    console.error(`Failed to load image: ${product.image}`)
                                    e.currentTarget.src = "/placeholder.svg?height=300&width=300"
                                  }}
                                />
                                {product.brand && (
                                  <div className="absolute top-0 left-0 bg-primary/80 text-primary-foreground text-xs px-2 py-1 rounded-br-md">
                                    {product.brand}
                                  </div>
                                )}
                                {product.similarity !== undefined && (
                                  <div className="absolute bottom-0 right-0 bg-background/80 text-foreground text-xs px-2 py-1 rounded-tl-md font-medium">
                                    {Math.round(Math.abs(product.similarity) * 100)}%
                                  </div>
                                )}
                              </div>
                              <div className="mt-1 px-1">
                                <div className="font-medium text-sm line-clamp-1 group-hover/product:text-primary transition-colors">
                                  {product.name}
                                </div>
                                <div className="text-xs text-gray-400 flex justify-between">
                                  <span className="line-clamp-1">
                                    {product.baseColor} {product.articleType}
                                  </span>
                                  {product.price && (
                                    <span className="text-primary font-medium whitespace-nowrap ml-1">
                                      {product.price}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Message footer with timestamp and source */}
                    <div className="mt-1 flex justify-between items-center">
                      <span
                        className={`text-sm flex items-center gap-1 ${message.role === "user" ? "text-black" : "text-gray-500"}`}
                      >
                        <Clock className={`h-3 w-3 ${message.role === "user" ? "text-black" : ""}`} />
                        {format(message.timestamp, "HH:mm")}
                      </span>
                      {message.source && (
                        <span className="text-sm text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          {message.source === "openai" ? "AI" : "VLM"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2">
                  <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 mt-1">
                    <Image
                      src="/images/bot.gif"
                      alt="Bot"
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="rounded-2xl px-4 py-3 bg-muted">
                    <div
                      className="loadingspinner"
                      style={{ transform: "scale(0.5)", marginTop: "-10px", marginBottom: "-10px" }}
                    >
                      <div id="square1"></div>
                      <div id="square2"></div>
                      <div id="square3"></div>
                      <div id="square4"></div>
                      <div id="square5"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Back to top button */}
        {showScrollTop && (
          <Button
            variant="outline"
            size="icon"
            onClick={scrollToTop}
            className="fixed bottom-20 right-4 z-20 rounded-full bg-primary text-foreground border-none hover:bg-primary/90 h-10 w-10"
          >
            <ArrowUp className="h-5 w-5" />
            <span className="sr-only">Back to top</span>
          </Button>
        )}

        {previewUrl && (
          <div className="fixed bottom-[72px] left-0 right-0 border-t border-input bg-background z-10 px-4 md:px-8 py-2">
            <div className="max-w-4xl mx-auto flex items-center">
              <div className="relative h-[60px] w-[60px] overflow-hidden rounded-lg border border-input">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="h-full w-full object-cover" />
                <button
                  onClick={() => {
                    setSelectedFile(null)
                    setPreviewUrl(null)
                  }}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/80 flex items-center justify-center hover:bg-black"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="ml-3 text-sm text-gray-400">Image ready to send</div>
            </div>
          </div>
        )}

        <div className="border-t border-input p-3 md:p-4 fixed bottom-0 left-0 right-0 bg-background z-10">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <Button
              variant="outline"
              size="icon"
              onClick={clearChat}
              type="button"
              className="border-input text-red-500 hover:bg-[#1e293b] hover:text-red-400 hover:border-red-500 transition-colors h-12 w-12"
              title="Clear chat history"
            >
              <Trash2 className="h-5 w-5" />
              <span className="sr-only">Clear chat</span>
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={triggerFileInput}
              type="button"
              className="border-input text-foreground hover:bg-[#1e293b] hover:text-primary hover:border-primary transition-colors h-12 w-12"
              title="Upload image (or paste with Ctrl+V)"
            >
              <Upload className="h-5 w-5" />
              <span className="sr-only">Upload file</span>
            </Button>
            <Input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
            <Input
              placeholder="Ask about fashion items or upload an image..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="bg-muted border-input text-foreground text-base placeholder:text-gray-400 focus-visible:ring-primary focus-visible:border-primary rounded-lg h-12"
              ref={inputRef}
            />
            <Button
              onClick={handleSendMessage}
              disabled={(!input.trim() && !selectedFile) || isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-lg h-12 w-12"
            >
              <Send className="h-5 w-5" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Authentication Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
            <DialogDescription>
              Please log in or create an account to chat with our fashion assistant. Create an account to get
              personalized recommendations and track your conversation history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Link href="/login" className="w-full sm:w-auto">
              <Button className="w-full bg-primary text-primary-foreground">Log In</Button>
            </Link>
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Don't have an account?</span>
              <Link href="/signup" className="text-sm text-primary hover:underline">
                Sign Up
              </Link>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

