"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SignUpForm } from "@/components/auth/signup-form"
import { SignInForm } from "@/components/auth/signin-form"
import { EmailVerification } from "@/components/auth/email-verification"
import { AddParticipantView } from "../components/add-participant-view"
import { AddBuildingView } from "../components/add-building-view"
import { Dashboard } from "../components/dashboard"
import { AnimatedDashboard } from "../components/dashboard/AnimatedDashboard"
import { ParticipantLogin } from "../components/participant-login"
import { RoleDashboard } from "../components/role-dashboard"
import { SimpleRegistration } from "../components/onboarding/SimpleRegistration"
import { ProductTour } from "../components/tour/ProductTour"
import { VerificationBanner } from "../components/auth/VerificationBanner"
import { AnimatedLandingPage } from "../components/landing/AnimatedLandingPage"
import { useParticipants, useBuildings } from "@/hooks/useDatabase"
import { useAuth } from "@/hooks/useAuth"

import { supabase } from "@/lib/supabase"
import { useRouter } from 'next/navigation';
import { BroilerCalculator } from "../components/calculator/broiler-calculator"
import type { Building } from "@/hooks/useDatabase";
import { sessionManager, type ParticipantSession } from "@/lib/session";
import { SessionTimeoutWarning } from "@/components/session-timeout-warning";
import { ProductionInputStaffDashboard } from "../components/WorkerDashboard/ProductionInputStaffDashboard";
import { useIsMobile } from "@/hooks/calculator/use-mobile";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { CACHE_BUSTER } from "@/lib/cache-buster";
import { CacheClearButton } from "@/components/CacheClearButton";

type ViewType = 
  | "landing" 
  | "signin" 
  | "signup" 
  | "email-verification"
  | "dashboard"
  | "participant-login"
  | "participant-dashboard"
  | "add-participant" 
  | "add-building"
  | "congratulations"

const authenticateParticipant = async (code: string) => {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('code', code)
      .single()

    if (error || !data) {
      return null
    }

    return data
  } catch (error) {
    return null
  }
}

