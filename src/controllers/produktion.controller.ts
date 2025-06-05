import { PrismaClient } from '../../generated/prisma';
import { FastifyRequest, FastifyReply } from 'fastify';

const prisma = new PrismaClient();

type Farbe = {
    cyan: string;
    magenta: string;
    yellow: string;
    black: string;
};

// Erstellt Auslagerungsaufträge für die Produktion, wenn genug Rohmaterial vorhanden ist
export const produktionBestelltMaterial = async (
    _req: FastifyRequest<{
        Body: {
            category: string;
            farbe: { cyan: number; magenta: number; yellow: number; black: number };
            typ: string;
            groesse: string;
            menge: number;
        }[];
    }>,
    reply: FastifyReply
) => {
    try {
        const bestellungen = _req.body;

        const result = [];
        let auftraegeErstellt = false;

        for (const bestellung of bestellungen) {
            const { category, farbe, typ, groesse, menge } = bestellung;
            const istRohmaterial = Object.values(farbe).every((v) => v === 0);

            const lagerBezeichnung = istRohmaterial ? 'Rohmateriallager' : 'Fertigmateriallager';
            const lager = await prisma.lager.findFirst({
                where: { bezeichnung: lagerBezeichnung },
            });

            if (!lager) {
                result.push({ category, Fehler: `Lager '${lagerBezeichnung}' nicht gefunden` });
                continue;
            }

            const material = await prisma.material.findFirst({
                where: {
                    category,
                    typ,
                    groesse,
                    farbe_json: { equals: farbe },
                    lager_ID: lager.lager_ID,
                    url: null,
                },
            });

            if (!material) {
                result.push({ category, Fehler: 'Material nicht gefunden' });
                continue;
            }

            const lagerbestaende = await prisma.lagerbestand.findMany({
                where: { material_ID: material.material_ID },
                orderBy: { eingang_ID: 'asc' },
            });

            const reservierungen = await prisma.auftrag.findMany({
                where: {
                    material_ID: material.material_ID,
                    status: 'Auslagerung angefordert',
                },
                select: { menge: true, lagerbestand_ID: true },
            });

            const reservierteMengen = reservierungen.reduce((acc, auftrag) => {
                if (auftrag.lagerbestand_ID != null) {
                    acc[auftrag.lagerbestand_ID] = (acc[auftrag.lagerbestand_ID] || 0) + auftrag.menge;
                }
                return acc;
            }, {} as Record<number, number>);

            const gesamtVerfuegbar = lagerbestaende.reduce((sum, bestand) => {
                const verfuegbar = bestand.menge - (reservierteMengen[bestand.lagerbestand_ID] || 0);
                return sum + Math.max(verfuegbar, 0);
            }, 0);

            if (gesamtVerfuegbar < menge) {
                result.push({ category, Fehler: 'Nicht genügend Bestand verfügbar' });
                continue;
            }

            let verbleibend = menge;
            const angelegteAuftraege = [];

            for (const bestand of lagerbestaende) {
                if (verbleibend <= 0) break;

                const reserviert = reservierteMengen[bestand.lagerbestand_ID] || 0;
                const verfuegbar = bestand.menge - reserviert;

                if (verfuegbar <= 0) continue;

                const entnahme = Math.min(verfuegbar, verbleibend);

                const auftrag = await prisma.auftrag.create({
                    data: {
                        lager_ID: bestand.lager_ID,
                        material_ID: material.material_ID,
                        menge: entnahme,
                        status: 'Auslagerung angefordert',
                        lagerbestand_ID: bestand.lagerbestand_ID,
                        angefordertVon: 'Produktion',
                    },
                });

                angelegteAuftraege.push({
                    auftrag_ID: auftrag.auftrag_ID,
                    lagerbestand_ID: bestand.lagerbestand_ID,
                    menge: entnahme,
                });

                verbleibend -= entnahme;
                auftraegeErstellt = true;
            }

            if (angelegteAuftraege.length === 0) {
                result.push({ category, Fehler: 'Alle Bestände bereits reserviert' });
            } else {
                result.push({ category, Auftraege: angelegteAuftraege });
            }
        }

        if (!auftraegeErstellt) {
            return reply.status(409).send({
                error: 'Nicht genügend Material vorhanden'
            });
        }

        return reply.status(200).send();
    } catch (error) {
        console.error('Fehler bei Bestellverarbeitung:', error);
        return reply.status(500).send({ error: 'Interner Serverfehler bei Bestellverarbeitung' });
    }
};

