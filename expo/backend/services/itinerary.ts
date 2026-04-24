import {
  Itinerary,
  ItinerarySummary,
  ItineraryItem,
  ItineraryDay,
  CreateItineraryInput,
  UpdateItineraryInput,
  AddItineraryItemInput,
  UpdateItineraryItemInput,
  ReorderItineraryItemInput,
  ItinerarySearchParams,
  ItineraryTemplate,
  ItineraryLocation,
  ItineraryStatus,
} from '../../types/itinerary';

const itineraries: Map<string, Itinerary> = new Map();

function generateId(): string {
  return `itin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateItemId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function calculateDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function generateDays(startDate: string, endDate: string, destinations: ItineraryLocation[]): ItineraryDay[] {
  const numDays = calculateDaysBetween(startDate, endDate);
  const days: ItineraryDay[] = [];
  const startDateObj = new Date(startDate);

  for (let i = 0; i < numDays; i++) {
    const currentDate = new Date(startDateObj);
    currentDate.setDate(currentDate.getDate() + i);
    
    const locationIndex = Math.min(i, destinations.length - 1);
    
    days.push({
      dayIndex: i,
      date: currentDate.toISOString().split('T')[0],
      location: destinations[locationIndex] || destinations[0],
      items: [],
    });
  }

  return days;
}

export async function createItinerary(input: CreateItineraryInput): Promise<Itinerary> {
  const id = generateId();
  const now = new Date().toISOString();
  
  const itinerary: Itinerary = {
    id,
    title: input.title,
    description: input.description,
    startDate: input.startDate,
    endDate: input.endDate,
    status: 'draft',
    destinations: input.destinations,
    days: generateDays(input.startDate, input.endDate, input.destinations),
    totalBudget: input.totalBudget || 0,
    spentBudget: 0,
    currency: input.currency || 'USD',
    travelers: input.travelers || 1,
    isPublic: false,
    createdAt: now,
    updatedAt: now,
  };

  itineraries.set(id, itinerary);
  console.log(`📋 Created itinerary: ${itinerary.title} (${id})`);
  
  return itinerary;
}

export async function getItinerary(id: string): Promise<Itinerary | null> {
  return itineraries.get(id) || null;
}

export async function getItineraries(params?: ItinerarySearchParams): Promise<ItinerarySummary[]> {
  let results = Array.from(itineraries.values());

  if (params) {
    if (params.status) {
      results = results.filter(i => i.status === params.status);
    }
    if (params.startDateFrom) {
      results = results.filter(i => i.startDate >= params.startDateFrom!);
    }
    if (params.startDateTo) {
      results = results.filter(i => i.startDate <= params.startDateTo!);
    }
    if (params.destination) {
      const destLower = params.destination.toLowerCase();
      results = results.filter(i => 
        i.destinations.some(d => 
          d.city.toLowerCase().includes(destLower) || 
          d.country.toLowerCase().includes(destLower)
        )
      );
    }
    if (params.minBudget !== undefined) {
      results = results.filter(i => i.totalBudget >= params.minBudget!);
    }
    if (params.maxBudget !== undefined) {
      results = results.filter(i => i.totalBudget <= params.maxBudget!);
    }
  }

  return results.map(i => ({
    id: i.id,
    title: i.title,
    coverImage: i.coverImage,
    startDate: i.startDate,
    endDate: i.endDate,
    status: i.status,
    destinations: i.destinations.map(d => d.city),
    totalDays: i.days.length,
    totalItems: i.days.reduce((sum, day) => sum + day.items.length, 0),
    totalBudget: i.totalBudget,
    currency: i.currency,
  }));
}

export async function updateItinerary(input: UpdateItineraryInput): Promise<Itinerary | null> {
  const itinerary = itineraries.get(input.id);
  if (!itinerary) return null;

  const updated: Itinerary = {
    ...itinerary,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  if (input.startDate || input.endDate) {
    const startDate = input.startDate || itinerary.startDate;
    const endDate = input.endDate || itinerary.endDate;
    const destinations = input.destinations || itinerary.destinations;
    
    const existingItemsByDay = new Map<number, ItineraryItem[]>();
    itinerary.days.forEach(day => {
      existingItemsByDay.set(day.dayIndex, day.items);
    });
    
    updated.days = generateDays(startDate, endDate, destinations);
    
    updated.days.forEach(day => {
      const existingItems = existingItemsByDay.get(day.dayIndex);
      if (existingItems) {
        day.items = existingItems;
      }
    });
  }

  itineraries.set(input.id, updated);
  console.log(`✏️ Updated itinerary: ${updated.title} (${input.id})`);
  
  return updated;
}

export async function deleteItinerary(id: string): Promise<boolean> {
  const deleted = itineraries.delete(id);
  if (deleted) {
    console.log(`🗑️ Deleted itinerary: ${id}`);
  }
  return deleted;
}

export async function addItineraryItem(input: AddItineraryItemInput): Promise<ItineraryItem | null> {
  const itinerary = itineraries.get(input.itineraryId);
  if (!itinerary) return null;

  const day = itinerary.days.find(d => d.dayIndex === input.dayIndex);
  if (!day) return null;

  const now = new Date().toISOString();
  const newItem: ItineraryItem = {
    ...input.item,
    id: generateItemId(),
    dayIndex: input.dayIndex,
    order: day.items.length,
    createdAt: now,
    updatedAt: now,
  } as ItineraryItem;

  day.items.push(newItem);
  
  itinerary.spentBudget = calculateSpentBudget(itinerary);
  itinerary.updatedAt = now;
  
  itineraries.set(input.itineraryId, itinerary);
  console.log(`➕ Added item to itinerary: ${newItem.title} (Day ${input.dayIndex + 1})`);
  
  return newItem;
}

export async function updateItineraryItem(input: UpdateItineraryItemInput): Promise<ItineraryItem | null> {
  const itinerary = itineraries.get(input.itineraryId);
  if (!itinerary) return null;

  let updatedItem: ItineraryItem | null = null;

  for (const day of itinerary.days) {
    const itemIndex = day.items.findIndex(item => item.id === input.itemId);
    if (itemIndex !== -1) {
      day.items[itemIndex] = {
        ...day.items[itemIndex],
        ...input.updates,
        updatedAt: new Date().toISOString(),
      } as ItineraryItem;
      updatedItem = day.items[itemIndex];
      break;
    }
  }

  if (updatedItem) {
    itinerary.spentBudget = calculateSpentBudget(itinerary);
    itinerary.updatedAt = new Date().toISOString();
    itineraries.set(input.itineraryId, itinerary);
    console.log(`✏️ Updated item: ${updatedItem.title}`);
  }

  return updatedItem;
}

export async function removeItineraryItem(itineraryId: string, itemId: string): Promise<boolean> {
  const itinerary = itineraries.get(itineraryId);
  if (!itinerary) return false;

  let removed = false;

  for (const day of itinerary.days) {
    const itemIndex = day.items.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      day.items.splice(itemIndex, 1);
      day.items.forEach((item, idx) => {
        item.order = idx;
      });
      removed = true;
      break;
    }
  }

  if (removed) {
    itinerary.spentBudget = calculateSpentBudget(itinerary);
    itinerary.updatedAt = new Date().toISOString();
    itineraries.set(itineraryId, itinerary);
    console.log(`🗑️ Removed item from itinerary: ${itemId}`);
  }

  return removed;
}

export async function reorderItineraryItem(input: ReorderItineraryItemInput): Promise<boolean> {
  const itinerary = itineraries.get(input.itineraryId);
  if (!itinerary) return false;

  let item: ItineraryItem | null = null;
  let sourceDay: ItineraryDay | null = null;

  for (const day of itinerary.days) {
    const itemIndex = day.items.findIndex(i => i.id === input.itemId);
    if (itemIndex !== -1) {
      item = day.items.splice(itemIndex, 1)[0];
      sourceDay = day;
      break;
    }
  }

  if (!item) return false;

  const targetDay = itinerary.days.find(d => d.dayIndex === input.newDayIndex);
  if (!targetDay) {
    if (sourceDay) {
      sourceDay.items.push(item);
    }
    return false;
  }

  item.dayIndex = input.newDayIndex;
  item.order = input.newOrder;
  item.updatedAt = new Date().toISOString();

  targetDay.items.splice(input.newOrder, 0, item);
  targetDay.items.forEach((i, idx) => {
    i.order = idx;
  });

  if (sourceDay && sourceDay !== targetDay) {
    sourceDay.items.forEach((i, idx) => {
      i.order = idx;
    });
  }

  itinerary.updatedAt = new Date().toISOString();
  itineraries.set(input.itineraryId, itinerary);
  console.log(`🔄 Reordered item: ${item.title} to Day ${input.newDayIndex + 1}`);

  return true;
}

export async function duplicateItinerary(id: string, newTitle?: string): Promise<Itinerary | null> {
  const original = itineraries.get(id);
  if (!original) return null;

  const now = new Date().toISOString();
  const newId = generateId();

  const duplicate: Itinerary = {
    ...JSON.parse(JSON.stringify(original)),
    id: newId,
    title: newTitle || `${original.title} (Copy)`,
    status: 'draft' as ItineraryStatus,
    createdAt: now,
    updatedAt: now,
  };

  duplicate.days.forEach(day => {
    day.items.forEach(item => {
      item.id = generateItemId();
      item.bookingStatus = 'not_booked';
      item.bookingReference = undefined;
      item.confirmationNumber = undefined;
      item.createdAt = now;
      item.updatedAt = now;
    });
  });

  itineraries.set(newId, duplicate);
  console.log(`📋 Duplicated itinerary: ${duplicate.title} (${newId})`);

  return duplicate;
}

function calculateSpentBudget(itinerary: Itinerary): number {
  return itinerary.days.reduce((total, day) => {
    return total + day.items.reduce((dayTotal, item) => {
      if (item.bookingStatus === 'confirmed' || item.bookingStatus === 'completed') {
        return dayTotal + item.price;
      }
      return dayTotal;
    }, 0);
  }, 0);
}

export function getItineraryStats(itinerary: Itinerary) {
  const stats = {
    totalDays: itinerary.days.length,
    totalItems: 0,
    itemsByType: {} as Record<string, number>,
    totalEstimatedCost: 0,
    bookedCost: 0,
    destinations: new Set<string>(),
  };

  itinerary.days.forEach(day => {
    stats.destinations.add(day.location.city);
    day.items.forEach(item => {
      stats.totalItems++;
      stats.itemsByType[item.type] = (stats.itemsByType[item.type] || 0) + 1;
      stats.totalEstimatedCost += item.price;
      if (item.bookingStatus === 'confirmed' || item.bookingStatus === 'completed') {
        stats.bookedCost += item.price;
      }
    });
  });

  return {
    ...stats,
    destinations: Array.from(stats.destinations),
  };
}

export const itineraryTemplates: ItineraryTemplate[] = [
  {
    id: 'template_peru_classic',
    title: 'Classic Peru Adventure',
    description: 'Experience the highlights of Peru from Lima to Machu Picchu',
    coverImage: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800',
    duration: 7,
    destinations: [
      { city: 'Lima', country: 'Peru', countryCode: 'PE' },
      { city: 'Cusco', country: 'Peru', countryCode: 'PE' },
      { city: 'Machu Picchu', country: 'Peru', countryCode: 'PE' },
    ],
    suggestedBudget: 1500,
    currency: 'USD',
    highlights: ['Machu Picchu', 'Sacred Valley', 'Lima Food Tour', 'Rainbow Mountain'],
    items: [],
    tags: ['adventure', 'culture', 'history'],
    popularity: 95,
  },
  {
    id: 'template_colombia_coast',
    title: 'Colombian Caribbean Coast',
    description: 'Discover the vibrant culture and beaches of Colombia',
    coverImage: 'https://images.unsplash.com/photo-1533050487297-09b450131914?w=800',
    duration: 5,
    destinations: [
      { city: 'Cartagena', country: 'Colombia', countryCode: 'CO' },
      { city: 'Santa Marta', country: 'Colombia', countryCode: 'CO' },
    ],
    suggestedBudget: 1000,
    currency: 'USD',
    highlights: ['Old Town Cartagena', 'Tayrona Park', 'Rosario Islands'],
    items: [],
    tags: ['beach', 'culture', 'relaxation'],
    popularity: 88,
  },
  {
    id: 'template_patagonia',
    title: 'Patagonia Explorer',
    description: 'Trek through the stunning landscapes of southern Argentina',
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
    duration: 10,
    destinations: [
      { city: 'Buenos Aires', country: 'Argentina', countryCode: 'AR' },
      { city: 'El Calafate', country: 'Argentina', countryCode: 'AR' },
      { city: 'El Chaltén', country: 'Argentina', countryCode: 'AR' },
    ],
    suggestedBudget: 2500,
    currency: 'USD',
    highlights: ['Perito Moreno Glacier', 'Mount Fitz Roy', 'Torres del Paine'],
    items: [],
    tags: ['adventure', 'hiking', 'nature'],
    popularity: 92,
  },
];

export async function getItineraryTemplates(): Promise<ItineraryTemplate[]> {
  return itineraryTemplates;
}

export async function createFromTemplate(templateId: string, startDate: string): Promise<Itinerary | null> {
  const template = itineraryTemplates.find(t => t.id === templateId);
  if (!template) return null;

  const startDateObj = new Date(startDate);
  const endDateObj = new Date(startDateObj);
  endDateObj.setDate(endDateObj.getDate() + template.duration - 1);

  return createItinerary({
    title: template.title,
    description: template.description,
    startDate: startDate,
    endDate: endDateObj.toISOString().split('T')[0],
    destinations: template.destinations,
    totalBudget: template.suggestedBudget,
    currency: template.currency,
  });
}
