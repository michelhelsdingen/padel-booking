# Padel Club Booking System

Een moderne webapplicatie voor het inschrijven van padel teams en het beheren van trainingsroosters via een eerlijk lotingsysteem.

## 🎯 Features

### Voor Gebruikers
- **Team Registratie**: Stel teams samen van 2-4 spelers
- **Tijdslot Selectie**: Kies uit beschikbare tijdsloten (Maandag-Vrijdag, 13:30-21:30)  
- **Prioriteitssysteem**: Rangschik voorkeuren van 1 (hoogste) tot 4
- **Rooster Overzicht**: Bekijk het definitieve trainingsrooster
- **Nederlandse Interface**: Volledig in het Nederlands

### Voor Beheerders
- **Admin Dashboard**: Overzicht van alle inschrijvingen
- **Loting Algoritme**: Eerlijke verdeling van tijdsloten
- **Statistieken**: Inzicht in toewijzingen per ronde en dag
- **Notificaties**: E-mail berichten naar teams (placeholder)

## 🛠 Tech Stack

- **Framework**: Next.js 15 met TypeScript
- **Database**: Prisma ORM + SQLite (development) / PostgreSQL (production)
- **Styling**: Tailwind CSS + Lucide React icons
- **Forms**: React Hook Form + Zod validatie
- **Deployment**: Vercel ready

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm of yarn

### Installation

1. **Clone en setup**
   ```bash
   git clone <repository-url>
   cd padel-booking
   npm install
   ```

2. **Database setup**
   ```bash
   npm run db:push
   npm run db:seed
   ```

3. **Environment configuratie**
   ```bash
   cp .env.example .env
   # Edit .env met jouw instellingen
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Applicatie draait op: http://localhost:3000

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build voor productie
npm run start        # Start productie server
npm run lint         # Run ESLint
npm run db:push      # Push schema naar database
npm run db:seed      # Seed database met test data
npm run db:studio    # Open Prisma Studio
```

## 🎮 Usage

### Team Inschrijving
1. Ga naar `/inschrijven`
2. Vul team informatie in (naam, contact e-mail, teamleden)
3. Selecteer gewenste tijdsloten en prioriteer ze
4. Bevestig inschrijving

### Admin Functies
1. Ga naar `/admin`
2. Bekijk ingeschreven teams
3. Voer loting uit via "Loting Uitvoeren"
4. Verstuur notificaties naar teams

### Rooster Bekijken
1. Ga naar `/rooster`
2. Bekijk toegewezen tijdsloten per dag

## 🔧 Configuration

### Database
- **Development**: SQLite (`prisma/dev.db`)
- **Production**: PostgreSQL (configureer `DATABASE_URL`)

### Email (Placeholder)
E-mail functionaliteit is voorbereid maar niet geïmplementeerd. Integreer met:
- SendGrid
- Nodemailer
- Resend
- Of andere e-mail service

### Environment Variables
```bash
DATABASE_URL="file:./dev.db"                    # Database connection
NEXTAUTH_URL="http://localhost:3000"            # Base URL
NEXTAUTH_SECRET="your-secret-key"               # Auth secret
SMTP_HOST="smtp.gmail.com"                      # Email SMTP
SMTP_PORT="587"                                 # Email port
SMTP_USER="your-email@gmail.com"               # Email user
SMTP_PASS="your-app-password"                  # Email password
NEXT_PUBLIC_CLUB_NAME="Jouw Padel Club"        # Club naam
```

## 🏗 Architecture

### Database Schema
- **Teams**: Team informatie en contact gegevens
- **TeamMembers**: Individuele teamleden
- **Timeslots**: Beschikbare tijdsloten per dag
- **TeamPreferences**: Team voorkeuren met prioriteit
- **Assignments**: Definitieve toewijzingen na loting
- **RegistrationPeriods**: Inschrijfperiodes beheer

### Lottery Algorithm
1. Verzamel alle team voorkeuren
2. Groepeer per prioriteit niveau (1-4)
3. Randomiseer binnen elke prioriteit groep
4. Wijs tijdsloten toe per ronde, rekening houdend met capaciteit
5. Extra ronde voor niet-toegewezen teams

## 📱 Responsive Design

Volledig responsive design dat werkt op:
- Desktop computers
- Tablets
- Smartphones

## 🔒 Security Features

- Input validatie met Zod
- CSRF bescherming via Next.js
- SQL injection bescherming via Prisma
- XSS bescherming via React

## 🚀 Deployment

### Vercel (Aanbevolen)
1. Verbind GitHub repository met Vercel
2. Configureer environment variables
3. Stel PostgreSQL database in (Supabase/PlanetScale)
4. Deploy!

### Manual Deployment
```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork het project
2. Maak feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push naar branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

Dit project is open source en beschikbaar onder de [MIT License](LICENSE).

## 🆘 Support

Voor vragen of problemen:
1. Check de [Issues](../../issues) pagina
2. Maak een nieuwe issue aan
3. Contacteer de ontwikkelaars

---

**Ontwikkeld met ❤️ voor de padel community**