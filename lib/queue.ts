// Patient journey (queue) statuses for the clinical workflow. Kept as a simple
// ordered list so new stages can be added without restructuring.
export const QUEUE_STATUSES = [
  "WAITING",
  "CALLED_BY_NURSE",
  "VITALS_COMPLETED",
  "WAITING_FOR_DOCTOR",
  "WITH_DOCTOR",
  "SENT_TO_LABORATORY",
  "RETURNED_FROM_LABORATORY",
  "CONSULTATION_COMPLETED",
  "DISCHARGED",
] as const;

export type QueueStatus = (typeof QUEUE_STATUSES)[number];

export const QUEUE_STATUS_LABEL: Record<QueueStatus, string> = {
  WAITING: "Waiting",
  CALLED_BY_NURSE: "Called by Nurse",
  VITALS_COMPLETED: "Vital Signs Completed",
  WAITING_FOR_DOCTOR: "Waiting for Doctor",
  WITH_DOCTOR: "With Doctor",
  SENT_TO_LABORATORY: "Sent to Laboratory",
  RETURNED_FROM_LABORATORY: "Returned from Laboratory",
  CONSULTATION_COMPLETED: "Consultation Completed",
  DISCHARGED: "Discharged",
};

export function isQueueStatus(value: string): value is QueueStatus {
  return (QUEUE_STATUSES as readonly string[]).includes(value);
}

export function queueStatusLabel(value: string | null | undefined): string {
  if (value && isQueueStatus(value)) return QUEUE_STATUS_LABEL[value];
  return value ?? "—";
}
