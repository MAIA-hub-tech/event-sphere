"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { eventFormSchema } from "@/lib/validation";
import * as z from 'zod';
import { eventDefaultValues } from "@/constants";
import Dropdown from "./Dropdown";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "./FileUploader";
import { useState } from "react";
import Image from "next/image";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Checkbox } from "../ui/checkbox";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getAuth } from "firebase/auth";

type EventFormProps = {
  type: "Create" | "Update";
  event?: {
    id?: string;
    title?: string;
    description?: string;
    location?: string;
    imageUrl?: string;
    startDateTime?: Date;
    endDateTime?: Date;
    categoryId?: string;
    price?: number;
    isFree?: boolean;
    url?: string;
  };
  eventId?: string;
  userId: string;
  onSuccess?: () => void;
};

const EventForm = ({ type, event, eventId, userId, onSuccess }: EventFormProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const initialValues = event && type === 'Update'
    ? {
        ...event,
        price: event.isFree ? "0" : event.price?.toString() || "0",
        startDateTime: event.startDateTime ? new Date(event.startDateTime) : new Date(),
        endDateTime: event.endDateTime ? new Date(event.endDateTime) : new Date()
      }
    : {
        ...eventDefaultValues,
        price: eventDefaultValues.price.toString(),
        startDateTime: new Date(),
        endDateTime: new Date()
      };

  const form = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: initialValues
  });

  const isFree = form.watch("isFree");

  const getFirebaseToken = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken();
  };

  function parseS3XmlError(xmlString: string): string {
    const match = xmlString.match(/<Message>(.*?)<\/Message>/);
    return match ? match[1] : 'S3 storage error';
  }

  const handleSubmit = async (values: z.infer<typeof eventFormSchema>) => {
    try {
      setIsUploading(true);
      const token = await getFirebaseToken();
      
      // Handle image upload first
      let imageUrl = values.imageUrl;
      if (files.length > 0) {
        const formData = new FormData();
        formData.append('file', files[0]);
        formData.append('eventId', event?.id || '');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        // Handle all possible response types
        const responseText = await uploadResponse.text();
        let result;
        
        try {
          result = JSON.parse(responseText);
        } catch {
          // Handle non-JSON responses (like S3 XML errors)
          throw new Error(
            responseText.includes('<Error>') 
              ? parseS3XmlError(responseText)
              : 'Invalid server response'
          );
        }

        if (!uploadResponse.ok) {
          throw new Error(result.error || 'Upload failed');
        }

        imageUrl = result.url || result.publicUrl;
      }

      // Submit event data
      const endpoint = type === 'Create' ? '/api/events' : `/api/events/${eventId}`;
      const response = await fetch(endpoint, {
        method: type === 'Create' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...values,
          imageUrl: imageUrl || null,
          userId
        })
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error('Server responded with:', {
          status: response.status,
          data: responseData
        });
        throw new Error(
          responseData.error || 
          responseData.message || 
          `Request failed with status ${response.status}`
        );
      }

      // Success handling
      toast.success(`Event ${type === 'Create' ? 'created' : 'updated'} successfully!`);
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/events/${type === 'Create' ? responseData.id : eventId}`);
      }

    } catch (error) {
      console.error('Form submission error:', {
        error,
        values: form.getValues(),
        files
      });
      toast.error(
        error instanceof Error ? error.message : 'Failed to create event'
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-5">
        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="text-gray-700">Event Title*</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Event title"
                    {...field}
                    className="bg-gray-50 h-[54px] focus-visible:ring-offset-0 placeholder:text-gray-500 rounded-full  text-[16px] font-normal leading-[24px] px-4 py-3 border-none focus-visible:ring-transparent"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="text-gray-700">Category*</FormLabel>
                <FormControl>
                  <Dropdown
                    onChangeHandler={field.onChange}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="text-gray-700">Description*</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your event..."
                    {...field}
                    className="bg-gray-50 flex flex-1 placeholder:text-gray-500 text-[16px] font-normal leading-[24px] px-5 py-3 border-none min-h-[200px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="text-gray-700">Event Image</FormLabel>
                <FormControl>
                  <FileUploader
                    onFieldChange={field.onChange}
                    imageUrl={field.value}
                    setFiles={setFiles}
                    disabled={isUploading}
                  />
                </FormControl>
                <FormMessage />
                {isUploading && (
                  <p className="text-sm text-gray-500">Uploading image...</p>
                )}
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="text-gray-700">Location*</FormLabel>
                <FormControl>
                  <div className="flex justify-center items-center h-[54px] w-full overflow-hidden rounded-full bg-gray-50 px-4 py-2">
                    <Image
                      src="/assets/icons/location-grey.svg"
                      alt="location"
                      width={24}
                      height={24}
                    />
                    <Input
                      placeholder="Event location or Online"
                      {...field}
                      className="h-[54px] focus-visible:ring-offset-0 placeholder:text-gray-500 rounded-full text-[16px] font-normal leading-[24px] px-4 py-3 border-none focus-visible:ring-transparent  border-0 bg-gray-50"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
            control={form.control}
            name="startDateTime"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Start Date & Time*</FormLabel>
                <FormControl>
                  <DatePicker
                    selected={field.value}
                    onChange={(date: Date | null) => {
                      if (date) field.onChange(date);
                    }}
                    showTimeSelect
                    dateFormat="MM/dd/yyyy h:mm aa"
                    minDate={new Date()}
                    className="w-full p-2 border rounded"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDateTime"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>End Date & Time*</FormLabel>
                <FormControl>
                  <DatePicker
                    selected={field.value}
                    onChange={(date: Date | null) => {
                      if (date) field.onChange(date);
                    }}
                    showTimeSelect
                    dateFormat="MM/dd/yyyy h:mm aa"
                    minDate={form.getValues("startDateTime")}
                    className="w-full p-2 border rounded"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="text-gray-700">Price</FormLabel>
                <FormControl>
                  <div className="flex justify-center items-center h-[54px] w-full overflow-hidden rounded-full bg-gray-50 px-4 py-2">
                    <Image
                      src="/assets/icons/pound.png"
                      alt="dollar"
                      width={24}
                      height={24}
                      className=""
                    />
                    {isFree ? (
                      <div className="ml-3 p-medium-16 text-gray-500">
                        Free Event
                      </div>
                    ) : (
                      <Input
                        type="number"
                        placeholder="Price"
                        min="0"
                        step="0.01"
                        {...field}
                        className="input-field border-0 bg-gray-50"
                      />
                    )}
                    <FormField
                      control={form.control}
                      name="isFree"
                      render={({ field }) => (
                        <FormItem className="flex items-center ml-4">
                          <FormControl>
                            <div className="flex items-center">
                              <label htmlFor="isFree" className="whitespace-nowrap pr-3 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Free Event
                              </label>
                              <Checkbox
                                onCheckedChange={(checked: boolean) => {
                                  field.onChange(checked);
                                  form.setValue('price', checked ? "0" : "");
                                }}
                                checked={field.value}
                                id="isFree"
                                className=" h-5 w-5 text-blue-600"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="text-gray-700">Event URL</FormLabel>
                <FormControl>
                  <div className="flex justify-center items-center h-[54px] w-full overflow-hidden rounded-full bg-gray-50 px-4 py-2">
                    <Image
                      src="/assets/icons/link.svg"
                      alt="link"
                      width={24}
                      height={24}
                    />
                    <Input
                      placeholder="https://example.com"
                      {...field}
                      className="bg-gray-50 h-[54px] focus-visible:ring-offset-0 placeholder:text-gray-500 rounded-full text-[16px] font-medium leading-[24px px-4 py-3 border-none focus-visible:ring-transparent border-0 bg-gray-50"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={form.formState.isSubmitting || isUploading}
          className="bg-cyan-500 rounded-full h-[54px] text-[16px] font-normal leading-[24px]  hover:bg-cyan-700 w-full py-6"
        >
          {form.formState.isSubmitting || isUploading ? (
            <span className="flex justify-center items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {type === 'Create' ? 'Creating...' : 'Updating...'}
            </span>
          ) : (
            `${type} Event`
          )}
        </Button>
      </form>
    </Form>
  );
};

export default EventForm;