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
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
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
    /**
     * Inicializa el listener de Firebase Auth
     * Se llama UNA sola vez al iniciar la app
     */
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
     * Login con Google
     */
    async loginWithGoogle() {
      const auth = getAuth()
      const provider = new GoogleAuthProvider()

      this.loading = true

      try {
        const result = await signInWithPopup(auth, provider)
        await this.handleAuthenticatedUser(result.user)
      } catch (error) {
        console.error('Google login error', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Login con Google
     */

    async loginWithMicrosoft() {
      const auth = getAuth()
      const provider = new OAuthProvider('microsoft.com')

      this.loading = true

      try {
        const result = await signInWithPopup(auth, provider)
        await this.handleAuthenticatedUser(result.user)
      } catch (error) {
        console.error('Microsoft login error', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Logout
     */
    async logout() {
      const auth = getAuth()
      await signOut(auth)
      this.user = null
    },

    /**
     * Maneja el usuario autenticado:
     * - Verifica si existe en Firestore
     * - Lo crea si no existe
     * - Lo guarda en el store
     */
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

        await setDoc(userRef, {
          ...newUser,
          createdAt: serverTimestamp(),
          isActive: true,
        })

        this.user = newUser
      } else {
        this.user = snap.data() as AuthUser
      }
    },

    /**
     * Convierte providerId de Firebase a nuestro dominio
     */
    mapProvider(providerId?: string): 'google' | 'microsoft' {
      if (providerId === 'google.com') return 'google'
      if (providerId === 'microsoft.com') return 'microsoft'
      return 'google'
    },

    /**
     * Genera slug público a partir del nombre
     */
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
