import Link from "next/link"
import { Calendar, Clock, Users, Trophy } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            {process.env.NEXT_PUBLIC_CLUB_NAME || "Padel Club"}
          </h1>
          <p className="text-xl text-gray-800 mb-8 max-w-2xl mx-auto">
            Inschrijven voor wekelijkse padellessen. Selecteer je voorkeurtijden en laat de loting bepalen wanneer je speelt!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/inschrijven" 
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg"
            >
              Team Inschrijven
            </Link>
            <Link 
              href="/rooster" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg"
            >
              Rooster Bekijken
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Team Vorming</h3>
            <p className="text-gray-700">2-4 spelers per team. Één inschrijving per team.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Tijdsloten</h3>
            <p className="text-gray-700">Maandag t/m vrijdag, 13:30 - 21:30. Kies tot 4 voorkeuren.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <Trophy className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Eerlijke Loting</h3>
            <p className="text-gray-700">Algoritme zorgt voor eerlijke verdeling van tijdsloten.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <Calendar className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Planning</h3>
            <p className="text-gray-700">Ontvang je rooster direct na de loting via e-mail.</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-8">Hoe werkt het?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Inschrijven</h3>
              <p className="text-gray-700">Stel je team samen en selecteer je voorkeurtijdsloten (1-4 opties).</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Loting</h3>
              <p className="text-gray-700">Na sluiting inschrijving wordt er geloot volgens het prioriteitssysteem.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Spelen!</h3>
              <p className="text-gray-700">Ontvang je toegewezen tijdslot en geniet van je padeltraining.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}