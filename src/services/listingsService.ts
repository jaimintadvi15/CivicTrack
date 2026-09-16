import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from '../lib/firebase';
import { CivicIssue, IssueCategory, IssueSeverity, IssueStatus, TimelineEvent } from '../types';
import { initialIssues } from '../data/mockData';
import { getAssetUrl } from '../utils/assetUrl';
import { normalizePhone } from '../utils/ownership';

export interface FirestoreListing {
  id?: string;
  ticketNumber: string;
  title: string;
  category: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  severity: IssueSeverity;
  photos: string[];
  reporterId: string;
  reporterName: string;
  reporterPhone?: string;
  includeReporterContact?: boolean;
  status: IssueStatus;
  upvotes: number;
  confirmedBy: string[];
  ward: string;
  createdAt: any;
  updatedAt: any;
  resolvedPhotoUrl: string | null;
  flagged: boolean;
  timeline: TimelineEvent[];
  mergedCount?: number;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  targetResolutionHours?: number;
  resolutionRemarks?: string;
  resolvedAt?: string;
  voiceNoteTranscription?: string;
}

const LOCAL_STORAGE_KEY = 'civic_hero_persistent_listings_v1';
const RATE_LIMIT_KEY = 'civic_hero_rate_limits_v1';
const MAX_LISTINGS_PER_DAY = 5;

const PURGED_TICKETS = new Set(['BLR-2026-9065']);
const PURGED_TITLES = new Set(['hdjkhgdfgngkd']);

export const isPurgedListing = (l: { ticketNumber?: string; title?: string }): boolean => {
  if (l.ticketNumber && PURGED_TICKETS.has(l.ticketNumber)) return true;
  if (l.title && PURGED_TITLES.has(l.title.trim())) return true;
  return false;
};

// Purge test listing from Firestore if configured
if (isFirebaseConfigured && db) {
  try {
    const firestore = db;
    PURGED_TICKETS.forEach((ticket) => {
      const q = query(collection(firestore, 'listings'), where('ticketNumber', '==', ticket));
      getDocs(q).then((snap) => {
        snap.forEach((docSnap) => {
          deleteDoc(docSnap.ref).catch(console.warn);
        });
      }).catch(console.warn);
    });
  } catch {
    // ignore
  }
}

// Helper: Format timestamps into human readable strings
const formatTimestamp = (ts: any): string => {
  if (!ts) return 'Just now';
  if (typeof ts === 'string') return ts;
  if (ts instanceof Timestamp) {
    const date = ts.toDate();
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  if (typeof ts === 'object' && typeof ts.seconds === 'number') {
    const date = new Date(ts.seconds * 1000);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  if (typeof ts === 'number') {
    const diffMs = Date.now() - ts;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  return 'Just now';
};

// Map FirestoreListing to CivicIssue expected by frontend components
export const mapListingToCivicIssue = (
  listing: FirestoreListing,
  currentUserId?: string
): CivicIssue => {
  const fallbackPhoto = getAssetUrl('issues/garbage.jpg');
  const photos = listing.photos && listing.photos.length > 0 ? listing.photos : [fallbackPhoto];

  return {
    id: listing.id || `listing-${Date.now()}`,
    ticketNumber: listing.ticketNumber || `BLR-2026-${(listing.id || '000').slice(-4).toUpperCase()}`,
    title: listing.title,
    category: (listing.category as IssueCategory) || 'Other',
    severity: listing.severity || 'Medium',
    status: listing.status || 'Submitted',
    description: listing.description || '',
    location: {
      address: listing.address || 'Bengaluru, Karnataka',
      ward: listing.ward || 'Ward 4 - Indiranagar',
      city: 'Bengaluru',
      lat: Number(listing.lat) || 12.9784,
      lng: Number(listing.lng) || 77.6408,
    },
    photoUrl: photos[0],
    photos,
    afterPhotoUrl: listing.resolvedPhotoUrl || undefined,
    voiceNoteTranscription: listing.voiceNoteTranscription,
    createdAt: formatTimestamp(listing.createdAt),
    updatedAt: formatTimestamp(listing.updatedAt),
    timeline: listing.timeline || [],
    upvotes: listing.upvotes || 0,
    hasUpvoted: Boolean(currentUserId && listing.confirmedBy?.includes(currentUserId)),
    mergedCount: listing.mergedCount || 0,
    assignedWorkerId: listing.assignedWorkerId,
    assignedWorkerName: listing.assignedWorkerName,
    targetResolutionHours: listing.targetResolutionHours,
    citizenId: listing.reporterId,
    citizenName: listing.reporterName,
    reporterPhone: listing.reporterPhone,
    includeReporterContact: listing.includeReporterContact,
    resolutionRemarks: listing.resolutionRemarks,
    resolvedAt: listing.resolvedAt,
  };
};

// Seed initial demo data for persistence if empty
const getInitialListings = (): FirestoreListing[] => {
  return initialIssues.map((issue) => ({
    id: issue.id,
    ticketNumber: issue.ticketNumber,
    title: issue.title,
    category: issue.category,
    description: issue.description,
    address: issue.location.address,
    lat: issue.location.lat,
    lng: issue.location.lng,
    severity: issue.severity,
    photos: issue.photos && issue.photos.length > 0 ? issue.photos : [issue.photoUrl],
    reporterId: issue.citizenId,
    reporterName: issue.citizenName,
    reporterPhone: issue.reporterPhone,
    includeReporterContact: issue.includeReporterContact,
    status: issue.status,
    upvotes: issue.upvotes,
    confirmedBy: issue.hasUpvoted ? [issue.citizenId] : [],
    ward: issue.location.ward,
    createdAt: Date.now() - 3600000 * 4,
    updatedAt: Date.now() - 1800000,
    resolvedPhotoUrl: issue.afterPhotoUrl || null,
    flagged: false,
    timeline: issue.timeline,
    mergedCount: issue.mergedCount,
    assignedWorkerId: issue.assignedWorkerId,
    assignedWorkerName: issue.assignedWorkerName,
    targetResolutionHours: issue.targetResolutionHours,
    resolutionRemarks: issue.resolutionRemarks,
    resolvedAt: issue.resolvedAt,
    voiceNoteTranscription: issue.voiceNoteTranscription,
  }));
};

// Local storage helpers
const loadLocalListings = (): FirestoreListing[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      const init = getInitialListings().filter((l) => !isPurgedListing(l));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(init));
      return init;
    }
    const parsed: FirestoreListing[] = JSON.parse(raw);
    const cleaned = parsed.filter((l) => !isPurgedListing(l));
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    console.error('Failed to read local listings:', e);
    return getInitialListings().filter((l) => !isPurgedListing(l));
  }
};

