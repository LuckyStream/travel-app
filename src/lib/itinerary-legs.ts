import type { ItineraryItem } from "./types";
import { timeSlotOrderIndex } from "./types";

export type ItineraryLeg = {
  from: ItineraryItem;
  to: ItineraryItem;
};

/** Consecutive stops within each day, ordered by time slot. */
export function buildItineraryLegs(items: ItineraryItem[]): ItineraryLeg[] {
  const dayMap = new Map<number, ItineraryItem[]>();
  for (const it of items) {
    const arr = dayMap.get(it.day) ?? [];
    arr.push(it);
    dayMap.set(it.day, arr);
  }

  const legs: ItineraryLeg[] = [];
  const daysSorted = [...dayMap.keys()].sort((a, b) => a - b);
  for (const day of daysSorted) {
    const list = dayMap.get(day)!;
    list.sort((a, b) => timeSlotOrderIndex(a.timeSlot) - timeSlotOrderIndex(b.timeSlot));
    for (let i = 1; i < list.length; i++) {
      legs.push({ from: list[i - 1], to: list[i] });
    }
  }
  return legs;
}

export function itineraryLegKey(fromId: string, toId: string): string {
  return `${fromId}|${toId}`;
}
