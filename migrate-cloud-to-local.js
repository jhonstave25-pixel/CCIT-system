// Script to migrate all data from cloud database to local database
// Usage: 
//   1. Set CLOUD_DATABASE_URL in .env or pass as argument
//   2. node migrate-cloud-to-local.js

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

// Get cloud database URL
const cloudUrl = process.env.CLOUD_DATABASE_URL || process.argv[2] || "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19QLS14R09iMlpLbFhYRVV0YkswYXUiLCJhcGlfa2V5IjoiMDFLOUFDRFNHMVZGOThINzI5MVBKUTdWV1QiLCJ0ZW5hbnRfaWQiOiI3MWMyYWNjNDQ5ZjYzYjliMTc1OTAzYjhjM2FiYTM4N2YyMTZjMTVkNjhmYzE3ZWY4ZWUyODI2NmYxZTE2N2E0IiwiaW50ZXJuYWxfc2VjcmV0IjoiZTU5NWY0MDktZDVkMi00OWEzLWI4ZGEtYmZmZWMzZjEzNTA5In0.7imLfojqhcTyHW2Ceuj0TQ34MQIsRb9XWnQyHsPLsOA"

const localUrl = "postgresql://postgres:admin@localhost:5432/ccitconnect"

// Cloud database connection
const cloudPrisma = new PrismaClient({
  datasources: {
    db: {
      url: cloudUrl
    }
  }
})

// Local database connection
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: localUrl
    }
  }
})