const saveLocalListings = (listings: FirestoreListing[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(listings));
    window.dispatchEvent(new CustomEvent('civic_hero_listings_updated', { detail: listings }));
  } catch (e) {
    console.error('Failed to save local listings:', e);
  }
};

// Rate Limiting helper: Cap at 5 listings per user per 24 hours
export const checkUserRateLimit = async (userId: string): Promise<{ allowed: boolean; remaining: number }> => {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'listings'),
        where('reporterId', '==', userId),
        where('createdAt', '>=', Timestamp.fromMillis(oneDayAgo))
      );
      const snap = await getDocs(q);
      const count = snap.size;
      return {
        allowed: count < MAX_LISTINGS_PER_DAY,
        remaining: Math.max(0, MAX_LISTINGS_PER_DAY - count),
      };
    } catch (e) {
      console.warn('Rate limit Firestore query fallback to local:', e);
    }
  }

  // Local storage rate limit verification
  try {
    const limitsRaw = localStorage.getItem(RATE_LIMIT_KEY);
    const limits: Record<string, number[]> = limitsRaw ? JSON.parse(limitsRaw) : {};
    const userTimestamps = (limits[userId] || []).filter((ts) => ts >= oneDayAgo);
    limits[userId] = userTimestamps;
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(limits));

    return {
      allowed: userTimestamps.length < MAX_LISTINGS_PER_DAY,
      remaining: Math.max(0, MAX_LISTINGS_PER_DAY - userTimestamps.length),
    };
  } catch {
    return { allowed: true, remaining: 5 };
  }
};

// Record listing creation in rate limiter
const recordListingCreation = (userId: string) => {
  try {
    const limitsRaw = localStorage.getItem(RATE_LIMIT_KEY);
    const limits: Record<string, number[]> = limitsRaw ? JSON.parse(limitsRaw) : {};
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const userTimestamps = (limits[userId] || []).filter((ts) => ts >= oneDayAgo);
    userTimestamps.push(Date.now());
    limits[userId] = userTimestamps;
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(limits));
  } catch (e) {
    console.error('Rate limit record error:', e);
  }
};

