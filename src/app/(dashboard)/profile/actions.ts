"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadFileDirectly } from "@/lib/upload-client"

export async function saveProfileAction(formData: FormData) {
  try {
    const session = await auth()
    if (!session) {
      return { success: false, error: "Unauthorized" }
    }

    const userId = session.user.id

    // Extract form data
    const degree = formData.get("degree")?.toString() || ""
    const major = formData.get("major")?.toString() || ""
    const batch = formData.get("batch")?.toString() || ""
    const graduationYear = parseInt(formData.get("graduationYear")?.toString() || "2025")
    const bio = formData.get("bio")?.toString() || ""

    // Handle profile image upload
    const profileImage = formData.get("profileImage") as File | null
    let imageUrl: string | undefined

    if (profileImage && profileImage.size > 0) {
      try {
        const uploadResult = await uploadFileDirectly(profileImage, "profile")
        imageUrl = uploadResult.url

        // Update user image in database
        await prisma.user.update({
          where: { id: userId },
          data: { image: imageUrl },
        })
      } catch (error: any) {
        console.error("Error uploading profile image:", error)
        // Continue with profile update even if image upload fails
      }
    }

    // Get or create profile
    let profile = await prisma.profile.findUnique({
      where: { userId },
    })

    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          userId,
          degree: degree || "Not specified",
          major: major || "Not specified",
          batch: batch || "Not specified",
          graduationYear,
          bio: bio || null,
        },
      })
    } else {
      profile = await prisma.profile.update({
        where: { userId },
        data: {
          degree: degree || profile.degree,
          major: major || profile.major,
          batch: batch || profile.batch,
          graduationYear: graduationYear || profile.graduationYear,
          bio: bio !== undefined ? bio : profile.bio,
        },
      })
    }

    // Handle certificate uploads
    const certificates = formData.getAll("certificates") as File[]
    const uploadedCertificates = []

    for (const file of certificates) {
      if (file instanceof File && file.size > 0) {
        try {
          // Upload certificate file
          const uploadResult = await uploadFileDirectly(file, "certificates")
          const fileUrl = uploadResult.url

          // Create certificate record
          try {
            const certificate = await prisma.certificate.create({
              data: {
                userId,
                title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
                fileUrl,
                issuedBy: null,
              },
            })
            uploadedCertificates.push(certificate)
          } catch (certError: any) {
            console.error("Error creating certificate record:", certError)
            // Continue even if certificate creation fails
          }
        } catch (error: any) {
          console.error(`Error uploading certificate ${file.name}:`, error)
          // Continue with other certificates
        }
      }
    }

    revalidatePath("/profile")
    revalidatePath("/dashboard")

    return {
      success: true,
      profile,
      imageUrl,
      certificatesUploaded: uploadedCertificates.length,
    }
  } catch (error: any) {
    console.error("Error saving profile:", error)
    return {
      success: false,
      error: error.message || "Failed to save profile",
    }
  }
}