async function migrateData() {
  console.log('🚀 Starting data migration from cloud to local database...\n')
  console.log(`📡 Cloud URL: ${cloudUrl.substring(0, 50)}...`)
  console.log(`📡 Local URL: ${localUrl}\n`)

  try {
    // Test connections
    console.log('📡 Testing database connections...')
    await cloudPrisma.$connect()
    console.log('✅ Connected to cloud database')
    
    await localPrisma.$connect()
    console.log('✅ Connected to local database\n')

    // Migration order (respecting foreign key constraints)
    const migrationOrder = [
      'User',
      'Account',
      'Session',
      'VerificationToken',
      'Otp',
      'Profile',
      'AlumniProfile',
      'VerificationRequest',
      'Certificate',
      'Event',
      'EventRegistration',
      'Post',
      'Comment',
      'Job',
      'JobAttachment',
      'JobApplication',
      'Connection',
      'Message',
      'Gallery',
      'Donation',
      'Campaign',
      'Feedback',
      'Conversation',
      'Participant',
      'ChatMessage',
      'Notification',
    ]

    const stats = {}

    for (const modelName of migrationOrder) {
      try {
        const modelNameLower = modelName.charAt(0).toLowerCase() + modelName.slice(1)
        const cloudModel = cloudPrisma[modelNameLower]
        const localModel = localPrisma[modelNameLower]
        
        if (!cloudModel || !localModel) {
          console.log(`⚠️  Model ${modelName} not found, skipping...`)
          continue
        }

        console.log(`📦 Migrating ${modelName}...`)
        const records = await cloudModel.findMany({})
        
        if (records.length === 0) {
          console.log(`   ℹ️  No ${modelName} records to migrate\n`)
          stats[modelName] = 0
          continue
        }

        // Validate foreign key references before inserting
        const validRecords = []
        const invalidRecords = []

        for (const record of records) {
          let isValid = true
          let reason = ''

          // Check foreign key constraints based on model
          if (modelName === 'Profile' && record.userId) {
            const userExists = await localPrisma.user.findUnique({ where: { id: record.userId } })
            if (!userExists) {
              isValid = false
              reason = `User ${record.userId} does not exist`
            }
          } else if (modelName === 'AlumniProfile' && record.userId) {
            const userExists = await localPrisma.user.findUnique({ where: { id: record.userId } })
            if (!userExists) {
              isValid = false
              reason = `User ${record.userId} does not exist`
            }
          } else if (modelName === 'Event' && record.createdById) {
            const userExists = await localPrisma.user.findUnique({ where: { id: record.createdById } })
            if (!userExists) {
              isValid = false
              reason = `User (createdBy) ${record.createdById} does not exist`
            }
          } else if (modelName === 'EventRegistration') {
            const userExists = await localPrisma.user.findUnique({ where: { id: record.userId } })
            const eventExists = await localPrisma.event.findUnique({ where: { id: record.eventId } })
            if (!userExists) {
              isValid = false
              reason = `User ${record.userId} does not exist`
            } else if (!eventExists) {
              isValid = false
              reason = `Event ${record.eventId} does not exist`
            }
          } else if (modelName === 'Post' && record.authorId) {
            const userExists = await localPrisma.user.findUnique({ where: { id: record.authorId } })
            if (!userExists) {
              isValid = false
              reason = `User (author) ${record.authorId} does not exist`
            }
          } else if (modelName === 'Job' && record.postedById) {
            const userExists = await localPrisma.user.findUnique({ where: { id: record.postedById } })
            if (!userExists) {
              isValid = false
              reason = `User (postedBy) ${record.postedById} does not exist`
            }
          } else if (modelName === 'JobApplication') {
            const userExists = await localPrisma.user.findUnique({ where: { id: record.applicantId } })
            const jobExists = await localPrisma.job.findUnique({ where: { id: record.jobId } })
            if (!userExists) {
              isValid = false
              reason = `User (applicant) ${record.applicantId} does not exist`
            } else if (!jobExists) {
              isValid = false
              reason = `Job ${record.jobId} does not exist`
            }
          } else if (modelName === 'Comment') {
            const userExists = await localPrisma.user.findUnique({ where: { id: record.userId } })
            const postExists = await localPrisma.post.findUnique({ where: { id: record.postId } })
            if (!userExists) {
              isValid = false
              reason = `User ${record.userId} does not exist`
            } else if (!postExists) {
              isValid = false
              reason = `Post ${record.postId} does not exist`
            }
          } else if (modelName === 'VerificationRequest' && record.userId) {
            const userExists = await localPrisma.user.findUnique({ where: { id: record.userId } })
            if (!userExists) {
              isValid = false
              reason = `User ${record.userId} does not exist`
            }
          } else if (modelName === 'Participant') {
            const userExists = await localPrisma.user.findUnique({ where: { id: record.userId } })
            const conversationExists = await localPrisma.conversation.findUnique({ where: { id: record.conversationId } })
            if (!userExists) {
              isValid = false
              reason = `User ${record.userId} does not exist`
            } else if (!conversationExists) {
              isValid = false
              reason = `Conversation ${record.conversationId} does not exist`
            }
          } else if (modelName === 'ChatMessage') {
            const userExists = await localPrisma.user.findUnique({ where: { id: record.senderId } })
            const conversationExists = await localPrisma.conversation.findUnique({ where: { id: record.conversationId } })
            if (!userExists) {
              isValid = false
              reason = `User (sender) ${record.senderId} does not exist`
            } else if (!conversationExists) {
              isValid = false
              reason = `Conversation ${record.conversationId} does not exist`
            }
          } else if (modelName === 'Notification' && record.userId) {
            const userExists = await localPrisma.user.findUnique({ where: { id: record.userId } })
            if (!userExists) {
              isValid = false
              reason = `User ${record.userId} does not exist`
            }
          } else if (modelName === 'Gallery' && record.eventId) {
            const eventExists = await localPrisma.event.findUnique({ where: { id: record.eventId } })
            if (!eventExists) {
              isValid = false
              reason = `Event ${record.eventId} does not exist`
            }
          } else if (modelName === 'Donation') {
            const userExists = await localPrisma.user.findUnique({ where: { id: record.donorId } })
            if (!userExists) {
              isValid = false
              reason = `User (donor) ${record.donorId} does not exist`
            }
            if (record.campaignId) {
              const campaignExists = await localPrisma.campaign.findUnique({ where: { id: record.campaignId } })
              if (!campaignExists) {
                isValid = false
                reason = `Campaign ${record.campaignId} does not exist`
              }
            }
          } else if (modelName === 'Account' && record.userId) {
            const userExists = await localPrisma.user.findUnique({ where: { id: record.userId } })
            if (!userExists) {
              isValid = false
              reason = `User ${record.userId} does not exist`
            }
          } else if (modelName === 'Session' && record.userId) {
            const userExists = await localPrisma.user.findUnique({ where: { id: record.userId } })
            if (!userExists) {
              isValid = false
              reason = `User ${record.userId} does not exist`
            }
          } else if (modelName === 'Connection') {
            const requesterExists = await localPrisma.user.findUnique({ where: { id: record.requesterId } })
            const receiverExists = await localPrisma.user.findUnique({ where: { id: record.receiverId } })
            if (!requesterExists) {
              isValid = false
              reason = `User (requester) ${record.requesterId} does not exist`
            } else if (!receiverExists) {
              isValid = false
              reason = `User (receiver) ${record.receiverId} does not exist`
            }
          } else if (modelName === 'Message') {
            const senderExists = await localPrisma.user.findUnique({ where: { id: record.senderId } })
            const receiverExists = await localPrisma.user.findUnique({ where: { id: record.receiverId } })
            if (!senderExists) {
              isValid = false
              reason = `User (sender) ${record.senderId} does not exist`
            } else if (!receiverExists) {
              isValid = false
              reason = `User (receiver) ${record.receiverId} does not exist`
            }
          }

          if (isValid) {
            validRecords.push(record)
          } else {
            invalidRecords.push({ record, reason })
          }
        }

        if (invalidRecords.length > 0) {
          console.log(`   ⚠️  Skipping ${invalidRecords.length} records with invalid foreign keys:`)
          invalidRecords.slice(0, 5).forEach(({ record, reason }) => {
            console.log(`      - ${record.id}: ${reason}`)
          })
          if (invalidRecords.length > 5) {
            console.log(`      ... and ${invalidRecords.length - 5} more`)
          }
        }

        if (validRecords.length === 0) {
          console.log(`   ℹ️  No valid ${modelName} records to migrate\n`)
          stats[modelName] = { valid: 0, invalid: invalidRecords.length }
          continue
        }

        // Insert valid records in batches
        const batchSize = 100
        let inserted = 0

        for (let i = 0; i < validRecords.length; i += batchSize) {
          const batch = validRecords.slice(i, i + batchSize)
          
          // Clean up the data (remove undefined values, handle dates)
          const cleanBatch = batch.map(record => {
            const clean = {}
            for (const [key, value] of Object.entries(record)) {
              if (value !== undefined) {
                // Convert Date objects to ISO strings for Prisma
                clean[key] = value instanceof Date ? value : value
              }
            }
            return clean
          })

          try {
            // Use createMany for better performance, but handle unique constraints
            await localModel.createMany({
              data: cleanBatch,
              skipDuplicates: true, // Skip if record already exists
            })
            inserted += batch.length
          } catch (error) {
            // If createMany fails, try individual upserts
            for (const record of cleanBatch) {
              try {
                // Build where clause based on model
                const whereClause = { id: record.id }
                
                // For models with unique email, use email as fallback
                if (modelName === 'User' && record.email) {
                  try {
                    await localModel.upsert({
                      where: { email: record.email },
                      update: record,
                      create: record,
                    })
                    inserted++
                  } catch (emailErr) {
                    // Try with id if email fails
                    await localModel.upsert({
                      where: whereClause,
                      update: record,
                      create: record,
                    })
                    inserted++
                  }
                } else {
                  await localModel.upsert({
                    where: whereClause,
                    update: record,
                    create: record,
                  })
                  inserted++
                }
              } catch (err) {
                console.log(`   ⚠️  Failed to insert record ${record.id}: ${err.message}`)
              }
            }
          }
        }

        stats[modelName] = { valid: inserted, invalid: invalidRecords.length }
        console.log(`   ✅ Migrated ${inserted} valid ${modelName} records`)
        if (invalidRecords.length > 0) {
          console.log(`   ⚠️  Skipped ${invalidRecords.length} invalid ${modelName} records\n`)
        } else {
          console.log('')
        }
      } catch (error) {
        console.error(`   ❌ Error migrating ${modelName}:`, error.message)
        stats[modelName] = { error: error.message }
      }
    }

    // Print summary
    console.log('\n📊 Migration Summary:')
    console.log('='.repeat(60))
    let totalValid = 0
    let totalInvalid = 0
    for (const [model, count] of Object.entries(stats)) {
      if (typeof count === 'object' && count.valid !== undefined) {
        console.log(`   ${model.padEnd(25)} Valid: ${count.valid.toString().padStart(4)} | Invalid: ${count.invalid.toString().padStart(4)}`)
        totalValid += count.valid
        totalInvalid += count.invalid
      } else if (typeof count === 'number') {
        console.log(`   ${model.padEnd(25)} ${count} records`)
        totalValid += count
      } else {
        console.log(`   ${model.padEnd(25)} ERROR - ${count.error}`)
      }
    }
    console.log('='.repeat(60))
    console.log(`   Total: ${totalValid} valid records migrated, ${totalInvalid} invalid records skipped`)
    console.log('\n✅ Migration completed!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await cloudPrisma.$disconnect()
    await localPrisma.$disconnect()
    console.log('\n🔌 Disconnected from databases')
  }
}

// Run migration
migrateData()
  .then(() => {
    console.log('\n🎉 All done! You can now use your local database.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error)
    process.exit(1)
  })

