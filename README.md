# WhatsApp AI Platform

Plateforme privée multi-entreprises pour gérer des chatbots IA WhatsApp.

## Stack technique

- **Frontend/Backend** : Next.js 14 (App Router)
- **Base de données** : Supabase (PostgreSQL + pgvector)
- **IA** : Google Gemini 2.5 Flash
- **WhatsApp** : Meta WhatsApp Cloud API
- **Hébergement** : Vercel

---

## Installation

### 1. Cloner et installer les dépendances

```bash
git clone <ton-repo>
cd whatsapp-ai-platform
npm install
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env.local
# Remplis les valeurs dans .env.local
```

### 3. Configurer Supabase

1. Crée un projet sur [supabase.com](https://supabase.com)
2. Va dans **SQL Editor** → colle le contenu de `supabase/schema.sql`
3. Clique **Run** → toutes les tables sont créées

### 4. Lancer en développement

```bash
npm run dev
# Ouvre http://localhost:3000/admin/dashboard
```

---

## Configuration WhatsApp (Meta)

### Étapes pour chaque nouvelle entreprise

1. L'entreprise crée un **compte Meta Business** et un **numéro WhatsApp Business**
2. Dans ton dashboard Meta Developers :
   - Crée une app → ajoute le produit "WhatsApp"
   - Configure le webhook : `https://ton-domaine.vercel.app/api/webhook/whatsapp`
   - Verify Token : la valeur de `WHATSAPP_VERIFY_TOKEN` dans ton .env
3. Copie le `Phone Number ID` et le `Access Token` de l'entreprise
4. Dans ton dashboard `/admin/companies/new` → crée l'entreprise avec ces infos

---

## Structure des fichiers clés

```
app/
  admin/          → Dashboard interne (toi seul y accèdes)
  api/
    webhook/whatsapp/   → Reçoit tous les messages WhatsApp
    companies/          → CRUD des entreprises
    conversations/      → Historique des conversations

lib/
  webhook-handler.ts  → Orchestrateur principal (le cerveau)
  rag.ts              → Recherche vectorielle dans les documents
  gemini.ts           → Appels à l'API Gemini
  whatsapp.ts         → Envoi de messages WhatsApp
  pdf-processor.ts    → Traitement des PDF uploadés
  supabase.ts         → Client base de données

supabase/
  schema.sql          → Toutes les tables SQL (à exécuter une fois)
```

---

## Flux d'un message WhatsApp

```
Client envoie un message WhatsApp
        ↓
Meta envoie le message à /api/webhook/whatsapp (POST)
        ↓
webhook-handler.ts identifie l'entreprise via phone_number_id
        ↓
Vérifie que l'entreprise est active (non suspendue)
        ↓
rag.ts cherche les passages pertinents dans les documents PDF
        ↓
gemini.ts génère une réponse avec le contexte trouvé
        ↓
whatsapp.ts envoie la réponse au client
        ↓
Tout est sauvegardé en base de données
```

---

## Déploiement sur Vercel

```bash
npm install -g vercel
vercel
# Ajoute les variables d'environnement dans Vercel Dashboard
```

**Attention** : Active les **Fluid Functions** (ou Edge Runtime) dans Vercel pour éviter
le timeout de 10 secondes sur les fonctions serverless. Sinon, utilise Railway pour le backend.

---

## Roadmap MVP

- [x] Structure du projet
- [ ] Schéma Supabase
- [ ] Webhook WhatsApp
- [ ] Pipeline RAG
- [ ] Dashboard admin (liste entreprises)
- [ ] Page détail entreprise + upload PDF
- [ ] Historique conversations
- [ ] Activation/suspension