// Convert File/Blob to base64 data URL for offline fallback
const fileToDataUrl = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Upload photo to Firebase Storage (or persist data URL if offline)
export const uploadListingPhoto = async (
  photo: File | Blob | string,
  listingId: string,
  index: number = 0
): Promise<string> => {
  if (typeof photo === 'string') {
    return photo; // already a valid preset URL or existing URL
  }

  if (isFirebaseConfigured && storage) {
    try {
      const filename = `photo_${index}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `listings/${listingId}/${filename}`);
      const snap = await uploadBytes(storageRef, photo, { contentType: photo.type || 'image/jpeg' });
      return await getDownloadURL(snap.ref);
    } catch (err) {
      console.warn('Firebase Storage upload failed, falling back to data URL:', err);
    }
  }

  return await fileToDataUrl(photo);
};

// Real-time listener for listings
export const subscribeToListings = (
  callback: (issues: CivicIssue[]) => void,
  currentUserId?: string
): (() => void) => {
  // Always emit local cache first for immediate zero-delay display
  const emitLocal = () => {
    const local = loadLocalListings();
    const filtered = local.filter((l) => !l.flagged || l.reporterId === currentUserId);
    callback(filtered.map((l) => mapListingToCivicIssue(l, currentUserId)));
  };

  emitLocal();

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (snapshot.empty) {
            // If Firestore is empty on first setup, retain local listings
            emitLocal();
            return;
          }
          const listings: FirestoreListing[] = snapshot.docs
            .map((docSnap) => ({
              id: docSnap.id,
              ...(docSnap.data() as Omit<FirestoreListing, 'id'>),
            }))
            .filter((l) => !isPurgedListing(l));
          // Keep local storage synchronized with latest Firestore community listings
          saveLocalListings(listings);
          const filtered = listings.filter((l) => !l.flagged || l.reporterId === currentUserId);
          callback(filtered.map((l) => mapListingToCivicIssue(l, currentUserId)));
        },
        (error) => {
          console.warn('Firestore subscription error (using persistent local store):', error);
          emitLocal();
        }
      );
      return unsubscribe;
    } catch (err) {
      console.warn('Firestore onSnapshot init failure:', err);
    }
  }

  // Fallback to local storage real-time event listener
  const handleUpdate = () => emitLocal();
  window.addEventListener('civic_hero_listings_updated', handleUpdate);
  window.addEventListener('storage', handleUpdate);

  return () => {
    window.removeEventListener('civic_hero_listings_updated', handleUpdate);
    window.removeEventListener('storage', handleUpdate);
  };
};

// Create a new listing (Firestore + Storage)
export const createListingDocument = async (
  data: {
    id?: string;
    ticketNumber?: string;
    title: string;
    category: IssueCategory;
    customCategory?: string;
    severity: IssueSeverity;
    description: string;
    photoFiles: (File | Blob | string)[];
    address: string;
    ward: string;
    lat: number;
    lng: number;
    reporterId: string;
    reporterName: string;
    reporterPhone?: string;
    includeReporterContact?: boolean;
    voiceNoteTranscription?: string;
  }
): Promise<CivicIssue> => {
  // 1. Check Rate Limit
  const rateLimit = await checkUserRateLimit(data.reporterId);
  if (!rateLimit.allowed) {
    throw new Error('Rate limit reached: You can submit at most 5 listings per 24 hours.');
  }

  const tempId = data.id || ('civic-' + Date.now());
  const ticketNumber = data.ticketNumber || (`BLR-2026-${Math.floor(1000 + Math.random() * 9000)}`);

  // 2. Upload Photos (max 3)
  const photosToProcess = data.photoFiles.slice(0, 3);
  const photoUrls: string[] = [];
  for (let i = 0; i < photosToProcess.length; i++) {
    const uploadedUrl = await uploadListingPhoto(photosToProcess[i], tempId, i);
    photoUrls.push(uploadedUrl);
  }

  const effectivePhotos = photoUrls.length > 0 ? photoUrls : [getAssetUrl('issues/garbage.jpg')];

  const newListing: FirestoreListing = {
    id: tempId,
    ticketNumber,
    title: data.title.trim() || `${data.category} issue at ${data.address.split(',')[0]}`,
    category: data.category,
    description: data.description || 'Reported via Civic Hero citizen community listing.',
    address: data.address,
    ward: data.ward,
    lat: data.lat,
    lng: data.lng,
    severity: data.severity,
    photos: effectivePhotos,
    reporterId: data.reporterId,
    reporterName: data.reporterName,
    reporterPhone: data.reporterPhone,
    includeReporterContact: data.includeReporterContact ?? true,
    status: 'Submitted',
    upvotes: 1,
    confirmedBy: [data.reporterId],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    resolvedPhotoUrl: null,
    flagged: false,
    mergedCount: 0,
    targetResolutionHours: data.severity === 'Critical' ? 4 : data.severity === 'High' ? 12 : 24,
    voiceNoteTranscription: data.voiceNoteTranscription,
    timeline: [
      {
        id: 't-' + Date.now(),
        status: 'Submitted',
        timestamp: 'Just now',
        title: 'Report Submitted & Published to Ward',
        description: `Citizen listing published to ${data.ward}. Priority: ${data.severity}.`,
        actor: data.reporterName,
      },
    ],
  };

  recordListingCreation(data.reporterId);

  // 3. Persist to Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'listings', tempId);
      await setDoc(docRef, {
        ...newListing,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      newListing.id = tempId;
    } catch (err) {
      console.warn('Firestore setDoc failed, writing to persistent local store:', err);
      newListing.id = tempId;
    }
  } else {
    newListing.id = tempId;
  }

  // Always keep persistent local cache updated
  const local = loadLocalListings();
  saveLocalListings([newListing, ...local.filter((l) => l.id !== tempId)]);

  return mapListingToCivicIssue(newListing, data.reporterId);
};

// Toggle Upvote / "I'm facing this too"
export const toggleUpvoteListingDocument = async (
  listingId: string,
  userId: string
): Promise<{ nextUpvoted: boolean; newCount: number }> => {
  const localListings = loadLocalListings();
  const listing = localListings.find((l) => l.id === listingId);
  const alreadyUpvoted = listing ? listing.confirmedBy?.includes(userId) : false;
  const nextUpvoted = !alreadyUpvoted;

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'listings', listingId);
      await updateDoc(docRef, {
        upvotes: increment(nextUpvoted ? 1 : -1),
        confirmedBy: nextUpvoted ? arrayUnion(userId) : arrayRemove(userId),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore updateDoc upvote error:', err);
    }
  }

  // Update local storage
  const updated = localListings.map((l) => {
    if (l.id === listingId) {
      const conf = l.confirmedBy || [];
      const newConfirmed = nextUpvoted ? [...conf, userId] : conf.filter((id) => id !== userId);
      const newCount = Math.max(0, (l.upvotes || 0) + (nextUpvoted ? 1 : -1));
      return {
        ...l,
        upvotes: newCount,
        confirmedBy: newConfirmed,
        updatedAt: Date.now(),
      };
    }
    return l;
  });

  saveLocalListings(updated);
  const currentListing = updated.find((l) => l.id === listingId);
  return { nextUpvoted, newCount: currentListing ? currentListing.upvotes : 1 };
};

// Flag Listing as Spam
export const flagListingDocument = async (listingId: string): Promise<void> => {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'listings', listingId);
      await updateDoc(docRef, {
        flagged: true,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore flag listing error:', err);
    }
  }

  const localListings = loadLocalListings();
  const updated = localListings.map((l) => (l.id === listingId ? { ...l, flagged: true, updatedAt: Date.now() } : l));
  saveLocalListings(updated);
};

// Merge Duplicate Report
export const mergeDuplicateListingDocument = async (
  existingListingId: string,
  mergerName: string
): Promise<void> => {
  const newTimelineEvent: TimelineEvent = {
    id: 't-merge-' + Date.now(),
    status: 'Submitted',
    timestamp: 'Just now',
    title: 'Duplicate Report Merged & Boosted',
    description: `${mergerName} merged a matching nearby report (+2 priority score).`,
    actor: mergerName,
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'listings', existingListingId);
      await updateDoc(docRef, {
        upvotes: increment(2),
        mergedCount: increment(1),
        timeline: arrayUnion(newTimelineEvent),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore merge error:', err);
    }
  }

  const localListings = loadLocalListings();
  const updated = localListings.map((l) => {
    if (l.id === existingListingId) {
      return {
        ...l,
        upvotes: (l.upvotes || 0) + 2,
        mergedCount: (l.mergedCount || 0) + 1,
        timeline: [...(l.timeline || []), newTimelineEvent],
        updatedAt: Date.now(),
      };
    }
    return l;
  });
  saveLocalListings(updated);
};

// Assign Field Worker to Listing
export const assignWorkerToListingDocument = async (
  listingId: string,
  workerId: string,
  workerName: string,
  targetHours: number = 24,
  department: string = 'Public Works',
  instructions?: string
): Promise<void> => {
  const newTimelineEvent: TimelineEvent = {
    id: 't-assign-' + Date.now(),
    status: 'In Progress',
    timestamp: 'Just now',
    title: 'Assigned to Field Officer',
    description: `Dispatched to ${workerName} (${department}). Target SLA: ${targetHours} hrs.${
      instructions ? ` Special note: ${instructions}` : ''
    }`,
    actor: 'Municipal Dispatch',
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'listings', listingId);
      await updateDoc(docRef, {
        status: 'In Progress',
        assignedWorkerId: workerId,
        assignedWorkerName: workerName,
        targetResolutionHours: targetHours,
        timeline: arrayUnion(newTimelineEvent),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore assign worker error:', err);
    }
  }

  const localListings = loadLocalListings();
  const updated = localListings.map((l) => {
    if (l.id === listingId) {
      return {
        ...l,
        status: 'In Progress' as IssueStatus,
        assignedWorkerId: workerId,
        assignedWorkerName: workerName,
        targetResolutionHours: targetHours,
        timeline: [...(l.timeline || []), newTimelineEvent],
        updatedAt: Date.now(),
      };
    }
    return l;
  });
  saveLocalListings(updated);
};

// Update Listing Status
export const updateListingStatusDocument = async (
  listingId: string,
  newStatus: IssueStatus,
  remarks?: string,
  actor: string = 'Civic Admin'
): Promise<void> => {
  const newTimelineEvent: TimelineEvent = {
    id: 't-stat-' + Date.now(),
    status: newStatus,
    timestamp: 'Just now',
    title: `Status updated to ${newStatus}`,
    description: remarks || `Status transitioned to ${newStatus}.`,
    actor,
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'listings', listingId);
      await updateDoc(docRef, {
        status: newStatus,
        timeline: arrayUnion(newTimelineEvent),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore update status error:', err);
    }
  }

  const localListings = loadLocalListings();
  const updated = localListings.map((l) => {
    if (l.id === listingId) {
      return {
        ...l,
        status: newStatus,
        timeline: [...(l.timeline || []), newTimelineEvent],
        updatedAt: Date.now(),
      };
    }
    return l;
  });
  saveLocalListings(updated);
};

// Resolve Listing With Proof Photo
export const resolveListingDocument = async (
  listingId: string,
  proofPhoto: File | Blob | string,
  remarks: string = '',
  workerName: string = 'Field Officer'
): Promise<string> => {
  const proofUrl = await uploadListingPhoto(proofPhoto, listingId, 99);

  const newTimelineEvent: TimelineEvent = {
    id: 't-res-' + Date.now(),
    status: 'Resolved',
    timestamp: 'Just now',
    title: 'Work Completed & Photo Verified',
    description: remarks || 'On-ground task concluded with photo proof.',
    actor: workerName,
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'listings', listingId);
      await updateDoc(docRef, {
        status: 'Resolved',
        resolvedPhotoUrl: proofUrl,
        resolutionRemarks: remarks,
        resolvedAt: 'Just now',
        timeline: arrayUnion(newTimelineEvent),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore resolve error:', err);
    }
  }

  const localListings = loadLocalListings();
  const updated = localListings.map((l) => {
    if (l.id === listingId) {
      return {
        ...l,
        status: 'Resolved' as IssueStatus,
        resolvedPhotoUrl: proofUrl,
        resolutionRemarks: remarks,
        resolvedAt: 'Just now',
        timeline: [...(l.timeline || []), newTimelineEvent],
        updatedAt: Date.now(),
      };
    }
    return l;
  });
  saveLocalListings(updated);

  return proofUrl;
};

// Delete Listing Document and its associated photos
export const deleteListingDocument = async (
  listingId: string,
  currentUserId: string,
  isStaff: boolean = false,
  userPhone?: string
): Promise<{ success: boolean; error?: string }> => {
  const localListings = loadLocalListings();
  const listing = localListings.find((l) => l.id === listingId);

  // 1. Authorization check: only original poster or staff can delete
  if (listing && !isStaff) {
    const isIdMatch = listing.reporterId === currentUserId;
    const isPhoneMatch = Boolean(
      userPhone &&
      listing.reporterPhone &&
      normalizePhone(userPhone) === normalizePhone(listing.reporterPhone)
    );
    if (!isIdMatch && !isPhoneMatch) {
      throw new Error('Unauthorized: You can only delete your own reports.');
    }
  }

  // 2. Delete from Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'listings', listingId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore deleteDoc failed:', err);
    }
  }

  // 3. Remove associated photos from Firebase Storage
  if (isFirebaseConfigured && storage) {
    try {
      const folderRef = ref(storage, `listings/${listingId}`);
      const filesList = await listAll(folderRef);
      await Promise.all(filesList.items.map((itemRef) => deleteObject(itemRef)));
    } catch (err) {
      console.warn('Firebase Storage delete photos failed:', err);
    }
  }

  // 4. Remove from local store and emit real-time event to all subscribers
  const remaining = localListings.filter((l) => l.id !== listingId);
  saveLocalListings(remaining);

  return { success: true };
};
