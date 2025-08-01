import Link from "next/link"
import Image from "next/image"
import { Calendar, Clock, Users, Trophy } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="mb-6">
            <Image
              src="/ltc-de-kei-logo.png"
              alt="LTC de Kei Logo"
              width={300}
              height={150}
              className="mx-auto"
            />
          </div>
          <p className="text-xl text-gray-900 font-medium mb-8 max-w-2xl mx-auto">
            Altijd al padel les willen nemen? Dit is je kans!
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Alleen of met je Team</h3>
            <p className="text-gray-900 font-medium">Geef je alleen of samen met je Padel maatjes op</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Tijdsloten</h3>
            <p className="text-gray-900 font-medium">Kies een viertal voorkeurstijdstippen</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <Trophy className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Eerlijke Loting</h3>
            <p className="text-gray-900 font-medium">Een slimme loting zorgt voor een eerlijke verdeling!</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <Calendar className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Planning</h3>
            <p className="text-gray-900 font-medium">Na de loting ontvang je vanzelf bericht of en wanneer je kunt lessen</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Hoe werkt het?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Inschrijven</h3>
              <p className="text-gray-900 font-medium">Stel je team samen en selecteer je voorkeurtijdsloten (1-4 opties).</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Loting</h3>
              <p className="text-gray-900 font-medium">Na sluiting inschrijving wordt er geloot volgens het prioriteitssysteem.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Spelen!</h3>
              <p className="text-gray-900 font-medium">Ontvang je toegewezen tijdslot en geniet van je padeltraining.</p>
            </div>
          </div>
        </div>

        {/* Registration button at the bottom */}
        <div className="flex justify-center pt-8">
          <Link 
            href="/inschrijven" 
            className="bg-green-600 hover:bg-green-700 text-white px-12 py-6 rounded-lg font-bold transition-colors text-xl shadow-lg"
          >
            Schrijf in voor Padel Les!
          </Link>
        </div>
      </div>
    </div>
  )
}