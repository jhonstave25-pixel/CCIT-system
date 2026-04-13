"use client"

import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ConnectButton } from "@/components/connections/connect-button"
import { ArrowLeft, GraduationCap, Building2, Briefcase, Linkedin, Mail, MapPin, Calendar, MessageCircle } from "lucide-react"
import Link from "next/link"
import type { Profile } from "@prisma/client"

interface PublicProfileClientProps {
  currentUserId: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
    role: string
    profile: Profile | null
  }
  connectionStatus: "NONE" | "PENDING" | "ACCEPTED" | "REJECTED"
  connectionId: string | null
  isReceiver: boolean
}

export function PublicProfileClient({
  currentUserId,
  user,
  connectionStatus,
  connectionId,
  isReceiver,
}: PublicProfileClientProps) {
  const router = useRouter()
  const profile = user.profile

  const initials = (user.name || "User")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const isOwnProfile = currentUserId === user.id

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 text-white pt-16 sm:pt-20 p-6 md:p-10 transition-colors">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/connections">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>

        {/* Main Profile Card */}
        <Card className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white mb-6">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {user.image ? (
                  <Avatar className="w-32 h-32 border-4 border-white/30">
                    <AvatarImage src={user.image} alt={user.name || "User"} />
                    <AvatarFallback className="bg-indigo-500/40 text-white text-4xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-400/40 to-violet-400/40 border-4 border-white/30 flex items-center justify-center text-4xl font-bold">
                    {initials}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-3xl font-bold mb-1">
                    {user.name || "Alumni Member"}
                  </h2>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge className="bg-indigo-500/30 border-indigo-400/30 text-indigo-200">
                      {user.role}
                    </Badge>
                    {connectionStatus === "ACCEPTED" && (
                      <Badge className="bg-emerald-500/20 border-emerald-400/30 text-emerald-300">
                        Connected
                      </Badge>
                    )}
                    {connectionStatus === "PENDING" && (
                      <Badge className="bg-yellow-500/20 border-yellow-400/30 text-yellow-300">
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Education */}
                {(profile?.degree || profile?.batch) && (
                  <div className="flex items-center gap-2 text-indigo-200">
                    <GraduationCap className="w-5 h-5" />
                    <span>
                      {profile.degree || "N/A"} • Batch {profile.batch || "N/A"}
                    </span>
                  </div>
                )}

                {/* Work Info */}
                {(profile?.currentPosition || profile?.currentCompany) && (
                  <div className="flex items-center gap-2 text-white/80">
                    <Briefcase className="w-5 h-5 text-white/60" />
                    <span>
                      {profile.currentPosition || "Professional"}
                      {profile.currentCompany && ` at ${profile.currentCompany}`}
                    </span>
                  </div>
                )}

                {/* Industry */}
                {profile?.industry && (
                  <div className="flex items-center gap-2 text-white/80">
                    <Building2 className="w-5 h-5 text-white/60" />
                    <span>{profile.industry}</span>
                  </div>
                )}

                {/* Location */}
                {(profile?.city || profile?.state || profile?.country) && (
                  <div className="flex items-center gap-2 text-white/80">
                    <MapPin className="w-5 h-5 text-white/60" />
                    <span>
                      {[profile?.city, profile?.state, profile?.country].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 min-w-[200px]">
                {!isOwnProfile && (
                  <>
                    {/* Connection Button */}
                    {connectionStatus !== "ACCEPTED" && (
                      <ConnectButton
                        currentUserId={currentUserId}
                        otherUserId={user.id}
                        initialStatus={connectionStatus === "NONE" ? null : connectionStatus}
                        connectionId={connectionId || undefined}
                        isReceiver={isReceiver}
                        showAcceptDecline={true}
                      />
                    )}

                    {/* Message Button - only for connected users */}
                    {connectionStatus === "ACCEPTED" && (
                      <Link href={`/chat?user=${user.id}`}>
                        <Button
                          className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-90 text-white"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                      </Link>
                    )}

                    {/* LinkedIn */}
                    {profile?.linkedinUrl && (
                      <Link
                        href={profile.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-colors text-sm"
                      >
                        <Linkedin className="w-4 h-4" />
                        LinkedIn Profile
                      </Link>
                    )}
                  </>
                )}

                {isOwnProfile && (
                  <Link href="/profile">
                    <Button
                      variant="outline"
                      className="w-full border-white/20 text-white hover:bg-white/10"
                    >
                      Edit Profile
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About Section */}
        {profile?.bio && (
          <Card className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white mb-6">
            <CardHeader>
              <CardTitle className="text-xl">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80 whitespace-pre-wrap">{profile.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Additional Info */}
        {(profile?.skills || profile?.interests) && (
          <Card className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white">
            <CardHeader>
              <CardTitle className="text-xl">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile?.skills && profile.skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-white/60 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill: string, i: number) => (
                      <Badge
                        key={i}
                        className="bg-indigo-500/20 border-indigo-400/30 text-indigo-200"
                      >
                        {skill.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {profile?.interests && profile.interests.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-white/60 mb-2">Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest: string, i: number) => (
                      <Badge
                        key={i}
                        className="bg-violet-500/20 border-violet-400/30 text-violet-200"
                      >
                        {interest.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