export default function HomePage() {
  // Register service worker for PWA and initialize cache buster
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => {
          // Service worker registered successfully
        })
        .catch(() => {
          // Service worker registration failed
        });
    }
    
    // Initialize cache buster
    CACHE_BUSTER.checkForUpdates();
  }, []);

  const isMobile = useIsMobile();
  const [isClient, setIsClient] = useState(false)
  const [currentView, setCurrentView] = useState<ViewType>("landing")
  const [editingParticipant, setEditingParticipant] = useState<any | null>(null)
  const [editingBuilding, setEditingBuilding] = useState<any | null>(null)
  const [isNewAccount, setIsNewAccount] = useState(true)
  const [isNewUser, setIsNewUser] = useState(false)
  const [isFromSignIn, setIsFromSignIn] = useState(false)
  const [isManualNavigation, setIsManualNavigation] = useState(false)
  const [userManuallyNavigatedToLanding, setUserManuallyNavigatedToLanding] = useState(false)
  const [newParticipantName, setNewParticipantName] = useState("")
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [signOutMessage, setSignOutMessage] = useState("")
  const [currentParticipant, setCurrentParticipant] = useState<ParticipantSession | null>(null)
  const [viewingBuilding, setViewingBuilding] = useState<Building | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingsWithPerformance, setBuildingsWithPerformance] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [farmId, setFarmId] = useState<string>("");

  // Handler to open calculator modal for a building
  const handleInputBuilding = (building: Building) => {
    setViewingBuilding(building);
  };

  // Set client flag to prevent SSR issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  const { user, loading: authLoading, authError, signOut } = useAuth();
  
  // Check for email verification redirect  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check URL hash first (Supabase auth redirect)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const searchParams = new URLSearchParams(window.location.search)
      
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type') || searchParams.get('type')
      const verified = searchParams.get('verified')
      
      // If user just verified their email via link
      if ((accessToken && type === 'signup') || (verified === 'true' && type === 'signup')) {
        setIsNewUser(true) // This will trigger the product tour
        setCurrentView("dashboard")
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
      }
      
      // If user is signed in and on landing page, redirect to dashboard
      if (user && currentView === "landing") {
        setCurrentView("dashboard")
      }
    }
  }, [user, currentView])
  
  // Fetch farm ID for authenticated user
  useEffect(() => {
    const fetchFarmId = async () => {
      if (user?.id) {
        try {
          const { data: farmData, error } = await supabase
            .from('farms')
            .select('id')
            .eq('owner_id', user.id)
            .single()
          
          if (farmData) {
            setFarmId(farmData.id)
          } else {
            
            // Create a farm for this user if none exists
            const { data: newFarmData, error: createError } = await supabase
              .from('farms')
              .insert([{
                name: 'My Farm',
                owner_id: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }])
              .select()
              .single()
            
            if (createError) {
              // Try to get any existing farm for this user as fallback
              const { data: existingFarm } = await supabase
                .from('farms')
                .select('id')
                .eq('owner_id', user.id)
                .maybeSingle()
              
              if (existingFarm) {
                setFarmId(existingFarm.id)
              } else {
                setFarmId("")
              }
            } else if (newFarmData) {
              setFarmId(newFarmData.id)
            }
          }
        } catch (error) {
          setFarmId("")
        }
      } else if (currentParticipant && currentParticipant.farm_id) {
        // For participant sessions, use the farm_id from the session
        setFarmId(currentParticipant.farm_id)
      } else {
        setFarmId("")
      }
    }

    fetchFarmId()
  }, [user, currentParticipant])


  
  // Validate farm ID whenever it changes
  useEffect(() => {
    const validateFarmId = async () => {
      if (farmId && farmId.trim() !== '') {
        try {
          const { data: farmExists, error } = await supabase
            .from('farms')
            .select('id')
            .eq('id', farmId)
            .single()

          if (error || !farmExists) {
            setFarmId(""); // Reset to trigger re-fetch
          }
        } catch (error) {
          setFarmId(""); // Reset to trigger re-fetch
        }
      }
    };

    validateFarmId();
  }, [farmId]);

  const { 
    participants, 
    loading: participantsLoading, 
    addParticipant, 
    updateParticipant, 
    deleteParticipant 
  } = useParticipants(farmId);

  const { 
    buildings: fetchedBuildings, 
    loading: buildingsLoading, 
    addBuilding, 
    updateBuilding, 
    deleteBuilding 
  } = useBuildings(farmId)





  // Simple verification status - only calculate once when data is ready
  const [verificationChecked, setVerificationChecked] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [hasData, setHasData] = useState(false)

  // Check verification status once when data is ready
  useEffect(() => {
    if (user && !participantsLoading && !buildingsLoading && !verificationChecked) {
      const emailVerified = !!user.email_confirmed_at
      const userHasData = participants.length > 0 || fetchedBuildings.length > 0
      
      setIsEmailVerified(emailVerified)
      setHasData(userHasData)
      setVerificationChecked(true)
      
      // Set isNewUser based on data - simple logic like August 15th
      setIsNewUser(!userHasData)
    }
  }, [user, participants.length, fetchedBuildings.length, participantsLoading, buildingsLoading, verificationChecked])

  // Update new account status
  useEffect(() => {
    setIsNewAccount(participants.length === 0 && fetchedBuildings.length === 0)
  }, [participants, fetchedBuildings])

  // Handle authentication state changes
  useEffect(() => {
    // Don't interfere with manual navigation
    if (isManualNavigation) {
      return
    }
    
    if (!authLoading) {
      if (!user) {
        // Allow participant login and dashboard even without admin user
        const allowedViews = ["landing", "signin", "signup", "email-verification", "participant-login", "participant-dashboard"]
        
        if (!allowedViews.includes(currentView)) {
          setCurrentView("landing")
        }
      } else {
        // If user manually navigated to landing, respect that choice
        if (userManuallyNavigatedToLanding && currentView === "landing") {
          return
        }
        
        // Use simple verification status - but don't override manual navigation
        if (verificationChecked) {
          // Only auto-navigate if user is on landing page or dashboard
          if (currentView === "landing" || currentView === "dashboard") {
            if (isEmailVerified) {
              if (hasData) {
                // Verified and has data - go to dashboard
                setIsNewUser(false)
                setCurrentView("dashboard")
              } else {
                // Verified but no data - go to dashboard with tutorial
                setIsNewUser(true)
                setCurrentView("dashboard")
              }
            } else {
              // Email is not verified - show email verification
              setCurrentView("email-verification")
            }
          }
        }
      }
    }
  }, [user, authLoading, currentView, isEmailVerified, hasData, verificationChecked, isManualNavigation, userManuallyNavigatedToLanding])

  // Effect to restore participant session from localStorage on app load
  // Only restore if user is not authenticated as admin
  useEffect(() => {
    if (!user && !authLoading && typeof window !== 'undefined') {
      const session = sessionManager.getSession();
      if (session) {
        setCurrentParticipant(session);
        setCurrentView('participant-dashboard');
      }
    }
  }, [user, authLoading]);

  // Handle email verification redirect
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      // Check for force dashboard parameter
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('forceDashboard') === 'true') {
        setIsNewUser(false)
        setCurrentView("dashboard")
        // Clean up URL
        window.history.replaceState(null, '', window.location.pathname);
        return
      }
      
      // Check if user came back from email verification
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      // Check for access_token in hash (Supabase email verification)
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      
      if (accessToken && type === 'signup') {
        // Clear the hash to clean up the URL
        window.history.replaceState(null, '', window.location.pathname);
        
        // Check if this is a new user who should go to dashboard with tutorial
        const isNewUserAccount = participants.length === 0 && fetchedBuildings.length === 0
        if (isNewUserAccount) {
          setIsNewUser(true)
          setCurrentView("dashboard")
        }
      }
    }
  }, [user, participants, fetchedBuildings]);

  // Reset function
  const handleReset = () => {
    setCurrentView("landing")
    setEditingParticipant(null)
    setEditingBuilding(null)
    setNewParticipantName("")
    setPendingVerificationEmail("")
  }

  // Direct navigation function that bypasses auth state logic
  const navigateToLanding = () => {
    setIsManualNavigation(true)
    setUserManuallyNavigatedToLanding(true)
    setCurrentView("landing")
    // Reset the flag after navigation
    setTimeout(() => {
      setIsManualNavigation(false)
    }, 2000)
  }

  // Authentication handlers
  const handleSignUpSuccess = (userData: any) => {
    setIsNewUser(true)
    setCurrentView("dashboard")
  }

  const handleEmailVerificationNeeded = (email: string) => {
    setPendingVerificationEmail(email)
    setCurrentView("email-verification")
  }

  const handleEmailVerified = async () => {
    // Quick check for data - reduced timeout for faster response
    let attempts = 0
    const maxAttempts = 10 // Reduced from 30
    
    while (attempts < maxAttempts) {
      // If data is still loading, wait a bit more
      if (participantsLoading || buildingsLoading) {
        await new Promise(resolve => setTimeout(resolve, 200)) // Reduced from 500ms
        attempts++
        continue
      }
      
      // Check if we have a valid farmId
      if (!farmId) {
        await new Promise(resolve => setTimeout(resolve, 200)) // Reduced from 500ms
        attempts++
        continue
      }
      
      // Data has finished loading, check the results
      const hasData = participants.length > 0 || fetchedBuildings.length > 0
      
      if (hasData) {
        // Email verified and has data - go to dashboard
        setIsNewUser(false)
        setCurrentView("dashboard")
        return
      } else {
        // Email verified but no data - go to dashboard with tutorial
        setIsNewUser(true)
        setCurrentView("dashboard")
        return
      }
    }
    
    // If we reach here, data loading took too long, go to dashboard with tutorial
    setIsNewUser(true)
    setCurrentView("dashboard")
  }

  const handleSignInSuccess = async (isEmailVerified: boolean) => {
    
    // Set flag that user came from signin
    setIsFromSignIn(true)
    
    if (isEmailVerified) {
      // Email is verified - now check data with loading state
      console.log('Email verified - checking user data...')
      
      // Quick check for data - reduced timeout for faster response
      let attempts = 0
      const maxAttempts = 10 // Reduced from 30
      
      while (attempts < maxAttempts) {
        console.log(`Data loading attempt ${attempts + 1}/${maxAttempts}`)
        console.log('Current data state:', { 
          participantsCount: participants.length, 
          buildingsCount: fetchedBuildings.length,
          participantsLoading,
          buildingsLoading,
          farmId
        })
        
        // If data is still loading, wait a bit more
        if (participantsLoading || buildingsLoading) {
          console.log('Data still loading, waiting...')
          await new Promise(resolve => setTimeout(resolve, 200)) // Reduced from 500ms
          attempts++
          continue
        }
        
        // Check if we have a valid farmId
        if (!farmId) {
          console.log('No farmId yet, waiting...')
          await new Promise(resolve => setTimeout(resolve, 200)) // Reduced from 500ms
          attempts++
          continue
        }
        
        // Data has finished loading, check the results
        const hasData = participants.length > 0 || fetchedBuildings.length > 0
        console.log('Final data check results:', { 
          participantsCount: participants.length, 
          buildingsCount: fetchedBuildings.length,
          farmId,
          hasData 
        })
        
                 if (hasData) {
           // Verified and has data - go to dashboard
           console.log('Email verified and has data - going to dashboard')
           setIsNewUser(false)
           setCurrentView("dashboard")
           return
         } else {
           // Verified but no data - go to dashboard with tutorial
           console.log('Email verified but no data - going to dashboard with tutorial')
           setIsNewUser(true)
           setCurrentView("dashboard")
           return
         }
      }
      
      // If we reach here, data loading took too long, go to dashboard with tutorial
      console.log('Data loading timeout - going to dashboard with tutorial')
      setIsNewUser(true)
      setCurrentView("dashboard")
    } else {
      // Email is not verified - continue from where they left off
      console.log('Email not verified - continuing from where they left off')
      setCurrentView("email-verification")
    }
  }

  const handleSignOut = async () => {
    try {
      setLoading(true);
      setSignOutMessage("Signing out...");

      // Clear all local state
      setCurrentParticipant(null);
      setCurrentView("landing");
      setEditingParticipant(null);
      setEditingBuilding(null);
      setNewParticipantName("");
      setPendingVerificationEmail("");
      setViewingBuilding(null);
      setIsFromSignIn(false);

      // Sign out from Supabase (if admin)
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // Ignore if already signed out or not admin
      }

      // Clear all session data
      if (typeof window !== "undefined") {
        sessionManager.clearSession();
        sessionStorage.clear();
        localStorage.clear();
      }

      setSignOutMessage("Signed out successfully!");

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Sign out error:", error);
      setSignOutMessage("Sign out failed, reloading...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  // Participant handlers
  const handleAddParticipant = () => {
    setCurrentView("add-participant")
  }

  const handleAddParticipantSubmit = async (participant: { name: string; code: string; access_tools: string[] }) => {
    if (!user) {
      alert('Please sign in to add participants')
      return
    }

    console.log('🔧 handleAddParticipant called with:', participant)
    
    const participantData = {
      name: participant.name,
      access_tools: participant.access_tools,
      code: participant.code
    }
    
    console.log('🔧 Inserting participant with data:', participantData)
    
    const result = await addParticipant(participantData)
    
    if (result.success) {
      setNewParticipantName(participant.name)
      setCurrentView("congratulations")
    } else {
      alert(`Error: ${result.error || 'Failed to add participant'}`)
    }
  }

  const handleUpdateParticipant = async (participant: { name: string; code: string; access_tools: string[] }) => {
    if (!editingParticipant || !user) {
      console.log('❌ Update blocked - missing editingParticipant or user:', { editingParticipant, user })
      return
    }
    
    console.log('🔄 Updating participant:', editingParticipant.id)
    console.log('🔄 Update data:', participant)
    console.log('🔄 Access tools to save:', participant.access_tools)
    
    const result = await updateParticipant(editingParticipant.id, {
      name: participant.name,
      access_tools: participant.access_tools,
      code: participant.code
    })
    
    console.log('🔄 Update result:', result)
    
    if (result.success) {
      setEditingParticipant(null)
      setCurrentView("dashboard")
      alert('Participant updated successfully!')
    } else {
      alert(`Error: ${result.error || 'Failed to update participant'}`)
    }
  }

  const handleEditParticipant = (id: number) => {
    const participant = participants.find(p => String(p.id) === String(id)) // Ensure both are strings
    if (participant) {
      setEditingParticipant(participant)
      setCurrentView("add-participant")
    }
  }

  const handleDeleteParticipant = async (id: number) => {
    const participant = participants.find(p => String(p.id) === String(id)) // Ensure both are strings
    if (participant && confirm('Are you sure you want to delete this participant?')) {
      const result = await deleteParticipant(participant.id)
      if (!result.success) {
        alert(`Error: ${result.error || 'Failed to delete participant'}`)
      }
    }
  }

  // Building handlers
  const handleAddBuilding = () => {
    setCurrentView("add-building")
  }

  const handleAddBuildingSubmit = async (building: { building_number: number; name: string; type: string; capacity: number; status: string; cycle_number?: number; cycle_start_date?: string }) => {
    if (!user) {
      alert('Please sign in to add buildings')
      return
    }

    // Validate farm ID before proceeding
    if (!farmId || farmId.trim() === '') {
      alert('No farm available. Please refresh the page and try again.');
      return;
    }

    // Verify farm exists in database
    try {
      const { data: farmExists, error: farmCheckError } = await supabase
        .from('farms')
        .select('id')
        .eq('id', farmId)
        .single()

      if (farmCheckError || !farmExists) {
        alert('Farm not found. Please refresh the page and try again.');
        return;
      }
    } catch (error) {
      alert('Error validating farm. Please refresh the page and try again.');
      return;
    }
    
    // Ensure capacity is a number and has a default value
    const buildingCapacity = typeof building.capacity === 'number' ? building.capacity : 0
    
    const result = await addBuilding(building.name, building.type, buildingCapacity, building.status, building.cycle_number, building.cycle_start_date, building.building_number)
    
    if (result.success && result.data) {
      // Open calculator for the new building
      setViewingBuilding(result.data);
      // Optionally: setCurrentView("dashboard"); // if you want to show dashboard behind modal
    } else {
      // Show specific error message from server
      const errorMessage = result.error || 'Failed to add building';
      alert(`Error: ${errorMessage}`);
    }
  }

  const handleUpdateBuilding = async (building: { name: string; type: string; capacity: number; status: string; cycle_number?: number; cycle_start_date?: string }) => {
    if (!editingBuilding || !user) return
    
    const result = await updateBuilding(editingBuilding.id, {
      name: building.name,
      status: building.status,
      cycle_number: building.cycle_number,
      cycle_start_date: building.cycle_start_date
    })
    
    if (result.success) {
      setEditingBuilding(null)
      setCurrentView("dashboard")
    } else {
      alert(`Error: ${result.error || 'Failed to update building'}`)
    }
  }

  const handleEditBuilding = (id: string) => {
    const building = fetchedBuildings.find(b => b.id === id)
    if (building) {
      setEditingBuilding(building)
      setCurrentView("add-building")
    }
  }

  const handleDeleteBuilding = async (id: string) => {
    if (confirm('Are you sure you want to delete this building?')) {
      const result = await deleteBuilding(id)
      if (!result.success) {
        alert(`Error: ${result.error || 'Failed to delete building'}`)
      }
    }
  }

  const handleViewBuilding = (id: string) => {
    const building = fetchedBuildings.find(b => b.id === id)
    if (building) {
      setViewingBuilding(building)
    }
  }

  // Participant login handler
  const handleParticipantLogin = async (code: string) => {
    try {
      const { data: participant, error } = await supabase
        .from('participants')
        .select('*')
        .eq('code', code.trim())
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          alert('Invalid access code. Please try again.')
        } else {
          alert('Database error. Please contact administrator.')
        }
        return
      }
      
      if (participant) {
        // Create session with proper typing
        const session: Omit<ParticipantSession, 'expiresAt'> = {
          id: participant.id,
          name: participant.name,
          code: participant.code,
          access_tools: participant.access_tools,
          farm_id: participant.farm_id
        }
        
        // Save session using session manager
        if (sessionManager.saveSession(session)) {
          setCurrentParticipant(sessionManager.getSession());
          setCurrentView("participant-dashboard")
        } else {
          alert('Failed to create session. Please try again.')
        }
      } else {
        alert('Invalid access code. Please try again.')
      }
      
    } catch (error) {
      console.error('Login error:', error)
      alert('An error occurred. Please try again.')
    }
  }

  // Format participants for display
  const formattedParticipants = participants.map(p => ({
    id: p.id, // Use the ID directly - it's already a number
    name: p.name,
    access: p.access_tools.join(", "),
    code: p.code
  }))

  // Helper to fetch performance data for all buildings
  const fetchBuildingsWithPerformance = useCallback(async () => {
    if (!fetchedBuildings.length) {
      setBuildingsWithPerformance([]);
      return;
    }
    const results = await Promise.all(
      fetchedBuildings.map(async (building) => {
        // 1. Get latest calculator session for this building's farm
        let session = null;
        try {
          const { data: sessionData } = await supabase
            .from('calculator_sessions')
            .select('*')
            .eq('building_id', building.id)
            .eq('is_active', true)
            .single();
          session = sessionData;
        } catch {}

        // 2. Get latest daily record for this building's farm
        let latestRecord = null;
        try {
          const { data: dailyRecords } = await supabase
            .from('daily_records')
            .select('*')
            .eq('building_id', building.id)
            .order('date', { ascending: false })
            .limit(1);
          if (dailyRecords && dailyRecords.length > 0) {
            latestRecord = dailyRecords[0];
          }
        } catch {}

        // 3. Compute summary
        let summary = null;
        if (session && latestRecord) {
          // Compute FCR (Feed Conversion Ratio)
          const totalFeed = latestRecord.cumulative_feeds || 0;
          const totalWeightGained = (latestRecord.ending_heads * ((latestRecord.alw || 0) - (session.farm_data?.initialGrams || 0))) / 1000;
          const fcr = totalWeightGained > 0 ? (totalFeed / totalWeightGained) : 0;
          summary = {
            liveBirds: latestRecord.ending_heads,
            mortality: latestRecord.mortality_percent,
            fcr: fcr,
            avgWeight: latestRecord.alw,
          };
        }
        return { ...building, summary };
      })
    );
    setBuildingsWithPerformance(results);
    console.log('buildingsWithPerformance', results);
  }, [fetchedBuildings]);

  // Fetch performance data whenever buildings change
  useEffect(() => {
    fetchBuildingsWithPerformance();
  }, [fetchBuildingsWithPerformance]);

  // Calculate farm-wide performance
  const buildingsWithData = buildingsWithPerformance.filter(b => b.performance);
  const totalMortality = buildingsWithData.reduce((sum, b) => sum + b.performance.mortality, 0);
  const avgFCR = buildingsWithData.length
    ? (buildingsWithData.reduce((sum, b) => sum + b.performance.fcr, 0) / buildingsWithData.length)
    : null;
  const avgWeight = buildingsWithData.length
    ? (buildingsWithData.reduce((sum, b) => sum + b.performance.avgWeight, 0) / buildingsWithData.length)
    : null;

  // Loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  // Building View Modal/Page - Mobile Optimized
  if (viewingBuilding) {
    console.log("Rendering modal for building:", viewingBuilding);
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        {/* Mobile Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <button
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              onClick={() => setViewingBuilding(null)}
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {viewingBuilding.name}
            </h1>
            <div className="w-16"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Calculator Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            <BroilerCalculator
              initialBuildingNumber={viewingBuilding.cycle_number}
              initialCycleNumber={viewingBuilding.cycle_number}
              buildingId={viewingBuilding.id}
              buildingName={viewingBuilding.name}
              onSaveFarmSetup={async () => {
                // Refetch buildings after save to update the dashboard
                const { data, error } = await supabase.from("buildings").select("*");
                if (!error && data) {
                  setBuildings(data);
                }
                // Stay on the same page - don't close the calculator modal
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  // Congratulations Page - Mobile Optimized
  if (currentView === "congratulations") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm mx-auto">
          <CardContent className="p-6 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">Success!</h1>
              <p className="text-gray-600 dark:text-gray-300 text-base">
                {newParticipantName} has been added successfully.
              </p>
            </div>
            
            <div className="space-y-3">
              <Button 
                className="w-full bg-black text-white hover:bg-gray-800 h-12 text-base" 
                onClick={() => setCurrentView("dashboard")}
              >
                Go to Dashboard
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-12 text-base" 
                onClick={() => setCurrentView("add-participant")}
              >
                Add Another
              </Button>
              <Button 
                variant="outline" 
                className="w-full text-gray-600 h-12 text-base" 
                onClick={handleReset}
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Debug logging for black screen issue
  console.log('Render state:', { 
    isClient, 
    currentView, 
    authLoading, 
    user: user?.email, 
    viewingBuilding: !!viewingBuilding 
  })

  // Show loading state during SSR
  if (!isClient) {
    console.log('Showing client loading screen')
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Initializing App...</p>
        </div>
      </div>
    )
  }

  // Landing Page - Enhanced with Animations
  if (currentView === "landing") {
    return (
      <AnimatedLandingPage
        onSignUp={() => {
          console.log('User clicked Sign Up - resetting manual navigation flag')
          setUserManuallyNavigatedToLanding(false)
          setCurrentView("signup")
        }}
        onSignIn={() => {
          console.log('User clicked Sign In - resetting manual navigation flag')
          setUserManuallyNavigatedToLanding(false)
          setCurrentView("signin")
        }}
        onParticipantLogin={() => setCurrentView("participant-login")}
        onGoToDashboard={() => setCurrentView("dashboard")}
        onSignOut={handleSignOut}
        user={user}
        authError={authError || undefined}
        isNewUser={isNewUser}
      />
    )
  }



  // Sign In Page
  if (currentView === "signin") {
    return (
      <SignInForm
        onBack={() => setCurrentView("landing")}
        onSuccess={handleSignInSuccess}
      />
    )
  }

  // Email Verification Page
  if (currentView === "email-verification") {
    return (
      <EmailVerification
        email={pendingVerificationEmail || ""}
        onBack={() => setCurrentView("signin")}
        onVerified={handleEmailVerified}
        isFromSignIn={true}
      />
    )
  }

  // Participant Login Page
  if (currentView === "participant-login") {
    return (
      <ParticipantLogin
        onLogin={handleParticipantLogin}
        onBack={() => {
          setCurrentView("landing")
        }}
      />
    )
  }

  // Participant Dashboard
  if (currentView === "participant-dashboard") {
    return (
      <>
        <SessionTimeoutWarning
          onSessionExpired={() => {
            sessionManager.clearSession()
            setCurrentParticipant(null)
            setCurrentView("landing")
          }}
        />
        {/* <RoleDashboard
          participant={currentParticipant}
          onSignOut={() => {
            sessionManager.clearSession()
            setCurrentParticipant(null)
            setCurrentView("landing")
          }}
        /> */}
        <ProductionInputStaffDashboard
          participant={currentParticipant ?? undefined}
          onSignOut={handleSignOut}
          farmId={farmId}
        />
      </>
    )
  }



  // Dashboard
  if (currentView === "dashboard") {
    // Check if user is authenticated
    if (!user) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <h1 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Access Denied</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Please sign in to continue.</p>
              <Button 
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setCurrentView("landing")
                }}
              >
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }
    
    const isEmailVerified = !!user?.email_confirmed_at
    const hasData = participants.length > 0 || fetchedBuildings.length > 0
    

    
    // BLOCK ACCESS if email is not verified
    if (!isEmailVerified) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">Email Verification Required</h1>
                <p className="text-gray-600 dark:text-gray-300 text-base mb-4">
                  Please verify your email address to access the dashboard.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  We sent a verification link to: <strong>{user.email}</strong>
                </p>
              </div>
              
              <div className="space-y-3">
                <Button 
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 h-12 text-base" 
                  onClick={() => setCurrentView("email-verification")}
                >
                  Check Email Verification
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full h-12 text-base" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setCurrentView("landing")
                  }}
                >
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
    
    return (
      <>
        <AnimatedDashboard
          participants={formattedParticipants}
          buildings={buildingsWithPerformance}
          farmPerformance={{
            totalMortality,
            avgFCR,
            avgWeight,
          }}
          onAddParticipant={() => {
            setCurrentView("add-participant")
          }}
          onEditParticipant={handleEditParticipant}
          onDeleteParticipant={handleDeleteParticipant}
          onAddBuilding={() => {
            setCurrentView("add-building")
          }}
          onEditBuilding={handleEditBuilding}
          onDeleteBuilding={handleDeleteBuilding}
          onViewBuilding={handleViewBuilding}
          onSignOut={handleSignOut}
          onBackToLanding={() => setCurrentView("landing")}
          userEmail={user?.email}
          farmId={farmId}
          userId={user?.id}
          isNewUser={isNewUser}
        />
        
        {/* Product Tour for first-time users */}
        <ProductTour 
          isNewUser={!hasData} // Only show tour for users with no data
          onComplete={() => {
            setIsNewUser(false) // Reset after tour completion
          }}
        />
        
        
        
        {/* Debug info removed for cleaner interface */}
        
        {/* Verification Banner removed - now blocking access completely */}
      </>
    )
  }

  // Add Participant Page
  if (currentView === "add-participant") {
    // Check if user is authenticated
    if (!user) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <h1 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Access Denied</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Please sign in to continue.</p>
              <Button onClick={() => setCurrentView("landing")}>
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }
    
    // Check if email is verified
    const isEmailVerified = !!user?.email_confirmed_at
    
    // TEMPORARY: Allow access for testing if user exists
    if (!isEmailVerified && user?.email) {
      // Continue to the form instead of blocking
    } else if (!isEmailVerified) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">Email Verification Required</h1>
                <p className="text-gray-600 dark:text-gray-300 text-base mb-4">
                  Please verify your email address to add participants.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  We sent a verification link to: <strong>{user.email}</strong>
                </p>
              </div>
              
              <div className="space-y-3">
                <Button 
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 h-12 text-base" 
                  onClick={() => setCurrentView("email-verification")}
                >
                  Check Email Verification
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-12 text-base" 
                  onClick={() => setCurrentView("dashboard")}
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
    return (
      <AddParticipantView
        onBack={() => {
          setEditingParticipant(null)
          setCurrentView("dashboard")
        }}
        onAddParticipant={editingParticipant ? handleUpdateParticipant : handleAddParticipantSubmit}
        isNewAccount={isNewAccount}
        editingParticipant={editingParticipant ? {
          id: editingParticipant.id, // Use the ID directly
          name: editingParticipant.name,
          code: editingParticipant.code,
          access_tools: editingParticipant.access_tools || [] // Include access_tools
        } : null}
      />
    )
  }

  // Simple Registration Flow
  if (currentView === "signup") {
    return (
      <SimpleRegistration
        onSuccess={() => {
          setIsNewUser(true)
          setCurrentView("dashboard")
        }}
        onBack={navigateToLanding}
      />
    )
  }

  // Add Building Page
  if (currentView === "add-building") {
    // Check if user is authenticated
    if (!user) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <h1 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Access Denied</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Please sign in to continue.</p>
              <Button 
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setCurrentView("landing")
                }}
              >
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }
    
    // Check if email is verified
    const isEmailVerified = !!user?.email_confirmed_at
    console.log('Add Building - Email verification check:', { 
      userEmail: user?.email, 
      emailConfirmedAt: user?.email_confirmed_at, 
      isEmailVerified 
    })
    
    // TEMPORARY: Allow access for testing if user exists
    if (!isEmailVerified && user?.email) {
      console.log('Email not verified, but allowing access for testing')
      // Continue to the form instead of blocking
    } else if (!isEmailVerified) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">Email Verification Required</h1>
                <p className="text-gray-600 dark:text-gray-300 text-base mb-4">
                  Please verify your email address to add buildings.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  We sent a verification link to: <strong>{user.email}</strong>
                </p>
              </div>
              
              <div className="space-y-3">
                <Button 
                  type="button"
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 h-12 text-base" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setCurrentView("email-verification")
                  }}
                >
                  Check Email Verification
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full h-12 text-base" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setCurrentView("dashboard")
                  }}
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
    // Get used building numbers
    const usedBuildingNumbers = fetchedBuildings
      .map(b => b.building_number)
      .filter((num): num is number => num !== undefined);
    
    return (
      <AddBuildingView
        onBack={() => {
          setEditingBuilding(null)
          setCurrentView("dashboard")
        }}
        onAddBuilding={handleAddBuildingSubmit}
        editingBuilding={editingBuilding}
        usedBuildingNumbers={usedBuildingNumbers} // <-- pass as prop
      />
    )
  }

  return null
}

function useBuildingCalculatorData(buildingId: string | undefined) {
  const [farmData, setFarmData] = useState<any>(null);
  const [dailyRecords, setDailyRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!buildingId) return;
    setLoading(true);
    supabase
      .from("building_calculator_data")
      .select("*")
      .eq("building_id", buildingId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          // Error fetching data
        } else if (data) {
          setFarmData(data.farm_data);
          setDailyRecords(data.daily_records);
        } else {
          setFarmData(null);
          setDailyRecords([]);
        }
        setLoading(false);
      });
  }, [buildingId]);

  // Save function
  const saveCalculatorData = async (newFarmData: any, newDailyRecords: any[]) => {
    if (!buildingId) return;
    const { data, error } = await supabase
      .from("building_calculator_data")
      .upsert({
        building_id: buildingId,
        farm_data: newFarmData,
        daily_records: newDailyRecords,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'building_id' });
    if (error) throw error;
  };

  return { farmData, setFarmData, dailyRecords, setDailyRecords, saveCalculatorData, loading };
}
