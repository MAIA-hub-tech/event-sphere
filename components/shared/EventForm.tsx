'use client';

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
    price?: string;
    isFree?: boolean;
    url?: string;
    creatorId?: string;
  };
  eventId?: string;
  userId: string;
  onSuccess?: () => void;
};

const EventForm = ({ type, event, eventId, userId, onSuccess }: EventFormProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const initialValues = event && type === 'Update'
    ? {
        ...event,
        price: event.isFree ? '0' : (event.price?.toString() || ''),
        isFree: event.isFree ?? false,
        startDateTime: event.startDateTime ? new Date(event.startDateTime) : new Date(),
        endDateTime: event.endDateTime ? new Date(event.endDateTime) : new Date(),
        creatorId: userId
      }
    : {
        ...eventDefaultValues,
        startDateTime: new Date(),
        endDateTime: new Date(),
        creatorId: userId,
        price: '',
        isFree: false
      };

  const form = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: initialValues,
  });

  const isFree = form.watch("isFree");

  const getFirebaseToken = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken(true);
  };

  const handleSubmit = async (values: z.infer<typeof eventFormSchema>) => {
    try {
      setIsSubmitting(true);
      console.log('Form values on submission:', values);
      console.log('Files:', files);

      // Validate form data
      if (!values.title) throw new Error('Event title is required');
      if (!values.categoryId) throw new Error('Category is required');
      if (!values.startDateTime) throw new Error('Start date and time are required');
      if (!values.endDateTime) throw new Error('End date and time are required');
      if (!values.location) throw new Error('Location is required');

      const token = await getFirebaseToken();
      console.log('ID Token:', token);

      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description || '');
      formData.append('location', values.location);
      formData.append('isFree', String(values.isFree));
      formData.append('price', values.isFree ? '0' : values.price || '0');
      formData.append('categoryId', values.categoryId);
      formData.append('startDateTime', values.startDateTime.toISOString());
      formData.append('endDateTime', values.endDateTime.toISOString());
      formData.append('url', values.url || '');
      formData.append('isOnline', String(values.location.toLowerCase().includes('online')));
      if (files.length > 0) {
        formData.append('imageFile', files[0]);
      }

      console.log('Submitting FormData:', Array.from(formData.entries()));

      const endpoint = type === 'Create' ? '/api/events' : `/api/events/${eventId}`;
      const method = type === 'Create' ? 'POST' : 'PUT';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${type.toLowerCase()} event (Status: ${response.status})`);
      }

      const result = await response.json();
      console.log('API Response:', result);

      toast.success(`Event ${type.toLowerCase()}d successfully!`, {
        description: `Your event "${values.title}" has been ${type.toLowerCase()}d.`,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        const redirectId = type === 'Create' ? result.id : eventId;
        if (!redirectId) {
          throw new Error('Event ID not returned from API');
        }
        router.push(`/events/${redirectId}`);
        router.refresh();
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      console.error('Submission error:', errorMessage);
      toast.error('Failed to create event', {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 w-full max-w-6xl mx-auto p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-fade">
              {type === 'Create' ? 'Create New Event' : 'Update Event'}
            </h2>

            <div className="flex flex-col gap-6 md:flex-row">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-gray-700 font-bold text-lg">Event Title*</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Event title"
                          {...field}
                          className="bg-gray-50 h-12 focus-visible:ring-offset-0 placeholder:text-gray-500 rounded-full text-lg font-normal leading-[28px] px-6 py-3 border-none focus-visible:ring-transparent transition-shadow duration-300 shadow-md hover:shadow-lg"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm mt-2" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-gray-700 font-bold text-lg">Category*</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Dropdown
                          onChangeHandler={field.onChange}
                          value={field.value}
                          className="shadow-md hover:shadow-lg transition-shadow duration-300"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm mt-2" />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col gap-6 md:flex-row">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-gray-700 font-bold text-lg">Description*</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Textarea
                          placeholder="Describe your event..."
                          {...field}
                          className="bg-gray-50 flex-1 placeholder:text-gray-500 text-lg font-normal leading-[28px] px-6 py-3 border-none min-h-[140px] rounded-[10px] focus:ring-cyan-500 focus:border-cyan-500 transition-shadow duration-300 shadow-md hover:shadow-lg"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm mt-2" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-gray-700 font-bold text-lg">Event Image</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <FileUploader
                          onFieldChange={field.onChange}
                          imageUrl={field.value || ''}
                          setFiles={setFiles}
                          disabled={isSubmitting}
                          className="shadow-md hover:shadow-lg transition-shadow duration-300"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm mt-2" />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col gap-6 md:flex-row">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-gray-700 font-bold text-lg">Location*</FormLabel>
                    <FormControl>
                      <div className="relative flex items-center h-12 w-full rounded-full bg-gray-50 px-6 py-3 transition-shadow duration-300 shadow-md hover:shadow-lg">
                        <Image
                          src="/assets/icons/location-grey.svg"
                          alt="location"
                          width={28}
                          height={28}
                          className="mr-3"
                        />
                        <Input
                          placeholder="Event location or Online"
                          {...field}
                          className="h-12 focus-visible:ring-offset-0 placeholder:text-gray-500 rounded-full text-lg font-normal leading-[28px] px-4 py-3 border-none focus-visible:ring-transparent bg-gray-50 flex-1"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm mt-2" />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col gap-6 md:flex-row">
              <FormField
                control={form.control}
                name="startDateTime"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-gray-700 font-bold text-lg">Start Date & Time*</FormLabel>
                    <FormControl>
                      <div className="relative overflow-visible">
                        <DatePicker
                          selected={field.value}
                          onChange={(date: Date | null) => field.onChange(date ?? new Date())}
                          showTimeSelect
                          dateFormat="MM/dd/yyyy h:mm aa"
                          minDate={new Date()}
                          className="w-full p-2 border rounded-full bg-gray-50 focus:ring-cyan-500 focus:border-cyan-500 transition-shadow duration-300 text-lg shadow-md hover:shadow-lg"
                          popperClassName="z-50"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm mt-2" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDateTime"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-gray-700 font-bold text-lg">End Date & Time*</FormLabel>
                    <FormControl>
                      <div className="relative overflow-visible">
                        <DatePicker
                          selected={field.value}
                          onChange={(date: Date | null) => field.onChange(date ?? new Date())}
                          showTimeSelect
                          dateFormat="MM/dd/yyyy h:mm aa"
                          minDate={form.getValues("startDateTime")}
                          className="w-full p-2 border rounded-full bg-gray-50 focus:ring-cyan-500 focus:border-cyan-500 transition-shadow duration-300 text-lg shadow-md hover:shadow-lg"
                          popperClassName="z-50"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm mt-2" />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col gap-6 md:flex-row">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem className={`w-full ${isFree ? 'flex justify-center items-center' : ''}`}>
                    <FormLabel className={`text-gray-700 font-bold text-lg ${isFree ? 'sr-only' : ''}`}>Price</FormLabel>
                    <FormControl>
                      <div className={`flex items-center h-12 w-full rounded-full px-6 py-3 transition-shadow duration-300 shadow-md hover:shadow-lg ${isFree ? 'justify-center bg-green-50' : 'bg-gray-50'}`}>
                        {!isFree && (
                          <>
                            <Image
                              src="/assets/icons/pound.png"
                              alt="pound"
                              width={28}
                              height={28}
                              className="mr-3"
                            />
                            <Input
                              type="number"
                              placeholder="Price"
                              min="0"
                              step="0.01"
                              {...field}
                              className="border-none bg-transparent flex-1 focus:ring-0 focus:ring-offset-0 rounded-full focus:ring-cyan-500 text-lg"
                              disabled={isFree}
                            />
                          </>
                        )}
                        <FormField
                          control={form.control}
                          name="isFree"
                          render={({ field }) => (
                            <FormItem className={`flex items-center ${isFree ? '' : 'ml-4'}`}>
                              <FormControl>
                                <div className="flex items-center">
                                  <label htmlFor="isFree" className="whitespace-nowrap pr-3 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-lg">
                                    Free Event
                                  </label>
                                  <Checkbox
                                    onCheckedChange={(checked: boolean) => {
                                      field.onChange(checked);
                                      if (checked) {
                                        form.setValue('price', '0');
                                      } else {
                                        form.setValue('price', '');
                                      }
                                    }}
                                    checked={field.value}
                                    id="isFree"
                                    className={`h-6 w-6 ${field.value ? 'text-green-500' : 'text-cyan-600'}`}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-500 text-sm mt-2" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </FormControl>
                    {!isFree && <FormMessage className="text-red-500 text-sm mt-2" />}
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-gray-700 font-bold text-lg">Event URL (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative flex items-center h-12 w-full rounded-full bg-gray-50 px-6 py-3 transition-shadow duration-300 shadow-md hover:shadow-lg">
                        <Image
                          src="/assets/icons/link.svg"
                          alt="link"
                          width={28}
                          height={28}
                          className="mr-3"
                        />
                        <Input
                          placeholder="https://example.com (optional)"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value || undefined)}
                          className="bg-gray-50 h-12 focus-visible:ring-offset-0 placeholder:text-gray-500 rounded-full text-lg font-normal leading-[28px] px-4 py-3 border-none focus-visible:ring-cyan-500 flex-1"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm mt-2" />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={form.formState.isSubmitting || isSubmitting}
              className="bg-cyan-500 rounded-full h-12 text-lg font-normal leading-[28px] text-white hover:bg-cyan-600 transition-shadow duration-300 shadow-md hover:shadow-lg"
            >
              {form.formState.isSubmitting || isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="h-6 w-6 border-4 border-t-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  {type === 'Create' ? 'Creating...' : 'Updating...'}
                </span>
              ) : (
                `${type} Event`
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default EventForm;