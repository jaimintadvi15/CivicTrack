import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CivicIssue,
  FieldWorker,
  UserProfile,
  LeaderboardEntry,
  NotificationItem,
  SupportedLanguage,
  UserRole,
  IssueStatus,
  IssueCategory,
  IssueSeverity,
  AuthSession,
  Badge,
} from '../types';
import {
  initialIssues,
  initialFieldWorkers,
  initialCurrentUser,
  initialLeaderboard,
  preProvisionedUsers,
} from '../data/mockData';
import { translations, TranslationStrings } from '../i18n/translations';
import confetti from 'canvas-confetti';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { normalizePhone } from '../utils/ownership';
import {
  subscribeToListings,
  createListingDocument,
  toggleUpvoteListingDocument,
  flagListingDocument,
  deleteListingDocument,
  mergeDuplicateListingDocument,
  assignWorkerToListingDocument,
  updateListingStatusDocument,
  resolveListingDocument,
} from '../services/listingsService';

interface ToastData {
  id: string;
  title: string;
  message: string;
  xp?: number;
  badge?: string;
  type: 'xp' | 'success' | 'info' | 'badge';
}

const AUTH_STORAGE_KEY = 'civic_hero_auth_session';
const PROFILES_STORAGE_KEY = 'civic_hero_user_profiles_v1';

interface SavedProfile {
  userId: string;
  name: string;
  ward: string;
  points?: number;
}

const getSavedProfile = (phone: string): SavedProfile | null => {
  try {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    const key = normalizePhone(phone);
    return map[key] || null;
  } catch {
    return null;
  }
};