// Produktion bestellt Rohmaterial (Farbe, Druckfolie, Verpackung)
export const produktionBestelltRohmaterial = async (
    _req: FastifyRequest<{ Body: { bezeichnung: string; farbe: Farbe; menge: number }[] }>,
    reply: FastifyReply
) => {
    try {
        const bestellung = _req.body;

        const rohLager = await prisma.lager.findFirst({
            where: { bezeichnung: 'Rohmateriallager' },
        });

        if (!rohLager) {
            return reply.status(500).send({ error: 'Rohmateriallager nicht gefunden' });
        }

        let auftraegeErstellt = false;
        const fehlschlaege: any[] = [];

        for (const { bezeichnung, farbe, menge } of bestellung) {
            const material = await prisma.material.findFirst({
                where: {
                    lager_ID: rohLager.lager_ID,
                    category: bezeichnung,
                    farbe_json: { equals: farbe },
                },
            });

            if (!material) {
                fehlschlaege.push({ bezeichnung, farbe, grund: 'Material nicht gefunden' });
                continue;
            }

            const bestaende = await prisma.lagerbestand.findMany({
                where: {
                    lager_ID: rohLager.lager_ID,
                    material_ID: material.material_ID,
                    menge: { gt: 0 },
                },
                orderBy: { menge: 'desc' },
            });

            const reservierungen = await prisma.auftrag.findMany({
                where: {
                    material_ID: material.material_ID,
                    status: 'Auslagerung angefordert',
                },
                select: { lagerbestand_ID: true, menge: true },
            });

            const reservierteMengen = reservierungen.reduce((acc, auftrag) => {
                if (auftrag.lagerbestand_ID != null) {
                    acc[auftrag.lagerbestand_ID] = (acc[auftrag.lagerbestand_ID] || 0) + auftrag.menge;
                }
                return acc;
            }, {} as Record<number, number>);

            const gesamtVerfuegbar = bestaende.reduce((sum, bestand) => {
                const reserviert = reservierteMengen[bestand.lagerbestand_ID] || 0;
                const verfuegbar = Math.max(bestand.menge - reserviert, 0);
                return sum + verfuegbar;
            }, 0);

            if (gesamtVerfuegbar < menge) {
                fehlschlaege.push({ bezeichnung, farbe, grund: 'Nicht genügend freier Bestand vorhanden' });
                continue;
            }

            let restMenge = menge;

            for (const bestand of bestaende) {
                if (restMenge <= 0) break;

                const reserviert = reservierteMengen[bestand.lagerbestand_ID] || 0;
                const verfuegbar = bestand.menge - reserviert;

                if (verfuegbar <= 0) continue;

                const auftragsMenge = Math.min(verfuegbar, restMenge);

                await prisma.auftrag.create({
                    data: {
                        lager_ID: rohLager.lager_ID,
                        material_ID: material.material_ID,
                        menge: auftragsMenge,
                        status: 'Auslagerung angefordert',
                        lagerbestand_ID: bestand.lagerbestand_ID,
                        angefordertVon: 'Produktion',
                    },
                });

                restMenge -= auftragsMenge;
                auftraegeErstellt = true;
            }
        }

        if (!auftraegeErstellt) {
            return reply.status(409).send({
                error: 'Keine Aufträge konnten erstellt werden',
                details: fehlschlaege,
            });
        }

        return reply.status(200).send();
    } catch (error) {
        console.error('Fehler beim Bereitstellen von Rohmaterial:', error);
        return reply.status(500).send({ error: 'Interner Serverfehler' });
    }
};

