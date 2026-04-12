import type { Timestamp } from 'firebase/firestore';

/** Converts Firestore Timestamp (or Date) from document data for UI display. */
export function firestoreTimestampToDate(value: unknown): Date | undefined {
    if (value instanceof Date) return value;
    if (
        value &&
        typeof value === 'object' &&
        'toDate' in value &&
        typeof (value as Timestamp).toDate === 'function'
    ) {
        return (value as Timestamp).toDate();
    }
    return undefined;
}
