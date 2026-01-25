// src/stores/auth.store.ts
import { defineStore } from 'pinia'
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'

export interface AuthUser {
  uid: string
  email: string
  name: string
  photoUrl?: string
  provider: 'google' | 'microsoft'
  publicSlug: string
  timezone: string
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  initialized: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    loading: false,
    initialized: false,
  }),

  actions: {
    initAuthListener() {
      const auth = getAuth()

      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          await this.handleAuthenticatedUser(firebaseUser)
        } else {
          this.user = null
        }

        this.initialized = true
      })
    },

    /**
     * Login Google (SOLO identidad)
     */
    async loginWithGoogle() {
      const auth = getAuth()
      const provider = new GoogleAuthProvider()

      this.loading = true
      try {
        const result = await signInWithPopup(auth, provider)
        await this.handleAuthenticatedUser(result.user)
      } finally {
        this.loading = false
      }
    },

    /**
     * Login Microsoft (SOLO identidad)
     */
    async loginWithMicrosoft() {
      const auth = getAuth()
      const provider = new OAuthProvider('microsoft.com')

      this.loading = true
      try {
        const result = await signInWithPopup(auth, provider)
        await this.handleAuthenticatedUser(result.user)
      } finally {
        this.loading = false
      }
    },

    async logout() {
      const auth = getAuth()
      await signOut(auth)
      this.user = null
    },

    async handleAuthenticatedUser(firebaseUser: FirebaseUser) {
      const userRef = doc(db, 'users', firebaseUser.uid)
      const snap = await getDoc(userRef)

      if (!snap.exists()) {
        const newUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          name: firebaseUser.displayName ?? '',
          photoUrl: firebaseUser.photoURL ?? undefined,
          provider: this.mapProvider(firebaseUser.providerData[0]?.providerId),
          publicSlug: this.generateSlug(firebaseUser.displayName),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }

        // Crear usuario en Firestore
        await setDoc(userRef, {
          ...newUser,
          createdAt: serverTimestamp(),
          isActive: true,
        })

        // Crear evento por defecto (30min meetings)
        await this.createDefaultEvent(firebaseUser.uid)

        this.user = newUser
      } else {
        this.user = snap.data() as AuthUser
      }
    },

    async createDefaultEvent(uid: string) {
      const slug = '30min'
      const eventRef = doc(db, 'event_types', `${uid}_${slug}`)

      await setDoc(eventRef, {
        ownerUid: uid,

        name: '30 Minute Meeting',
        slug,

        description: 'Reunión de 30 minutos',
        duration: 30,

        visibility: 'public',
        isActive: true,

        location: {
          type: 'google_meet',
        },

        scheduling: {},

        createdAt: serverTimestamp(),
      })
    },

    mapProvider(providerId?: string): 'google' | 'microsoft' {
      if (providerId === 'google.com') return 'google'
      if (providerId === 'microsoft.com') return 'microsoft'
      return 'google'
    },

    generateSlug(name?: string | null): string {
      if (!name) return 'user'

      return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    },
  },
})
