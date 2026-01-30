# OIDAMRA

Web app per gestire il guardaroba personale: catalogo capi, foto multiple, outfit drag & drop, e salvataggio look.

## Setup rapido

1. Copia le variabili in `.env.local`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

2. Crea le tabelle e le policy in Supabase
   - Apri la SQL Editor del progetto e lancia `supabase/schema.sql`.

3. Crea lo storage bucket
   - In Supabase Storage, crea un bucket pubblico chiamato `garment-photos`.
   - Poi esegui `supabase/storage.sql` per le policy.

4. Avvia il progetto

```bash
npm install
npm run dev
```

## MVP incluso

- Auth email/password con Supabase
- Upload foto capi con categorie, colori, stagioni
- Dashboard capi con drag & drop
- Canvas con slot preimpostati + area libera
- Auto-generate outfit casual con regole no-go
- Salva e carica outfit

## Note tecniche

- Le immagini vengono lette via URL pubblico del bucket `garment-photos`.
- Il matching colori usa una lista base di combinazioni da evitare (rossa/verde, viola/giallo, arancione/rosa).

Buon lavoro.
