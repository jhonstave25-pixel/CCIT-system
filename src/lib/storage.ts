/**
 * Storage utility for file uploads
 * Currently configured for Backblaze B2, but can be adapted for other storage providers
 */

/**
 * Generate a signed URL for a private bucket file
 * Use this when displaying images from private buckets
 */
export async function getSignedUrl(bucketName: string, fileName: string, validDurationSeconds: number = 604800): Promise<string> {
  const keyId = process.env.B2_APPLICATION_KEY_ID
  const applicationKey = process.env.B2_APPLICATION_KEY

  if (!keyId || !applicationKey) {
    throw new Error("Backblaze credentials not configured")
  }

  // Dynamic import for CommonJS module
  const B2Module = await import("backblaze-b2")
  const B2 = B2Module.default || B2Module
  const b2 = new (B2.default || B2)({
    applicationKeyId: keyId,
    applicationKey: applicationKey,
  })

  await b2.authorize()

  const bucketsResponse = await b2.listBuckets()
  const bucket = bucketsResponse.data.buckets.find((b: any) => b.bucketName === bucketName)
  if (!bucket) {
    throw new Error(`Bucket ${bucketName} not found`)
  }

  const signedUrlResponse = await b2.getDownloadAuthorization({
    bucketId: bucket.bucketId,
    fileNamePrefix: fileName,
    validDurationInSeconds: validDurationSeconds,
  })

  const downloadUrl = b2.data.downloadUrl
  return `${downloadUrl}/file/${bucketName}/${fileName}?Authorization=${signedUrlResponse.data.authorizationToken}`
}

/**
 * Upload a file to Backblaze B2 storage
 * 
 * @param file - The file to upload
 * @returns The public URL of the uploaded file (or file reference for private buckets)
 * 
 * @example
 * ```typescript
 * const url = await uploadToBackblaze(file)
 * ```
 */
export async function uploadToBackblaze(file: File): Promise<string> {
  // Check if Backblaze credentials are configured
  const keyId = process.env.B2_APPLICATION_KEY_ID
  const applicationKey = process.env.B2_APPLICATION_KEY
  const bucketName = process.env.B2_BUCKET_NAME
  const publicUrl = process.env.B2_PUBLIC_URL

  // If credentials are not configured, use placeholder
  if (!keyId || !applicationKey || !bucketName) {
    console.warn("⚠️ Backblaze B2 credentials not configured. Using placeholder data URL.")
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString("base64")
    return `data:${file.type || "application/octet-stream"};base64,${base64}`
  }

  try {
    // Dynamic import for CommonJS module
    const B2Module = await import("backblaze-b2")
    const B2 = B2Module.default || B2Module
    const b2 = new (B2.default || B2)({
    applicationKeyId: keyId,
    applicationKey: applicationKey,
  })

    // Authorize with Backblaze
    await b2.authorize()

    // Get bucket ID
    const bucketsResponse = await b2.listBuckets()
    const bucket = bucketsResponse.data.buckets.find((b: any) => b.bucketName === bucketName)
    if (!bucket) {
      throw new Error(`Bucket ${bucketName} not found`)
    }

    // Get upload URL
    const uploadUrlResponse = await b2.getUploadUrl({ bucketId: bucket.bucketId })
    const uploadUrl = uploadUrlResponse.data.uploadUrl
    const uploadAuthToken = uploadUrlResponse.data.authorizationToken

    // Prepare file for upload
    const fileName = `uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Upload file
    const uploadResponse = await b2.uploadFile({
      uploadUrl: uploadUrl,
      uploadAuthToken: uploadAuthToken,
      fileName: fileName,
      data: fileBuffer,
      contentType: file.type || "application/octet-stream",
    })

    // Return public URL or signed URL based on bucket type
    if (publicUrl) {
      // Public bucket: return direct public URL
      return `${publicUrl}/${fileName}`
    } else {
      // Private bucket: generate a signed URL (valid for 1 year)
      // Note: Signed URLs expire, so you may need to regenerate them periodically
      const signedUrlResponse = await b2.getDownloadAuthorization({
        bucketId: bucket.bucketId,
        fileNamePrefix: fileName,
        validDurationInSeconds: 31536000, // 1 year (365 days)
      })

      const downloadUrl = b2.data.downloadUrl
      // Return signed URL that can be used directly
      return `${downloadUrl}/file/${bucketName}/${fileName}?Authorization=${signedUrlResponse.data.authorizationToken}`
    }
  } catch (error: any) {
    console.error("Backblaze upload error:", error)
    // Fallback to data URL if upload fails
    console.warn("⚠️ Falling back to data URL due to upload error")
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString("base64")
    return `data:${file.type || "application/octet-stream"};base64,${base64}`
  }

}

/**
 * Upload multiple files to Backblaze B2 storage
 * 
 * @param files - Array of files to upload
 * @returns Array of public URLs for the uploaded files
 */
export async function uploadMultipleToBackblaze(files: File[]): Promise<string[]> {
  const uploads = await Promise.all(files.map((file) => uploadToBackblaze(file)))
  return uploads
}
