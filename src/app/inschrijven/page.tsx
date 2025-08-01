'use client'

import { useState, useEffect, useCallback } from 'react'
import React from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Minus } from 'lucide-react'
import Link from 'next/link'
import { completeRegistrationSchema } from '@/lib/validations'
import { formatTimeslot, DAYS_OF_WEEK, TIME_SLOTS } from '@/lib/utils'
import { z } from 'zod'
import toast from 'react-hot-toast'
import VisitorTracker from '@/components/VisitorTracker'

type FormData = z.infer<typeof completeRegistrationSchema>

interface Timeslot {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  preferenceCount: number
}

export default function InschrijvenPage() {
  const [step, setStep] = useState(1)
  const [timeslots, setTimeslots] = useState<Timeslot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [emailCheck, setEmailCheck] = useState<{
    isChecking: boolean
    exists: boolean | null
    message: string
  }>({
    isChecking: false,
    exists: null,
    message: ''
  })
  
  const [editMode, setEditMode] = useState<{
    isActive: boolean
    showCodeInput: boolean
    isSendingCode: boolean
    isVerifyingCode: boolean
    code: string
    teamId?: string
  }>({
    isActive: false,
    showCodeInput: false,
    isSendingCode: false,
    isVerifyingCode: false,
    code: ''
  })

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(completeRegistrationSchema),
    defaultValues: {
      team: {
        firstName: '',
        lastName: '',
        contactEmail: '',
        members: []
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

  // State for email debounce timeout
  const [emailTimeout, setEmailTimeout] = useState<NodeJS.Timeout | null>(null)

  // Load timeslots on component mount
  useEffect(() => {
    loadTimeslots()
  }, [])

  // Cleanup email timeout on unmount
  useEffect(() => {
    return () => {
      if (emailTimeout) {
        clearTimeout(emailTimeout)
      }
    }
  }, [emailTimeout])

  const loadTimeslots = async () => {
    try {
      const response = await fetch('/api/timeslots')
      if (response.ok) {
        const data = await response.json()
        setTimeslots(data)
      }
    } catch (error) {
      console.error('Error loading timeslots:', error)
    }
  }

  // Get Dutch popularity indicator
  const getPopularityInfo = (count: number) => {
    if (count === 0) {
      return { text: 'Nog geen keuzes', color: 'text-green-600', bgColor: 'bg-green-50' }
    } else if (count <= 2) {
      return { text: `${count} keer gekozen`, color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    } else if (count <= 4) {
      return { text: `${count} keer gekozen`, color: 'text-orange-600', bgColor: 'bg-orange-50' }
    } else {
      return { text: `${count} keer gekozen`, color: 'text-red-600', bgColor: 'bg-red-50' }
    }
  }

  const onSubmit = async (data: FormData) => {
    console.log('Form submitted with data:', data)
    setIsLoading(true)
    
    const loadingToast = toast.loading(editMode.isActive ? 'Bezig met bijwerken...' : 'Bezig met inschrijven...')
    
    try {
      const url = editMode.isActive ? '/api/registrations/update' : '/api/registrations'
      const method = editMode.isActive ? 'PUT' : 'POST'
      const body = editMode.isActive ? { ...data, teamId: editMode.teamId } : data
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Success result:', result)
        toast.dismiss(loadingToast)
        toast.success(editMode.isActive ? 'Gegevens succesvol bijgewerkt! Je ontvangt een bevestigingsmail.' : 'Inschrijving succesvol! Je ontvangt een bevestigingsmail.', {
          duration: 5000,
        })
        setStep(4) // Success step
      } else {
        toast.dismiss(loadingToast)
        
        // Try to parse JSON error, but handle HTML error pages
        let errorMessage = 'Er is een fout opgetreden bij de inschrijving'
        try {
          const responseText = await response.text()
          console.log('Raw error response:', responseText)
          
          // Try to parse as JSON
          const result = JSON.parse(responseText)
          console.error('API Error:', result)
          errorMessage = result.error || errorMessage
          if (result.details) {
            console.error('Error details:', result.details)
          }
        } catch (e) {
          console.error('Failed to parse error response:', e)
          console.error('Response was not valid JSON')
        }
        
        toast.error(errorMessage)
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error('Er is een fout opgetreden. Probeer het opnieuw.')
      console.error('Error submitting registration:', error)
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

  // Email checking function with debounce
  const checkEmailAvailability = async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailCheck({ isChecking: false, exists: null, message: '' })
      return
    }

    setEmailCheck({ isChecking: true, exists: null, message: 'Controleren...' })

    try {
      const response = await fetch('/api/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const result = await response.json()

      if (response.ok) {
        setEmailCheck({
          isChecking: false,
          exists: result.exists,
          message: result.message
        })
      } else {
        setEmailCheck({
          isChecking: false,
          exists: null,
          message: 'Fout bij controleren e-mailadres'
        })
      }
    } catch (error) {
      console.error('Error checking email:', error)
      setEmailCheck({
        isChecking: false,
        exists: null,
        message: 'Fout bij controleren e-mailadres'
      })
    }
  }

  // Memoize checkEmailAvailability
  const memoizedCheckEmailAvailability = useCallback(checkEmailAvailability, [])
  
  // Create debounced email check with useCallback
  const debouncedEmailCheck = useCallback((email: string) => {
    if (emailTimeout) {
      clearTimeout(emailTimeout)
    }
    
    const newTimeout = setTimeout(() => {
      memoizedCheckEmailAvailability(email)
    }, 1000)
    
    setEmailTimeout(newTimeout)
  }, [emailTimeout, memoizedCheckEmailAvailability])

  // Send edit code
  const sendEditCode = async (email: string) => {
    setEditMode(prev => ({ ...prev, isSendingCode: true }))
    
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const result = await response.json()

      if (response.ok) {
        setEditMode(prev => ({ 
          ...prev, 
          showCodeInput: true, 
          isSendingCode: false 
        }))
        toast.success('Wijzigingscode verstuurd naar je e-mailadres')
      } else {
        toast.error(result.error || 'Fout bij versturen code')
        setEditMode(prev => ({ ...prev, isSendingCode: false }))
      }
    } catch (error) {
      console.error('Error sending edit code:', error)
      toast.error('Er is een fout opgetreden')
      setEditMode(prev => ({ ...prev, isSendingCode: false }))
    }
  }

  // Verify edit code
  const verifyEditCode = async (email: string, code: string) => {
    setEditMode(prev => ({ ...prev, isVerifyingCode: true }))
    
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      })

      const result = await response.json()

      if (response.ok) {
        // Load existing team data into form
        const { formData, teamId } = result
        
        // Set form values
        setValue('team.firstName', formData.team.firstName)
        setValue('team.lastName', formData.team.lastName)
        setValue('team.contactEmail', formData.team.contactEmail)
        setValue('team.members', formData.team.members)
        setValue('preferences.preferences', formData.preferences.preferences)
        
        setEditMode(prev => ({ 
          ...prev, 
          isActive: true, 
          teamId, 
          showCodeInput: false,
          isVerifyingCode: false 
        }))
        
        toast.success('Gegevens geladen! Je kunt nu wijzigingen maken.')
        setStep(2) // Go directly to step 2 since basic info is already filled
      } else {
        toast.error(result.error || 'Ongeldige code')
        setEditMode(prev => ({ ...prev, isVerifyingCode: false }))
      }
    } catch (error) {
      console.error('Error verifying edit code:', error)
      toast.error('Er is een fout opgetreden')
      setEditMode(prev => ({ ...prev, isVerifyingCode: false }))
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
            <h2 className="text-2xl font-bold text-green-700 mb-4">Inschrijving Gelukt!</h2>
            <p className="text-gray-900 font-medium mb-6">
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
      <VisitorTracker page="signup" />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold">
                  {editMode.isActive ? 'Inschrijving Wijzigen' : 'Team Inschrijven'}
                </h1>
                <Link href="/" className="text-blue-600 hover:underline">← Terug</Link>
              </div>
              {editMode.isActive && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-800">
                    <strong>Wijzigingsmodus actief:</strong> Je kunt nu je teamleden en tijdslot voorkeuren aanpassen.
                  </p>
                </div>
              )}
              
              <div className="flex space-x-4 mb-6">
                <div className={`flex-1 h-2 rounded ${step >= 1 ? 'bg-green-500' : 'bg-gray-200'}`} />
                <div className={`flex-1 h-2 rounded ${step >= 2 ? 'bg-green-500' : 'bg-gray-200'}`} />
                <div className={`flex-1 h-2 rounded ${step >= 3 ? 'bg-green-500' : 'bg-gray-200'}`} />
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {step === 1 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Stap 1: Persoonlijke Gegevens</h2>
                  
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-900 font-medium">
                      💡 <strong>Per team hoeft maar 1 speler zich op te geven.</strong> Je kunt daarna teamgenoten toevoegen.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-base font-bold text-gray-900 mb-2">Voornaam *</label>
                        <input
                          {...register('team.firstName')}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-medium text-gray-900 placeholder-gray-500"
                          placeholder="Je voornaam"
                        />
                        {errors.team?.firstName && (
                          <p className="text-red-600 font-semibold text-sm mt-1">{errors.team.firstName.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-base font-bold text-gray-900 mb-2">Achternaam *</label>
                        <input
                          {...register('team.lastName')}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-medium text-gray-900 placeholder-gray-500"
                          placeholder="Je achternaam"
                        />
                        {errors.team?.lastName && (
                          <p className="text-red-600 font-semibold text-sm mt-1">{errors.team.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-base font-bold text-gray-900 mb-2">Contact E-mail *</label>
                      <div className="relative">
                        <input
                          {...register('team.contactEmail')}
                          type="email"
                          className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-medium text-gray-900 placeholder-gray-500 ${
                            emailCheck.exists === true 
                              ? 'border-red-300 bg-red-50' 
                              : emailCheck.exists === false 
                              ? 'border-green-300 bg-green-50' 
                              : 'border-gray-300'
                          }`}
                          placeholder="team@email.com"
                          onChange={(e) => {
                            const value = e.target.value
                            register('team.contactEmail').onChange(e)
                            if (value) {
                              debouncedEmailCheck(value)
                            } else {
                              setEmailCheck({ isChecking: false, exists: null, message: '' })
                            }
                          }}
                        />
                        {emailCheck.isChecking && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                          </div>
                        )}
                        {emailCheck.exists === false && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <span className="text-green-500 text-lg">✓</span>
                          </div>
                        )}
                        {emailCheck.exists === true && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <span className="text-red-500 text-lg">✗</span>
                          </div>
                        )}
                      </div>
                      {errors.team?.contactEmail && (
                        <p className="text-red-500 text-sm mt-1">{errors.team.contactEmail.message}</p>
                      )}
                      {emailCheck.message && !errors.team?.contactEmail && (
                        <p className={`text-sm mt-1 font-medium ${
                          emailCheck.exists === true ? 'text-red-600' : 
                          emailCheck.exists === false ? 'text-green-600' : 
                          'text-blue-600'
                        }`}>
                          {emailCheck.message}
                        </p>
                      )}
                      {emailCheck.exists === true && !editMode.showCodeInput && !editMode.isActive && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800 mb-2">
                            <strong>Wil je je inschrijving wijzigen?</strong> We kunnen je een code sturen om je teamleden of tijdslot voorkeuren aan te passen.
                          </p>
                          <button
                            type="button"
                            onClick={() => sendEditCode(watch('team.contactEmail'))}
                            disabled={editMode.isSendingCode}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                          >
                            {editMode.isSendingCode ? 'Versturen...' : 'Wijzigingscode Versturen'}
                          </button>
                        </div>
                      )}
                      {editMode.showCodeInput && (
                        <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800 mb-3">
                            <strong>Voer de 6-cijferige code in</strong> die we naar je e-mailadres hebben gestuurd:
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editMode.code}
                              onChange={(e) => setEditMode(prev => ({ ...prev, code: e.target.value }))}
                              placeholder="123456"
                              className="flex-1 p-2 border-2 border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent font-mono text-center"
                              maxLength={6}
                            />
                            <button
                              type="button"
                              onClick={() => verifyEditCode(watch('team.contactEmail'), editMode.code)}
                              disabled={editMode.isVerifyingCode || editMode.code.length !== 6}
                              className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                            >
                              {editMode.isVerifyingCode ? 'Controleren...' : 'Verifiëren'}
                            </button>
                          </div>
                          <p className="text-xs text-yellow-700 mt-2">
                            Code niet ontvangen? <button type="button" onClick={() => sendEditCode(watch('team.contactEmail'))} className="underline">Opnieuw versturen</button>
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <label className="block text-base font-bold text-gray-900">Teamleden (1-3 extra spelers)</label>
                          <p className="text-sm text-gray-600 mt-1">E-mailadressen zijn optioneel voor teamleden</p>
                        </div>
                        {fields.length < 3 && (
                          <button
                            type="button"
                            onClick={() => append({ firstName: '', lastName: '', email: '' })}
                            className="flex items-center text-green-600 hover:text-green-700"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Toevoegen
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        {fields.map((field, index) => (
                          <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
                            <div>
                              <input
                                {...register(`team.members.${index}.firstName`)}
                                placeholder="Voornaam"
                                className="w-full p-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent font-medium text-gray-900 placeholder-gray-500"
                              />
                            </div>
                            <div>
                              <input
                                {...register(`team.members.${index}.lastName`)}
                                placeholder="Achternaam"
                                className="w-full p-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent font-medium text-gray-900 placeholder-gray-500"
                              />
                            </div>
                            <div className="flex gap-2">
                              <input
                                {...register(`team.members.${index}.email`)}
                                type="email"
                                placeholder="E-mail (optioneel)"
                                className="flex-1 p-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent font-medium text-gray-900 placeholder-gray-500"
                              />
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                className="text-red-500 hover:text-red-700 p-2"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                            </div>
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
                      onClick={async () => {
                        const isValid = await trigger(['team.firstName', 'team.lastName', 'team.contactEmail'])
                        if (isValid && emailCheck.exists !== true) {
                          setStep(2)
                        }
                      }}
                      disabled={emailCheck.isChecking || emailCheck.exists === true}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      {emailCheck.isChecking ? 'Controleren...' : 'Volgende'}
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Stap 2: Tijdslot Voorkeuren</h2>
                  <p className="text-gray-900 font-medium mb-4">
                    Selecteer maximaal 4 tijdsloten. De volgorde bepaalt je prioriteit (1 = hoogste voorkeur).
                  </p>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                    <h3 className="font-bold text-blue-900 mb-2">Populariteit van tijdsloten:</h3>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center">
                        <span className="mr-2">🟢</span>
                        <span className="text-green-600 font-medium">Nog geen keuzes - Beste kans!</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">🟡</span>
                        <span className="text-yellow-600 font-medium">Weinig gekozen - Goede kans</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">🟠</span>
                        <span className="text-orange-600 font-medium">Gemiddeld populair</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">🔴</span>
                        <span className="text-red-600 font-medium">Zeer populair - Lage kans</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(day => {
                      const getTrainerName = (dayNumber: number) => {
                        if (dayNumber === 4) return 'Frans' // Donderdag
                        return 'Jorik' // Maandag, Dinsdag, Woensdag, Vrijdag
                      }
                      
                      return (
                      <div key={day} className="border rounded-lg p-4">
                        <h3 className="font-bold text-xl text-gray-900 mb-3">
                          {DAYS_OF_WEEK[day as keyof typeof DAYS_OF_WEEK]}
                          <span className="text-sm font-normal text-gray-600 ml-2">
                            (Trainer: {getTrainerName(day)})
                          </span>
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
                            const popularityInfo = getPopularityInfo(timeslot.preferenceCount)

                            return (
                              <button
                                key={timeslot.id}
                                type="button"
                                data-testid="timeslot-button"
                                onClick={() => handleTimeslotToggle(timeslot.id)}
                                className={`p-3 rounded-lg border-2 text-left transition-colors ${
                                  isSelected
                                    ? 'bg-green-100 border-green-600'
                                    : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-gray-900">{timeSlot.label}</span>
                                    <span className={`text-xs font-medium ${popularityInfo.color}`}>
                                      {popularityInfo.text}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${popularityInfo.color} ${popularityInfo.bgColor}`}>
                                      {timeslot.preferenceCount === 0 ? '🟢' : 
                                       timeslot.preferenceCount <= 2 ? '🟡' : 
                                       timeslot.preferenceCount <= 4 ? '🟠' : '🔴'}
                                    </span>
                                    {isSelected && (
                                      <span className="bg-green-500 text-white px-2 py-1 rounded text-sm">
                                        #{priority}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      )
                    })}
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
                      onClick={() => {
                        if (preferences.length > 0) {
                          setStep(3)
                        }
                      }}
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Stap 3: Bevestiging</h2>
                  
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-bold text-lg text-gray-900 mb-2">Team Informatie</h3>
                      <p><strong>Naam:</strong> {watch('team.firstName')} {watch('team.lastName')}</p>
                      <p><strong>Contact:</strong> {watch('team.contactEmail')}</p>
                      <p><strong>Aantal leden:</strong> {fields.length + 1}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-bold text-lg text-gray-900 mb-2">Tijdslot Voorkeuren</h3>
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
                      <h3 className="font-bold text-lg text-blue-900 mb-2">Belangrijke Informatie</h3>
                      <ul className="text-blue-900 font-medium space-y-1">
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
                      onClick={() => {
                        console.log('Submit button clicked')
                        console.log('Current form errors:', errors)
                        console.log('Team members errors:', errors.team?.members)
                        console.log('Current form data:', watch())
                      }}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
                    >
{isLoading ? (editMode.isActive ? 'Bezig met bijwerken...' : 'Bezig met versturen...') : (editMode.isActive ? 'Wijzigingen Opslaan' : 'Inschrijving Bevestigen')}
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