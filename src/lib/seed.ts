import type { Collections } from './types'
import { addDays, today, toISODate } from './dates'

/** Clearly fictional demo data (the dog is called "Exemple · Biscuit"). Dates are relative to today. */
export function demoData(): Collections {
  const t = today()
  const d = 'demo-dog', d2 = 'demo-dog-2'
  const birth = (m: number) => { const x = new Date(); x.setMonth(x.getMonth() - m); return toISODate(x) }
  let n = 0; const id = (p: string) => `demo-${p}-${++n}`
  const weights = [-150, -120, -90, -60, -30, -3].map((o, i) => ({ id: id('w'), dog_id: d, date: addDays(t, o), kg: [8.2, 10.6, 13.1, 15.4, 17.0, 17.8][i] }))
  const cats = ['vet', 'food', 'food', 'medication', 'grooming', 'accessories', 'insurance', 'food'] as const
  const expenses = cats.map((category, i) => ({ id: id('e'), dog_id: i % 4 === 3 ? d2 : d, date: addDays(t, -i * 12), amount: [64, 45, 45, 22.5, 38, 19.9, 29, 45][i], category, merchant: ['Clinique Exemple', 'Animalerie Exemple', 'Animalerie Exemple', 'Pharmacie Exemple', 'Salon Exemple', 'Boutique Exemple', 'Assurance Exemple', 'Animalerie Exemple'][i], note: '', insurance_refund: i === 0 ? 20 : null }))
  return {
    dogs: [
      { id: d, name: 'Biscuit (exemple)', birth_date: birth(9), approx_age_months: null, breed: 'Croisé Labrador', sex: 'male', weight_kg: 17.8, notes: 'Profil fictif de démonstration.', created_at: t },
      { id: d2, name: 'Noisette (exemple)', birth_date: birth(40), approx_age_months: null, breed: 'Beagle', sex: 'female', weight_kg: 11.2, notes: 'Profil fictif de démonstration.', created_at: t },
    ],
    weights,
    expenses,
    health: [
      { id: id('h'), dog_id: d, kind: 'vaccine', title: 'Vaccin exemple A', date: addDays(t, -200), next_date: addDays(t, -5), end_date: null, provider: 'Clinique Exemple', dose: '', category: '', notes: 'Donnée fictive', vet_confirmed: true },
      { id: id('h'), dog_id: d, kind: 'vaccine', title: 'Vaccin exemple B', date: addDays(t, -40), next_date: addDays(t, 20), end_date: null, provider: 'Clinique Exemple', dose: '', category: '', notes: 'Donnée fictive', vet_confirmed: true },
      { id: id('h'), dog_id: d, kind: 'antiparasitic', title: 'Antiparasitaire exemple', date: addDays(t, -20), next_date: addDays(t, 10), end_date: null, provider: '', dose: 'Selon la notice du produit', category: 'Puces / tiques', notes: '', vet_confirmed: false },
      { id: id('h'), dog_id: d, kind: 'allergy', title: 'Sensibilité cutanée suspectée', date: addDays(t, -60), next_date: null, end_date: null, provider: '', dose: '', category: '', notes: 'Observation personnelle fictive', vet_confirmed: false },
    ],
    appointments: [
      { id: id('a'), dog_id: d, at: `${addDays(t, 6)}T10:30`, reason: 'Contrôle de croissance', vet: 'Clinique Exemple', address: '1 rue de l’Exemple', phone: '', notes: '', remind_minutes: 1440 },
      { id: id('a'), dog_id: d, at: `${addDays(t, -40)}T15:00`, reason: 'Vaccination', vet: 'Clinique Exemple', address: '', phone: '', notes: '', remind_minutes: null },
    ],
    activities: [0, 1, 2, 4, 5].map((o) => ({ id: id('act'), dog_id: d, date: addDays(t, -o), type: 'walk' as const, minutes: 35 + o * 3, notes: '' })),
    meals: [0, 1, 2, 3].flatMap((o) => [8, 19].map((h) => ({ id: id('m'), dog_id: d, at: `${addDays(t, -o)}T${String(h).padStart(2, '0')}:00`, kind: 'Croquettes', product: 'Marque exemple', grams: 160, appetite: '' }))),
    routines: [
      { id: id('r'), dog_id: d, label: 'Promenade du matin', enabled: true, done_dates: [0, 1, 2, 3].map((o) => addDays(t, -o)) },
      { id: id('r'), dog_id: d, label: 'Brossage', enabled: true, done_dates: [1, 3].map((o) => addDays(t, -o)) },
      { id: id('r'), dog_id: d, label: 'Contrôle des oreilles', enabled: false, done_dates: [] },
    ],
  }
}
