"use client"

import React, { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTransition } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Uploader } from "@/components/shared/uploader"

export type FieldConfig = {
  name: string
  label: string
  type: "text" | "textarea" | "select" | "file" | "fileupload" | "checkbox" | "number" | "date"
  placeholder?: string
  options?: { label: string; value: string }[]
  required?: boolean
  min?: number
  max?: number
  accept?: string
  multiple?: boolean
  maxFiles?: number
  maxSizeMB?: number
  note?: string
}

interface ContentFormModalProps {
  title: string
  mode: "create" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  fields: FieldConfig[]
  defaultValues?: Record<string, any>
  onSubmit: (values: Record<string, any>) => Promise<{ success: boolean; error?: string }>
  description?: string
}

export function ContentFormModal({
  title,
  mode,
  open,
  onOpenChange,
  fields,
  defaultValues = {},
  onSubmit,
  description,
}: ContentFormModalProps) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const [fileUploads, setFileUploads] = useState<Record<string, File[]>>({})

  // Build Zod schema dynamically from fields
  const schema = z.object(
    fields.reduce((acc, field) => {
      if (field.type === "checkbox") {
        acc[field.name] = z.boolean().optional()
      } else if (field.type === "number") {
        acc[field.name] = field.required
          ? z.number().min(field.min ?? 0).max(field.max ?? Infinity)
          : z.number().min(field.min ?? 0).max(field.max ?? Infinity).optional()
      } else if (field.type === "date") {
        acc[field.name] = field.required
          ? z.string().min(1, `${field.label} is required`)
          : z.string().optional()
      } else {
        acc[field.name] = field.required
          ? z.string().min(1, `${field.label} is required`)
          : z.string().optional()
      }
      return acc
    }, {} as Record<string, z.ZodTypeAny>)
  )

  // Normalize defaultValues to ensure all fields have defined values
  const normalizedDefaults = React.useMemo(() => {
    const normalized: Record<string, any> = {}
    fields.forEach((field) => {
      if (field.type === "checkbox") {
        normalized[field.name] = defaultValues?.[field.name] ?? false
      } else if (field.type === "number") {
        normalized[field.name] = defaultValues?.[field.name] ?? ""
      } else {
        normalized[field.name] = defaultValues?.[field.name] ?? ""
      }
    })
    return normalized
  }, [fields, defaultValues])

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: normalizedDefaults,
  })

  // Reset form when modal opens/closes or defaultValues change
  useEffect(() => {
    if (open) {
      form.reset(normalizedDefaults)
      setFileUploads({})
    }
  }, [open, normalizedDefaults, form])

  const handleSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        // Merge file uploads into values
        const finalValues = { ...values }
        Object.keys(fileUploads).forEach((key) => {
          if (fileUploads[key].length > 0) {
            // Store file objects in a special property that the handler can process
            finalValues[`_files_${key}`] = fileUploads[key]
          }
        })

        const result = await onSubmit(finalValues)

        if (result.success) {
          toast({
            title: "Success",
            description: mode === "create" && title.toLowerCase().includes("gallery")
              ? "Gallery created successfully! It will now appear on the Alumni Gallery page."
              : `${title} ${mode === "create" ? "created" : "updated"} successfully.`,
          })
          form.reset()
          setFileUploads({})
          onOpenChange(false)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.error || "Something went wrong. Please try again.",
          })
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
        })
      }
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-md bg-gray-900 border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-white/70">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 py-4">
              {fields.map((field) => {
                const selectedCategory = form.watch("category")

                // Only show custom category field when Category is "Other"
                if (field.name === "customCategory" && selectedCategory !== "Other") {
                  return null
                }

                return (
                  <FormField
                    key={field.name}
                    control={form.control}
                    name={field.name}
                    render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-white">
                        {field.label}
                        {field.required && <span className="text-red-400 ml-1">*</span>}
                      </FormLabel>
                      {field.type === "checkbox" ? (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={formField.value || false}
                            onCheckedChange={formField.onChange}
                            disabled={isPending}
                          />
                          <span className="text-sm text-white/70">
                            {field.placeholder || field.label}
                          </span>
                        </div>
                      ) : field.type === "text" ? (
                        <FormControl>
                          {field.name === "salaryRange" ? (
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none">₱</span>
                              <Input
                                placeholder={field.placeholder}
                                {...formField}
                                value={formField.value ?? ""}
                                disabled={isPending}
                                className="h-11 pl-7"
                              />
                            </div>
                          ) : (
                            <Input
                              placeholder={field.placeholder}
                              {...formField}
                              value={formField.value ?? ""}
                              disabled={isPending}
                              className="h-11"
                            />
                          )}
                        </FormControl>
                      ) : field.type === "number" ? (
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={field.placeholder}
                            {...formField}
                            value={formField.value ?? ""}
                            disabled={isPending}
                            className="h-11"
                            onChange={(e) => {
                              const val = e.target.value
                              formField.onChange(val === "" ? "" : Number(val))
                            }}
                            min={field.min}
                            max={field.max}
                          />
                        </FormControl>
                      ) : field.type === "date" ? (
                        <FormControl>
                          <Input
                            type="date"
                            placeholder={field.placeholder}
                            {...formField}
                            value={formField.value ?? ""}
                            disabled={isPending}
                            className="h-11"
                          />
                        </FormControl>
                      ) : field.type === "textarea" ? (
                        <FormControl>
                          <Textarea
                            placeholder={field.placeholder}
                            {...formField}
                            value={formField.value ?? ""}
                            disabled={isPending}
                            rows={4}
                            className="resize-none"
                          />
                        </FormControl>
                      ) : field.type === "select" ? (
                        <FormControl>
                          <Select
                            onValueChange={formField.onChange}
                            value={formField.value || ""}
                            disabled={isPending}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder={field.placeholder || "Select an option"} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      ) : field.type === "file" ? (
                        <FormControl>
                          <Input
                            type="file"
                            placeholder={field.placeholder}
                            disabled={isPending}
                            className="h-11"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                formField.onChange(file.name)
                              }
                            }}
                            accept={field.accept || "image/*"}
                          />
                        </FormControl>
                      ) : field.type === "fileupload" ? (
                        <div className="space-y-3">
                          <Uploader
                            accept={field.accept || "image/*"}
                            multiple={field.multiple ?? true}
                            maxFiles={field.maxFiles ?? 10}
                            maxSizeMB={field.maxSizeMB ?? 20}
                            note={field.note}
                            onChange={(files) => {
                              setFileUploads((prev) => ({
                                ...prev,
                                [field.name]: files,
                              }))
                            }}
                            cta={field.placeholder || "Select Files"}
                          />
                          {/* Cover selector for gallery media */}
                          {field.name === "media" && fileUploads[field.name] && fileUploads[field.name].length > 0 && (
                            <div className="space-y-2">
                              <FormLabel className="text-sm font-medium text-white">
                                Choose Cover (optional)
                              </FormLabel>
                              <div className="flex flex-wrap gap-3">
                                {fileUploads[field.name].map((f, i) => {
                                  const url = URL.createObjectURL(f)
                                  const isImage = f.type.startsWith("image/")
                                  const selected = form.watch("_coverIndex") === i.toString()
                                  return (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => {
                                        form.setValue("_coverIndex", i.toString())
                                      }}
                                      className={`rounded-lg overflow-hidden border transition-all ${
                                        selected
                                          ? "border-indigo-400 ring-2 ring-indigo-300"
                                          : "border-white/20 hover:border-white/40"
                                      }`}
                                    >
                                      {isImage ? (
                                        <img src={url} alt={f.name} className="w-24 h-16 object-cover" />
                                      ) : (
                                        <video src={url} className="w-24 h-16 object-cover" />
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                              <p className="text-xs text-white/70">
                                If not selected, the first uploaded media will be used.
                              </p>
                            </div>
                          )}
                        </div>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                )
              })}
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-sm hover:scale-[1.02] transition-transform"
              >
                {isPending
                  ? mode === "create"
                    ? "Creating..."
                    : "Saving..."
                  : mode === "create"
                  ? "Create"
                  : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