const saveUserProfile = (phone: string, profile: SavedProfile) => {
  try {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const key = normalizePhone(phone);
    map[key] = profile;
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to persist user profile:', e);
  }
};

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  session: AuthSession | null;
  isAuthenticated: boolean;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: TranslationStrings;
  issues: CivicIssue[];
  currentUser: UserProfile;
  fieldWorkers: FieldWorker[];
  leaderboard: LeaderboardEntry[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  toasts: ToastData[];
  selectedIssueForTracking: CivicIssue | null;
  setSelectedIssueForTracking: (issue: CivicIssue | null) => void;
  isReportModalOpen: boolean;
  setIsReportModalOpen: (open: boolean) => void;
  
  // Auth Actions
  loginWithPhone: (
    phone: string,
    otp: string,
    inviteCode?: string
  ) => { success: boolean; isNewUser: boolean; role: UserRole; error?: string };
  completeCitizenOnboarding: (name: string, ward: string) => void;
  quickDemoLogin: (role: UserRole) => void;
  logout: () => void;

  // Actions
  createReport: (data: {
    title: string;
    category: IssueCategory;
    customCategory?: string;
    severity: IssueSeverity;
    description: string;
    photoUrl: string;
    photos?: string[];
    photoFiles?: (File | Blob | string)[];
    voiceNoteTranscription?: string;
    includeReporterContact?: boolean;
    location: {
      address: string;
      ward: string;
      city: string;
      lat: number;
      lng: number;
    };
  }) => CivicIssue;
  mergeReport: (existingIssueId: string) => void;
  upvoteReport: (issueId: string) => void;
  flagReport: (issueId: string) => Promise<void>;
  deleteReport: (issueId: string) => Promise<{ success: boolean; error?: string }>;
  assignWorker: (issueId: string, workerId: string, targetHours: number, instructions?: string) => void;
  updateIssueStatus: (issueId: string, newStatus: IssueStatus, remarks?: string) => void;
  resolveIssueWithProof: (issueId: string, afterPhotoUrl: string, remarks: string) => void;
  markNotificationsAsRead: () => void;
  dismissToast: (id: string) => void;
  triggerCelebration: () => void;
  celebratingBadge: Badge | null;
  setCelebratingBadge: (badge: Badge | null) => void;
  celebrateBadge: (badge: Badge) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load session from localStorage if available
  const [session, setSession] = useState<AuthSession | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [role, setRole] = useState<UserRole>(session ? session.role : 'citizen');
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [issues, setIssues] = useState<CivicIssue[]>(initialIssues);
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    if (session && session.role === 'citizen') {
      return {
        ...initialCurrentUser,
        id: session.userId || initialCurrentUser.id,
        name: session.name || initialCurrentUser.name,
        phone: session.phone || initialCurrentUser.phone,
        ward: session.ward || initialCurrentUser.ward,
      };
    }
    return initialCurrentUser;
  });
  const [fieldWorkers, setFieldWorkers] = useState<FieldWorker[]>(initialFieldWorkers);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(initialLeaderboard);
  const [selectedIssueForTracking, setSelectedIssueForTracking] = useState<CivicIssue | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Report In Progress',
      message: 'Officer Ramesh Kumar has been dispatched to 100ft Road pothole.',
      type: 'worker',
      timestamp: '30 mins ago',
      read: false,
      issueId: 'civic-101',
    },
    {
      id: 'notif-2',
      title: 'Issue Resolved & +50 XP Awarded!',
      message: 'Garbage pile near Defense Colony park has been successfully cleaned.',
      type: 'xp',
      timestamp: '3 hours ago',
      read: false,
      issueId: 'civic-102',
      xpEarned: 50,
    },
    {
      id: 'notif-3',
      title: 'New Badge Unlocked: Pothole Patrol!',
      message: 'You have protected fellow citizens by reporting 3 potholes.',
      type: 'badge',
      timestamp: '2 days ago',
      read: true,
    }
  ]);

  const t = translations[language];

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  // Real-time subscription to persistent Firestore listings
  useEffect(() => {
    const unsubscribe = subscribeToListings((liveIssues) => {
      setIssues(liveIssues);
    }, session?.userId || currentUser.id);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [session?.userId, currentUser.id]);

  // Sync Firebase Auth UID with session if phone auth completes
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser && session && session.userId !== firebaseUser.uid) {
          const updatedSession = { ...session, userId: firebaseUser.uid };
          setSession(updatedSession);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedSession));
          setCurrentUser((prev) => ({ ...prev, id: firebaseUser.uid }));
        }
      });
      return () => unsubscribe();
    }
  }, [session?.phone]);

  const addToast = (toast: Omit<ToastData, 'id'>) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const [celebratingBadge, setCelebratingBadge] = useState<Badge | null>(null);

  const triggerCelebration = () => {
    try {
      // Primary celebratory burst using signature Google brand palette
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#F59E0B'],
      });

      // Secondary golden stars/shimmer cascade from sides
      setTimeout(() => {
        try {
          confetti({
            particleCount: 45,
            angle: 60,
            spread: 55,
            origin: { x: 0.15, y: 0.65 },
            colors: ['#FBBC05', '#F59E0B', '#FFFFFF', '#4285F4'],
          });
          confetti({
            particleCount: 45,
            angle: 120,
            spread: 55,
            origin: { x: 0.85, y: 0.65 },
            colors: ['#FBBC05', '#F59E0B', '#FFFFFF', '#34A853'],
          });
        } catch {
          // ignore
        }
      }, 180);
    } catch {
      // fallback
    }
  };

  const celebrateBadge = (badge: Badge) => {
    setCelebratingBadge(badge);
    triggerCelebration();
  };

  // Login method
  const loginWithPhone = (
    phone: string,
    otp: string,
    inviteCode?: string
  ): { success: boolean; isNewUser: boolean; role: UserRole; error?: string } => {
    const cleanedOtp = otp.trim();
    if (cleanedOtp.length < 4) {
      return { success: false, isNewUser: false, role: 'citizen', error: 'Please enter a valid 6-digit OTP' };
    }

    const normalizedInput = normalizePhone(phone);
    const savedProfile = getSavedProfile(normalizedInput);

    // Find in pre-provisioned directory
    const matched = preProvisionedUsers.find(
      (u) => normalizePhone(u.phone) === normalizedInput
    );

    let assignedRole: UserRole = 'citizen';
    let userName = savedProfile?.name || 'Citizen Hero';
    let userWard = savedProfile?.ward || 'Ward 4 - Indiranagar';
    let userDept = '';
    let workerId = '';
    let avatar = '';
    let isNewUser = false;

    if (matched) {
      assignedRole = matched.role;
      userName = matched.name;
      userWard = matched.ward || 'Ward 4 - Indiranagar';
      userDept = matched.department || '';
      workerId = matched.workerId || '';
      avatar = matched.avatar || '';
      isNewUser = false;
    } else {
      // Check if user entered invite code
      const code = inviteCode?.trim().toUpperCase();
      if (code === 'MUNI-STAFF-2026') {
        assignedRole = 'municipal';
        userName = 'Municipal Officer';
        userDept = 'BBMP Municipal Administration';
        userWard = 'Citywide Admin HQ';
      } else if (code === 'WORKER-FIELD-2026') {
        assignedRole = 'worker';
        userName = 'Field Operative';
        userDept = 'Public Works Dept';
        userWard = 'Ward 4 - Indiranagar';
        workerId = 'worker-1';
      } else {
        // Default role for anyone signing up without a special code/invite: Citizen
        assignedRole = 'citizen';
        isNewUser = !savedProfile;
      }
    }

    // Stable deterministic User ID: persists identically across all logins for the same phone number
    const stableUserId =
      savedProfile?.userId ||
      (auth?.currentUser?.uid
        ? auth.currentUser.uid
        : matched
        ? `user-${normalizePhone(matched.phone)}`
        : `user-${normalizedInput}`);

    const newSession: AuthSession = {
      userId: stableUserId,
      name: userName,
      phone: phone.startsWith('+91') ? phone : `+91 ${phone}`,
      role: assignedRole,
      department: userDept,
      ward: userWard,
      workerId: workerId,
      avatar: avatar,
      isFirstLogin: isNewUser,
    };

    setSession(newSession);
    setRole(assignedRole);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newSession));

    if (assignedRole === 'citizen') {
      saveUserProfile(newSession.phone, {
        userId: stableUserId,
        name: userName,
        ward: userWard,
      });

      setCurrentUser((prev) => ({
        ...prev,
        id: stableUserId,
        name: userName,
        phone: newSession.phone,
        ward: userWard,
        points: savedProfile?.points !== undefined ? savedProfile.points : prev.points,
      }));
    }

    addToast({
      title: `Signed In as ${assignedRole === 'municipal' ? 'Municipal Staff' : assignedRole === 'worker' ? 'Field Worker' : 'Citizen'}`,
      message: `Welcome, ${userName}!`,
      type: 'info',
    });

    return {
      success: true,
      isNewUser,
      role: assignedRole,
    };
  };

  // Onboarding completion for new citizen
  const completeCitizenOnboarding = (name: string, ward: string) => {
    if (!session) return;
    const finalName = name.trim() || 'Citizen Hero';
    const finalWard = ward || 'Ward 4 - Indiranagar';

    const updatedSession: AuthSession = {
      ...session,
      name: finalName,
      ward: finalWard,
      isFirstLogin: false,
    };
    setSession(updatedSession);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedSession));

    saveUserProfile(session.phone, {
      userId: session.userId,
      name: finalName,
      ward: finalWard,
      points: currentUser.points + 50,
    });

    setCurrentUser((prev) => ({
      ...prev,
      id: session.userId,
      name: finalName,
      ward: finalWard,
      points: prev.points + 50,
    }));

    addPoints(50, 'Welcome Bonus');
    addToast({
      title: 'Profile Created! +50 XP 🌟',
      message: `Welcome to Civic Hero, ${finalName}!`,
      type: 'success',
    });
    triggerCelebration();
  };

  // Quick 1-tap demo login
  const quickDemoLogin = (targetRole: UserRole) => {
    if (targetRole === 'citizen') {
      loginWithPhone('+91 98765 43210', '123456');
    } else if (targetRole === 'municipal') {
      loginWithPhone('+91 91234 56789', '123456');
    } else if (targetRole === 'worker') {
      loginWithPhone('+91 98450 11223', '123456');
    }
  };

  // Logout method
  const logout = () => {
    if (isFirebaseConfigured && auth) {
      auth.signOut().catch(console.warn);
    }
    setSession(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setCurrentUser(initialCurrentUser);
    addToast({
      title: 'Logged Out',
      message: 'You have been safely signed out.',
      type: 'info',
    });
  };

  // Add Points to Active User & Check Level Up
  const addPoints = (pointsToAdd: number, _reason?: string) => {
    setCurrentUser((prev) => {
      const newPoints = prev.points + pointsToAdd;
      let newLevel = prev.level;
      let newLevelName = prev.levelName;
      let nextPoints = prev.nextLevelPoints;

      if (newPoints >= 500 && prev.level < 4) {
        newLevel = 4;
        newLevelName = 'City Champion';
        nextPoints = 1000;
        addToast({
          title: 'LEVEL UP! 🌟',
          message: 'Congratulations! You are now a Level 4 City Champion!',
          type: 'badge',
        });
        triggerCelebration();
      } else if (newPoints >= 300 && prev.level < 3) {
        newLevel = 3;
        newLevelName = 'Ward Guardian';
        nextPoints = 500;
      }

      return {
        ...prev,
        points: newPoints,
        level: newLevel,
        levelName: newLevelName,
        nextLevelPoints: nextPoints,
      };
    });

    // Update leaderboard entry for current user
    setLeaderboard((prev) =>
      prev.map((entry) =>
        entry.isCurrentUser
          ? { ...entry, points: entry.points + pointsToAdd }
          : entry
      ).sort((a, b) => b.points - a.points).map((entry, index) => ({ ...entry, rank: index + 1 }))
    );
  };

  // Create a new civic issue report (with Firestore / Storage persistence)
  const createReport = (data: {
    title: string;
    category: IssueCategory;
    customCategory?: string;
    severity: IssueSeverity;
    description: string;
    photoUrl: string;
    photos?: string[];
    photoFiles?: (File | Blob | string)[];
    voiceNoteTranscription?: string;
    includeReporterContact?: boolean;
    location: {
      address: string;
      ward: string;
      city: string;
      lat: number;
      lng: number;
    };
  }): CivicIssue => {
    const tempId = 'civic-' + Date.now();
    const newTicket = `BLR-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const effectiveCategory = data.category === 'Other' && data.customCategory ? 'Other' : data.category;
    const effectiveTitle = data.title.trim() || `${data.category === 'Other' && data.customCategory ? data.customCategory : data.category} near ${data.location.address.split(',')[0]}`;
    const photosList = data.photos && data.photos.length > 0 ? data.photos : [data.photoUrl];

    const optimisticIssue: CivicIssue = {
      id: tempId,
      ticketNumber: newTicket,
      title: effectiveTitle,
      category: effectiveCategory,
      customCategory: data.customCategory,
      severity: data.severity,
      status: 'Submitted',
      description: data.description || 'Reported via Civic Hero citizen community listing.',
      location: data.location,
      photoUrl: data.photoUrl,
      photos: photosList,
      voiceNoteTranscription: data.voiceNoteTranscription,
      includeReporterContact: data.includeReporterContact ?? true,
      reporterPhone: session?.phone || currentUser.phone,
      createdAt: 'Just now',
      updatedAt: 'Just now',
      timeline: [
        {
          id: 't-now-' + Date.now(),
          status: 'Submitted',
          timestamp: 'Just now',
          title: 'Report Submitted & Published to Ward',
          description: `Citizen listing published to ${data.location.ward}. Priority: ${data.severity}.`,
          actor: currentUser.name,
        },
      ],
      upvotes: 1,
      hasUpvoted: true,
      mergedCount: 0,
      targetResolutionHours: data.severity === 'Critical' ? 4 : data.severity === 'High' ? 12 : 24,
      citizenId: currentUser.id,
      citizenName: currentUser.name,
    };

    // Optimistic UI state
    setIssues((prev) => [optimisticIssue, ...prev]);

    // Asynchronous backend persistence with Firebase Storage & Firestore
    const filesToUpload = data.photoFiles && data.photoFiles.length > 0 ? data.photoFiles : photosList;
    createListingDocument({
      title: effectiveTitle,
      category: effectiveCategory,
      customCategory: data.customCategory,
      severity: data.severity,
      description: data.description || 'Reported via Civic Hero citizen community listing.',
      photoFiles: filesToUpload,
      address: data.location.address,
      ward: data.location.ward,
      lat: data.location.lat,
      lng: data.location.lng,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      reporterPhone: session?.phone || currentUser.phone,
      includeReporterContact: data.includeReporterContact ?? true,
      voiceNoteTranscription: data.voiceNoteTranscription,
    }).catch((err) => {
      console.error('Failed to persist listing:', err);
      if (err.message && err.message.includes('Rate limit')) {
        addToast({
          title: 'Rate Limit Reached ⚠️',
          message: 'You can submit at most 5 listings per 24 hours.',
          type: 'info',
        });
      }
    });

    // Update user stats
    setCurrentUser((prev) => ({
      ...prev,
      reportsSubmitted: prev.reportsSubmitted + 1,
    }));

    // Award +25 XP
    addPoints(25, 'Report Submitted');
    addToast({
      title: '+25 XP Earned! 🚀',
      message: 'Thank you for reporting! Your ward is safer and cleaner.',
      xp: 25,
      type: 'xp',
    });
    triggerCelebration();

    // Add notification
    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: 'Report Submitted Successfully',
        message: `Ticket #${newTicket} has been routed to Municipal Command Center.`,
        type: 'status',
        timestamp: 'Just now',
        read: false,
        issueId: tempId,
      },
      ...prev,
    ]);

    return optimisticIssue;
  };

  // Merge report into existing nearby complaint
  const mergeReport = (existingIssueId: string) => {
    mergeDuplicateListingDocument(existingIssueId, currentUser.name).catch(console.error);

    setIssues((prev) =>
      prev.map((issue) => {
        if (issue.id === existingIssueId) {
          return {
            ...issue,
            upvotes: issue.upvotes + 2,
            mergedCount: issue.mergedCount + 1,
            timeline: [
              ...issue.timeline,
              {
                id: 't-merge-' + Date.now(),
                status: issue.status,
                timestamp: 'Just now',
                title: 'Duplicate Report Merged & Boosted',
                description: `${currentUser.name} merged a matching nearby report (+2 priority score).`,
                actor: currentUser.name,
              },
            ],
          };
        }
        return issue;
      })
    );

    addPoints(15, 'Duplicate Merged');
    addToast({
      title: '+15 XP Earned! 🤝',
      message: 'Report merged! Boosted issue resolution priority for your ward.',
      xp: 15,
      type: 'xp',
    });
    triggerCelebration();
  };

  // Upvote an issue / "I'm facing this too"
  const upvoteReport = (issueId: string) => {
    toggleUpvoteListingDocument(issueId, session?.userId || currentUser.id).then(({ nextUpvoted }) => {
      if (nextUpvoted) {
        addPoints(5, 'Upvoted Community Issue');
        addToast({
          title: '+5 XP Earned! 👍',
          message: 'You supported a community issue in your ward.',
          xp: 5,
          type: 'xp',
        });
      }
    }).catch(console.error);

    setIssues((prev) =>
      prev.map((issue) => {
        if (issue.id === issueId) {
          const nextUpvoted = !issue.hasUpvoted;
          return {
            ...issue,
            upvotes: nextUpvoted ? issue.upvotes + 1 : Math.max(0, issue.upvotes - 1),
            hasUpvoted: nextUpvoted,
          };
        }
        return issue;
      })
    );
  };

  // Flag listing as spam (excluded from public feed)
  const flagReport = async (issueId: string): Promise<void> => {
    try {
      await flagListingDocument(issueId);
      setIssues((prev) => prev.filter((i) => i.id !== issueId));
      addToast({
        title: 'Listing Flagged 🚩',
        message: 'Thank you for reporting. This listing has been hidden from the public feed pending review.',
        type: 'info',
      });
    } catch (e) {
      console.error('Error flagging report:', e);
    }
  };

  // Delete listing report (Author or Municipal Staff)
  const deleteReport = async (issueId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const activeUserId = session?.userId || currentUser.id;
      const isStaff = role === 'municipal';
      const userPhone = session?.phone || currentUser.phone;
      await deleteListingDocument(issueId, activeUserId, isStaff, userPhone);

      setIssues((prev) => prev.filter((i) => i.id !== issueId));

      if (selectedIssueForTracking?.id === issueId) {
        setSelectedIssueForTracking(null);
      }

      addToast({
        title: 'Report Deleted 🗑️',
        message: 'Your listing has been permanently deleted.',
        type: 'info',
      });

      return { success: true };
    } catch (err: any) {
      console.error('Failed to delete report:', err);
      addToast({
        title: 'Delete Failed ⚠️',
        message: err.message || 'Could not delete this report.',
        type: 'info',
      });
      return { success: false, error: err.message };
    }
  };

  // Assign worker from Municipal Dashboard
  const assignWorker = (
    issueId: string,
    workerId: string,
    targetHours: number,
    instructions?: string
  ) => {
    const worker = fieldWorkers.find((w) => w.id === workerId);
    if (!worker) return;

    assignWorkerToListingDocument(issueId, worker.id, worker.name, targetHours).catch(console.error);

    setIssues((prev) =>
      prev.map((issue) => {
        if (issue.id === issueId) {
          return {
            ...issue,
            status: 'In Progress',
            assignedWorkerId: worker.id,
            assignedWorkerName: worker.name,
            assignedAt: 'Just now',
            targetResolutionHours: targetHours,
            timeline: [
              ...issue.timeline,
              {
                id: 't-assign-' + Date.now(),
                status: 'In Progress',
                timestamp: 'Just now',
                title: 'Assigned to Field Officer',
                description: `Dispatched to ${worker.name} (${worker.department}). Target SLA: ${targetHours} hrs.${
                  instructions ? ` Special note: ${instructions}` : ''
                }`,
                actor: 'Municipal Dispatch',
              },
            ],
          };
        }
        return issue;
      })
    );

    // Update worker task count
    setFieldWorkers((prev) =>
      prev.map((w) =>
        w.id === workerId ? { ...w, activeTasksCount: w.activeTasksCount + 1 } : w
      )
    );

    addToast({
      title: 'Worker Assigned & Dispatched 👷‍♂️',
      message: `Task routed to ${worker.name}. Citizen notified.`,
      type: 'success',
    });
  };

  // Update Status
  const updateIssueStatus = (issueId: string, newStatus: IssueStatus, remarks?: string) => {
    updateListingStatusDocument(issueId, newStatus, remarks).catch(console.error);

    setIssues((prev) =>
      prev.map((issue) => {
        if (issue.id === issueId) {
          return {
            ...issue,
            status: newStatus,
            timeline: [
              ...issue.timeline,
              {
                id: 't-stat-' + Date.now(),
                status: newStatus,
                timestamp: 'Just now',
                title: `Status updated to ${newStatus}`,
                description: remarks || `Status transitioned to ${newStatus}.`,
                actor: 'Civic Admin',
              },
            ],
          };
        }
        return issue;
      })
    );
  };

  // Resolve Task With Proof (Field Worker)
  const resolveIssueWithProof = (
    issueId: string,
    afterPhotoUrl: string,
    remarks: string
  ) => {
    resolveListingDocument(issueId, afterPhotoUrl, remarks).catch(console.error);

    setIssues((prev) =>
      prev.map((issue) => {
        if (issue.id === issueId) {
          return {
            ...issue,
            status: 'Resolved',
            afterPhotoUrl,
            resolutionRemarks: remarks,
            resolvedAt: 'Just now',
            timeline: [
              ...issue.timeline,
              {
                id: 't-res-' + Date.now(),
                status: 'Resolved',
                timestamp: 'Just now',
                title: 'Resolution Completed & Verified',
                description: remarks || 'Work completed on site with after-photo verification.',
                actor: issue.assignedWorkerName || 'Field Officer',
              },
            ],
          };
        }
        return issue;
      })
    );

    // Award bonus XP to the reporting citizen
    addPoints(50, 'Issue Resolved Bonus');
    addToast({
      title: 'Task Resolved & +50 Bonus XP! 🎉',
      message: 'Resolution proof recorded and citizen report closed successfully.',
      xp: 50,
      type: 'success',
    });
    triggerCelebration();

    // Notify citizen
    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: 'Issue Resolved with Photo Proof!',
        message: 'Your reported issue has been repaired. View before & after photos now.',
        type: 'xp',
        timestamp: 'Just now',
        read: false,
        issueId,
        xpEarned: 50,
      },
      ...prev,
    ]);
  };

  const markNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Sync selected issue if state changes
  useEffect(() => {
    if (selectedIssueForTracking) {
      const updated = issues.find((i) => i.id === selectedIssueForTracking.id);
      if (updated) {
        setSelectedIssueForTracking(updated);
      }
    }
  }, [issues]);

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        session,
        isAuthenticated: !!session,
        language,
        setLanguage,
        t,
        issues,
        currentUser,
        fieldWorkers,
        leaderboard,
        notifications,
        unreadNotificationCount,
        toasts,
        selectedIssueForTracking,
        setSelectedIssueForTracking,
        isReportModalOpen,
        setIsReportModalOpen,
        loginWithPhone,
        completeCitizenOnboarding,
        quickDemoLogin,
        logout,
        createReport,
        mergeReport,
        upvoteReport,
        flagReport,
        deleteReport,
        assignWorker,
        updateIssueStatus,
        resolveIssueWithProof,
        markNotificationsAsRead,
        dismissToast,
        triggerCelebration,
        celebratingBadge,
        setCelebratingBadge,
        celebrateBadge,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
