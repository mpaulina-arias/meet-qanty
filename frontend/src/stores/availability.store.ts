import { defineStore } from 'pinia'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuthStore } from './auth.store'
import { validateRanges } from '@/utils/availability/workScheduleValidation'

/* =========================
   TIPOS
========================= */

export type Day = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export type TimeRange = {
  start: string
  end: string
}

export type DaySchedule = {
  enabled: boolean
  ranges: TimeRange[]
}

export type WeeklySchedule = Record<Day, DaySchedule>

/* =========================
   CONSTANTES
========================= */

export const DAYS: Day[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

const DEFAULT_RANGE: TimeRange = {
  start: '09:00',
  end: '17:00',
}

/* =========================
   STORE
========================= */

export const useAvailabilityStore = defineStore('availability', {
  state: () => ({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',

    weekly: {
      monday: { enabled: true, ranges: [{ ...DEFAULT_RANGE }] },
      tuesday: { enabled: true, ranges: [{ ...DEFAULT_RANGE }] },
      wednesday: { enabled: true, ranges: [{ ...DEFAULT_RANGE }] },
      thursday: { enabled: true, ranges: [{ ...DEFAULT_RANGE }] },
      friday: { enabled: true, ranges: [{ ...DEFAULT_RANGE }] },
      saturday: { enabled: true, ranges: [{ ...DEFAULT_RANGE }] },
      sunday: { enabled: false, ranges: [] },
    } as WeeklySchedule,
    errors: {} as Partial<Record<Day, string>>,
    loading: false,
  }),

  actions: {
    async loadSchedule() {
      const auth = useAuthStore()
      if (!auth.user) return

      this.loading = true

      const ref = doc(db, 'work_schedules', auth.user.uid)
      const snap = await getDoc(ref)

      if (snap.exists()) {
        const data = snap.data()
        this.weekly = data.weekly as WeeklySchedule
        this.timezone = data.timezone
      } else {
        await this.saveSchedule()
      }

      this.loading = false
    },

    validateDay(day: Day): boolean {
      const ranges = this.weekly[day].ranges
      const error = validateRanges(ranges)

      if (error) {
        this.errors[day] = error
        return false
      }

      delete this.errors[day]
      return true
    },

    async saveSchedule() {
      const auth = useAuthStore()
      if (!auth.user) return

      let valid = true

      for (const day of Object.keys(this.weekly) as Day[]) {
        if (this.weekly[day].enabled) {
          const ok = this.validateDay(day)
          if (!ok) valid = false
        }
      }

      if (!valid) return

      const ref = doc(db, 'work_schedules', auth.user.uid)

      await setDoc(ref, {
        timezone: this.timezone,
        weekly: this.weekly,
        updatedAt: serverTimestamp(),
      })
    },

    addRange(day: Day) {
      this.weekly[day].ranges.push({
        start: '13:00',
        end: '17:00',
      })
    },

    removeRange(day: Day, index: number) {
      this.weekly[day].ranges.splice(index, 1)

      if (this.weekly[day].ranges.length === 0) {
        this.weekly[day].enabled = false
      }
    },
  },
})
