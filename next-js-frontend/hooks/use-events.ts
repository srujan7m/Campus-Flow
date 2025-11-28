"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsApi } from "@/lib/api/events";
import { CreateEventData, UpdateEventData, POI } from "@/types/event";

// Query keys
export const eventKeys = {
  all: ["events"] as const,
  lists: () => [...eventKeys.all, "list"] as const,
  list: (userId?: string) => [...eventKeys.lists(), userId] as const,
  details: () => [...eventKeys.all, "detail"] as const,
  detail: (idOrCode: string) => [...eventKeys.details(), idOrCode] as const,
  documents: (eventCode: string) => [...eventKeys.all, "documents", eventCode] as const,
};

// Get all events
export function useEvents(userId?: string) {
  return useQuery({
    queryKey: eventKeys.list(userId),
    queryFn: () => eventsApi.getEvents(userId),
  });
}

// Get single event
export function useEvent(idOrCode: string) {
  return useQuery({
    queryKey: eventKeys.detail(idOrCode),
    queryFn: () => eventsApi.getEvent(idOrCode),
    enabled: !!idOrCode && idOrCode !== "undefined",
  });
}

// Create event
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventData: CreateEventData) => eventsApi.createEvent(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}

// Update event
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventData: UpdateEventData) => eventsApi.updateEvent(eventData),
    onSuccess: (data: { id: string; code: string }) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: eventKeys.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: eventKeys.detail(data.code),
      });
    },
  });
}

// Delete event
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => eventsApi.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}

// Upload document
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventCode, file }: { eventCode: string; file: File }) =>
      eventsApi.uploadDocument(eventCode, file),
    onSuccess: (_: unknown, { eventCode }: { eventCode: string; file: File }) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventCode) });
    },
  });
}

// Upload indoor map
export function useUploadIndoorMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventCode, file }: { eventCode: string; file: File }) =>
      eventsApi.uploadIndoorMap(eventCode, file),
    onSuccess: (_: unknown, { eventCode }: { eventCode: string; file: File }) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventCode) });
    },
  });
}

// Update POIs
export function useUpdatePOIs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventCode, pois }: { eventCode: string; pois: POI[] }) =>
      eventsApi.updatePOIs(eventCode, pois),
    onSuccess: (_: unknown, { eventCode }: { eventCode: string; pois: POI[] }) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventCode) });
    },
  });
}

// Get documents with processing status
export function useDocuments(eventCode: string) {
  return useQuery({
    queryKey: eventKeys.documents(eventCode),
    queryFn: () => eventsApi.getDocuments(eventCode),
    enabled: !!eventCode && eventCode !== "undefined",
    refetchInterval: 5000, // Poll every 5 seconds to check processing status
  });
}

// Delete document
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventCode, docId }: { eventCode: string; docId: string }) =>
      eventsApi.deleteDocument(eventCode, docId),
    onSuccess: (_: unknown, { eventCode }: { eventCode: string; docId: string }) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.documents(eventCode) });
    },
  });
}
