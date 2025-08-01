'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Minus } from 'lucide-react'
import Link from 'next/link'
import { completeRegistrationSchema } from '@/lib/validations'
import { formatTimeslot, DAYS_OF_WEEK, TIME_SLOTS } from '@/lib/utils'
import { z } from 'zod'

type FormData = z.infer<typeof completeRegistrationSchema>

interface Timeslot {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

export default function InschrijvenPage() {
  const [step, setStep] = useState(1)
  const [timeslots, setTimeslots] = useState<Timeslot[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(completeRegistrationSchema),
    defaultValues: {
      team: {
        teamName: '',
        contactEmail: '',
        members: [{ name: '', email: '' }]
      },
      preferences: {
        preferences: []
      }
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'team.members'
  })

  const preferences = watch('preferences.preferences') || []

  // Load timeslots on component mount
  useEffect(() => {
    loadTimeslots()
  }, [])

  const loadTimeslots = async () => {
    try {
      const response = await fetch('/api/timeslots')
      if (response.ok) {
        const data = await response.json()
        setTimeslots(data)
      }
    } catch (err) {
      console.error('Error loading timeslots:', err)
    }
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        setStep(4) // Success step
      } else {
        const error = await response.json()
        alert(`Fout: ${error.message}`)
      }
    } catch (err) {
      alert('Er is een fout opgetreden. Probeer het opnieuw.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTimeslotToggle = (timeslotId: string) => {
    const currentPrefs = preferences || []
    const existingIndex = currentPrefs.findIndex(p => p.timeslotId === timeslotId)
    
    if (existingIndex >= 0) {
      // Remove preference
      const newPrefs = currentPrefs.filter(p => p.timeslotId !== timeslotId)
      // Reorder priorities
      newPrefs.forEach((pref, index) => {
        pref.priority = index + 1
      })
      setValue('preferences.preferences', newPrefs)
    } else if (currentPrefs.length < 4) {
      // Add preference
      const newPrefs = [...currentPrefs, {
        timeslotId,
        priority: currentPrefs.length + 1
      }]
      setValue('preferences.preferences', newPrefs)
    }
  }

  // Utility function for future priority reordering feature
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updatePriority = (timeslotId: string, newPriority: number) => {
    const currentPrefs = [...(preferences || [])]
    const prefIndex = currentPrefs.findIndex(p => p.timeslotId === timeslotId)
    
    if (prefIndex >= 0) {
      currentPrefs[prefIndex].priority = newPriority
      setValue('preferences.preferences', currentPrefs)
    }
  }

  if (step === 4) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-4">Inschrijving Gelukt!</h2>
            <p className="text-gray-600 mb-6">
              Je team is succesvol ingeschreven. Je ontvangt binnenkort een bevestigingsmail 
              met alle details. De loting vindt plaats op de aangegeven datum.
            </p>
            <Link 
              href="/" 
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Terug naar Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold">Team Inschrijven</h1>
                <Link href="/" className="text-blue-600 hover:underline">← Terug</Link>
              </div>
              
              <div className="flex space-x-4 mb-6">
                <div className={`flex-1 h-2 rounded ${step >= 1 ? 'bg-green-500' : 'bg-gray-200'}`} />
                <div className={`flex-1 h-2 rounded ${step >= 2 ? 'bg-green-500' : 'bg-gray-200'}`} />
                <div className={`flex-1 h-2 rounded ${step >= 3 ? 'bg-green-500' : 'bg-gray-200'}`} />
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {step === 1 && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Stap 1: Team Informatie</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Teamnaam *</label>
                      <input
                        {...register('team.teamName')}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Bijv. Team Awesome"
                      />
                      {errors.team?.teamName && (
                        <p className="text-red-500 text-sm mt-1">{errors.team.teamName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Contact E-mail *</label>
                      <input
                        {...register('team.contactEmail')}
                        type="email"
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="team@email.com"
                      />
                      {errors.team?.contactEmail && (
                        <p className="text-red-500 text-sm mt-1">{errors.team.contactEmail.message}</p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-medium">Teamleden (1-3 extra spelers)</label>
                        {fields.length < 3 && (
                          <button
                            type="button"
                            onClick={() => append({ name: '', email: '' })}
                            className="flex items-center text-green-600 hover:text-green-700"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Toevoegen
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        {fields.map((field, index) => (
                          <div key={field.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <input
                                {...register(`team.members.${index}.name`)}
                                placeholder="Naam"
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                            </div>
                            <div className="flex-1">
                              <input
                                {...register(`team.members.${index}.email`)}
                                type="email"
                                placeholder="E-mail"
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      {errors.team?.members && (
                        <p className="text-red-500 text-sm mt-1">{errors.team.members.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end mt-8">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Volgende
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Stap 2: Tijdslot Voorkeuren</h2>
                  <p className="text-gray-600 mb-6">
                    Selecteer maximaal 4 tijdsloten. De volgorde bepaalt je prioriteit (1 = hoogste voorkeur).
                  </p>

                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(day => (
                      <div key={day} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-3">
                          {DAYS_OF_WEEK[day as keyof typeof DAYS_OF_WEEK]}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {TIME_SLOTS.map(timeSlot => {
                            const timeslot = timeslots.find(t => 
                              t.dayOfWeek === day && 
                              t.startTime === timeSlot.start
                            )
                            if (!timeslot) return null

                            const isSelected = preferences.some(p => p.timeslotId === timeslot.id)
                            const priority = preferences.find(p => p.timeslotId === timeslot.id)?.priority

                            return (
                              <button
                                key={timeslot.id}
                                type="button"
                                onClick={() => handleTimeslotToggle(timeslot.id)}
                                className={`p-3 rounded-lg border text-left transition-colors ${
                                  isSelected
                                    ? 'bg-green-100 border-green-500 text-green-700'
                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{timeSlot.label}</span>
                                  {isSelected && (
                                    <span className="bg-green-500 text-white px-2 py-1 rounded text-sm">
                                      #{priority}
                                    </span>
                                  )}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {errors.preferences?.preferences && (
                    <p className="text-red-500 text-sm mt-4">{errors.preferences.preferences.message}</p>
                  )}

                  <div className="flex justify-between mt-8">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Vorige
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      disabled={preferences.length === 0}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Volgende
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Stap 3: Bevestiging</h2>
                  
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Team Informatie</h3>
                      <p><strong>Naam:</strong> {watch('team.teamName')}</p>
                      <p><strong>Contact:</strong> {watch('team.contactEmail')}</p>
                      <p><strong>Aantal leden:</strong> {fields.length + 1}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Tijdslot Voorkeuren</h3>
                      <div className="space-y-2">
                        {preferences
                          .sort((a, b) => a.priority - b.priority)
                          .map((pref) => {
                            const timeslot = timeslots.find(t => t.id === pref.timeslotId)
                            return timeslot ? (
                              <div key={pref.timeslotId} className="flex items-center">
                                <span className="bg-green-500 text-white px-2 py-1 rounded text-sm mr-3">
                                  #{pref.priority}
                                </span>
                                <span>{formatTimeslot(timeslot.dayOfWeek, timeslot.startTime, timeslot.endTime)}</span>
                              </div>
                            ) : null
                          })}
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-800 mb-2">Belangrijke Informatie</h3>
                      <ul className="text-blue-700 space-y-1 text-sm">
                        <li>• De loting vindt plaats na sluiting van de inschrijfperiode</li>
                        <li>• Je ontvangt een bevestigingsmail met je toegewezen tijdslot</li>
                        <li>• Wijzigingen zijn na inschrijving niet meer mogelijk</li>
                        <li>• Bij vragen kun je contact opnemen via de beheerder</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Vorige
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      {isLoading ? 'Inschrijven...' : 'Inschrijving Bevestigen'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}