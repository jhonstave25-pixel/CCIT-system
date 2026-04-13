"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { updateProfile } from "@/actions/user.actions"
import { updateProfileImage } from "@/actions/profile-image.actions"
import type { Profile } from "@prisma/client"

interface ProfileClientProps {
  userId: string
  userName: string
  userEmail: string
  userImage: string | null
  profile: Profile | null
}

export function ProfileClient({
  userId,
  userName,
  userEmail,
  userImage: initialUserImage,
  profile,
}: ProfileClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [bio, setBio] = useState(
    profile?.bio || "I am a proud CCIT graduate passionate about technology and innovation."
  )
  const [editing, setEditing] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [currentUserImage, setCurrentUserImage] = useState<string | null>(initialUserImage)

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  function handleSave() {
    startTransition(async () => {
      try {
        const result = await updateProfile(userId, {
          ...profile,
          bio: bio || "",
          graduationYear: profile?.graduationYear || new Date().getFullYear(),
          degree: profile?.degree || "",
          major: profile?.major || "",
          batch: profile?.batch || "",
        } as any)

        if (result.success) {
          setEditing(false)
          toast({
            title: "Profile Updated",
            description: "Your bio has been saved successfully.",
          })
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.error || "Failed to update profile. Please try again.",
          })
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred.",
        })
      }
    })
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "Invalid File",
          description: "Please upload an image file.",
        })
        return
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: `Image exceeds 5MB limit. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        })
        return
      }

      setSelectedImage(file)
      
      // Preview the image immediately
      const reader = new FileReader()
      reader.onloadend = () => {
        setCurrentUserImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleImageUpload() {
    if (!selectedImage) {
      toast({
        variant: "destructive",
        title: "No Image Selected",
        description: "Please select an image file first.",
      })
      return
    }

    setUploadingImage(true)

    try {
      const formData = new FormData()
      formData.append("profileImage", selectedImage)

      const result = await updateProfileImage(formData)

      if (result.success && result.imageUrl) {
        setCurrentUserImage(result.imageUrl)
        setSelectedImage(null)
        toast({
          title: "Profile Picture Updated",
          description: "Your profile picture has been updated successfully!",
        })
        // Refresh the page to show the updated image
        router.refresh()
      } else {
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: result.error || "Failed to update profile picture. Please try again.",
        })
        // Reset to original image on error
        setCurrentUserImage(initialUserImage)
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An unexpected error occurred. Please try again.",
      })
      // Reset to original image on error
      setCurrentUserImage(initialUserImage)
    } finally {
      setUploadingImage(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 pt-16 sm:pt-20 pb-10 px-4 text-white transition-colors">
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="rounded-2xl border-none bg-white/10 dark:bg-indigo-950/30 shadow-xl backdrop-blur-lg text-white border-white/20 dark:border-indigo-800/30">
            <CardHeader className="flex flex-col items-center gap-5 p-8 pb-4 sm:flex-row sm:items-start">
              <Avatar className="h-20 w-20 border-2 border-white">
                {currentUserImage ? (
                  <AvatarImage src={currentUserImage} alt="Profile picture" />
                ) : (
                  <AvatarFallback className="bg-indigo-600 text-white text-xl font-semibold">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="space-y-1 text-center sm:text-left">
                <CardTitle className="text-2xl font-bold">{userName}</CardTitle>
                <p className="text-sm text-indigo-200">{userEmail}</p>
                <p className="text-sm text-indigo-300">
                  Batch {profile?.batch || "N/A"} • {profile?.degree || "N/A"}
                </p>
              </div>
            </CardHeader>

            <Separator className="opacity-40" />

            <CardContent className="space-y-8 p-8 pt-6">
              {/* About Me Section */}
              <section className="space-y-3">
                <h2 className="text-lg font-semibold">About Me</h2>
                {editing ? (
                  <div className="space-y-3">
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      className="resize-none border-none bg-white/20 text-white placeholder:text-white/50"
                      placeholder="Tell us about yourself..."
                      disabled={isPending}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSave}
                        className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90"
                        disabled={isPending}
                      >
                        {isPending ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditing(false)
                          setBio(profile?.bio || "")
                        }}
                        className="border-white/20 text-white hover:bg-white/10"
                        disabled={isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="leading-relaxed text-indigo-100">{bio || "No bio added yet."}</p>
                    <Button
                      onClick={() => setEditing(true)}
                      className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90"
                    >
                      Edit Bio
                    </Button>
                  </div>
                )}
              </section>

              <Separator className="opacity-40" />

              {/* Upload Section */}
              <section className="space-y-3">
                <h2 className="text-lg font-semibold">Upload Profile Picture</h2>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="cursor-pointer border-white/20 bg-white/20 dark:bg-gray-800/50 text-white placeholder:text-white/70 file:mr-4 file:rounded-md file:border-0 file:bg-gradient-to-r file:from-indigo-500 file:to-violet-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:opacity-90 disabled:opacity-50"
                  disabled={uploadingImage}
                />
                <p className="text-xs text-indigo-200">
                  Supported formats: JPG, PNG, GIF. Max size: 5MB
                </p>
                {selectedImage && (
                  <p className="text-xs text-indigo-300">
                    Selected: {selectedImage.name} ({(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                <Button
                  onClick={handleImageUpload}
                  disabled={!selectedImage || uploadingImage}
                  className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90 disabled:opacity-50"
                >
                  {uploadingImage ? "Uploading..." : "Upload Profile Picture"}
                </Button>
              </section>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
