"use client"
import { User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import Image from "next/image"

export function ProfileIcon() {
  const { theme } = useTheme()
  const isLightTheme = theme === "light"
  const { user, logout } = useAuth()

  // Define the icon color based on theme
  const iconColor = isLightTheme ? "#7e3b92" : "#2c8e59"

  return (
    <div className="relative">
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full border-2 hover:bg-transparent overflow-hidden"
              style={{ borderColor: iconColor }}
            >
              {user.profilePicture ? (
                <div className="h-full w-full relative">
                  <Image
                    src={user.profilePicture || "/placeholder.svg"}
                    alt={`${user.firstName} ${user.lastName}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <User className="h-5 w-5" style={{ color: iconColor }} />
              )}
              <span className="sr-only">Profile</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary overflow-hidden">
                {user.profilePicture ? (
                  <div className="h-full w-full relative">
                    <Image
                      src={user.profilePicture || "/placeholder.svg"}
                      alt={`${user.firstName} ${user.lastName}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <User className="h-4 w-4 text-primary-foreground" />
                )}
              </div>
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-medium leading-none">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs leading-none text-muted-foreground">{user.username}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <Link href="/profile">
              <DropdownMenuItem>Profile</DropdownMenuItem>
            </Link>
            <Link href="/settings">
              <DropdownMenuItem>Settings</DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" className="text-foreground hover:bg-muted">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Sign Up</Button>
          </Link>
        </div>
      )}
    </div>
  )
}