// Erfasst Rückgaben von Rohmaterial in das Lager und erstellt Einlagerungsauftrag
export const rohmaterialZurueckgeben = async (
    req: FastifyRequest<{
        Body: {
            artikelnummer: number;
            menge: number;
            qualitaet: {
                saugfaehigkeit?: number | null;
                weissgrad?: number | null;
            };
        }[];
    }>,
    reply: FastifyReply
) => {
    try {
        const rueckgaben = req.body;

        const rohLager = await prisma.lager.findFirst({
            where: { bezeichnung: 'Rohmateriallager' },
        });

        if (!rohLager) {
            return reply.status(500).send({ error: 'Rohmateriallager nicht gefunden' });
        }

        const result = [];
        let auftraegeErstellt = false;

        for (const { artikelnummer, menge, qualitaet } of rueckgaben) {
            if (!artikelnummer || !menge || menge <= 0) {
                result.push({ artikelnummer, error: 'Ungültige Daten' });
                continue;
            }

            const filter = Object.fromEntries(Object.entries(qualitaet).filter(([_, v]) => v != null));

            let qualitaetObj = await prisma.qualitaet.findFirst({ where: filter });

            if (!qualitaetObj && Object.keys(filter).length > 0) {
                qualitaetObj = await prisma.qualitaet.create({ data: filter });
            }

            if (!qualitaetObj) {
                result.push({ artikelnummer, error: 'Qualität ungültig oder unvollständig' });
                continue;
            }

            let bestand = await prisma.lagerbestand.findFirst({
                where: {
                    material_ID: artikelnummer,
                    lager_ID: rohLager.lager_ID,
                    qualitaet_ID: qualitaetObj.qualitaet_ID,
                },
            });

            if (!bestand) {
                bestand = await prisma.lagerbestand.create({
                    data: {
                        material_ID: artikelnummer,
                        lager_ID: rohLager.lager_ID,
                        menge: 0,
                        qualitaet_ID: qualitaetObj.qualitaet_ID,
                    },
                });
            }

            if (!bestand) {
                result.push({ artikelnummer, error: 'Lagerbestand konnte nicht erstellt werden' });
                continue;
            }

            const auftrag = await prisma.auftrag.create({
                data: {
                    material_ID: artikelnummer,
                    lager_ID: rohLager.lager_ID,
                    menge,
                    status: 'Einlagerung angefordert',
                    lagerbestand_ID: bestand.lagerbestand_ID,
                    angefordertVon: 'Produktion',
                },
            });

            if (auftrag) {
                auftraegeErstellt = true;
                result.push({
                    artikelnummer,
                    status: 'Einlagerung angefordert',
                    auftrag_ID: auftrag.auftrag_ID,
                });
            } else {
                result.push({ artikelnummer, error: 'Auftrag konnte nicht erstellt werden' });
            }
        }

        if (!auftraegeErstellt) {
            return reply.status(409).send({
                error: 'Keine Einlagerung konnte durchgeführt werden',
                details: result,
            });
        }

        return reply.status(200).send();
    } catch (error) {
        console.error('Fehler bei der Rückgabe:', error);
        return reply.status(500).send({ error: 'Fehler bei der Rückgabe' });
    }
};

// Erfasst die Anlieferung von Fertigmaterial mit Mengen und zugehöriger URL
export const fertigmaterialAnliefern = async (
    req: FastifyRequest<{
        Body: { bestellposition: string; artikelnummer: number; url: string; menge: number }[];
    }>,
    reply: FastifyReply
) => {
    try {
        const rueckgaben = req.body;

        const fertigLager = await prisma.lager.findFirst({
            where: { bezeichnung: 'Fertigmateriallager' },
        });


        if (!fertigLager) return reply.status(500).send({ error: 'Fertigmateriallager nicht gefunden' });

        const result = [];

        for (const { bestellposition, artikelnummer, url, menge } of rueckgaben) {
            const material = await prisma.material.findFirst({
                where: { material_ID: artikelnummer, url },
            });

            if (!material) return reply.status(500).send({ error: 'Material nicht gefunden: Einlagerung fehlgeschlagen' });

            let bestand = await prisma.lagerbestand.findFirst({
                where: { material_ID: material.material_ID, lager_ID: fertigLager.lager_ID },
            });

            if (!bestand) {
                bestand = await prisma.lagerbestand.create({
                    data: { lager_ID: fertigLager.lager_ID, material_ID: artikelnummer, menge: 0 },
                });
            }

            const auftrag = await prisma.auftrag.create({
                data: {
                    bestellposition,
                    material_ID: material.material_ID,
                    lager_ID: fertigLager.lager_ID,
                    menge,
                    status: 'Einlagerung angefordert',
                    lagerbestand_ID: bestand.lagerbestand_ID,
                    angefordertVon: 'Produktion',
                },
            });

            result.push({ artikelnummer, status: 'Einlagerung angefordert', auftrag_ID: auftrag.auftrag_ID });
        }

        return reply.status(200).send();
    } catch (error) {
        console.error('Fehler bei der Einlagerung:', error);
        return reply.status(500).send({ error: 'Einlagerung fehlgeschlagen' });
    }
};