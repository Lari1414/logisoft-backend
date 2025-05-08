import axios from 'axios';
import { PrismaClient } from '../../generated/prisma';
import { FastifyRequest, FastifyReply } from 'fastify';

const prisma = new PrismaClient();

export const produktionBestelltMaterial = async (
    _req: FastifyRequest<{
        Body: {
            Artikelnummer: number;
            Anzahl: number;
            Bestellposition: string;
        }[];
    }>,
    reply: FastifyReply
) => {
    try {
        const bestellungen = _req.body;

        if (
            !Array.isArray(bestellungen) ||
            bestellungen.some(
                (b) =>
                    typeof b.Artikelnummer !== 'number' ||
                    typeof b.Anzahl !== 'number' ||
                    typeof b.Bestellposition !== 'string'
            )
        ) {
            return reply.status(400).send({ error: 'Ungültiges Anfrageformat' });
        }

        const result = [];

        for (const { Artikelnummer, Anzahl, Bestellposition } of bestellungen) {
            const material = await prisma.material.findUnique({
                where: { material_ID: Artikelnummer },
            });

            if (!material) {
                result.push({
                    Artikelnummer,
                    Fehler: 'Material nicht gefunden',
                });
                continue;
            }

            // Holen der Lagerbestände, die noch nicht reserviert sind
            const lagerbestaende = await prisma.lagerbestand.findMany({
                where: { material_ID: Artikelnummer },
                orderBy: { eingang_ID: 'asc' },
            });

            // Berechnen der Gesamtmenge des verfügbaren Materials
            let reserviert = 0;
            const bereitsReservierteAuftraege = await prisma.auftrag.findMany({
                where: {
                    material_ID: Artikelnummer,
                    status: 'Auslagerung angefordert',
                },
                select: {
                    menge: true,
                    lagerbestand_ID: true,
                },
            });

            // Berechnung der insgesamt bereits reservierten Menge pro Lagerbestand
            const reservierteMengen = bereitsReservierteAuftraege.reduce((acc, auftrag) => {
                if (!acc[auftrag.lagerbestand_ID]) {
                    acc[auftrag.lagerbestand_ID] = 0;
                }
                acc[auftrag.lagerbestand_ID] += auftrag.menge;
                return acc;
            }, {} as Record<number, number>);

            // Berechnung des noch verfügbaren Bestands
            const gesamtMengeVerfuegbar = lagerbestaende.reduce((sum, bestand) => {
                const bereitsReserviert = reservierteMengen[bestand.lagerbestand_ID] || 0;
                const verfuegbar = bestand.menge - bereitsReserviert;
                return sum + Math.max(verfuegbar, 0); // Keine negativen Bestände erlauben
            }, 0);

            if (gesamtMengeVerfuegbar < Anzahl) {
                result.push({
                    Artikelnummer,
                    Fehler: 'Nicht genügend Rohmaterial verfügbar',
                });
                continue;
            }

            let verbleibend = Anzahl;
            const angelegteAuftraege = [];

            // Reservieren des Bestands
            for (const bestand of lagerbestaende) {
                if (verbleibend <= 0) break;

                const bereitsReserviert = reservierteMengen[bestand.lagerbestand_ID] || 0;
                const verfuegbar = bestand.menge - bereitsReserviert;
                const entnahme = Math.min(verfuegbar, verbleibend);

                if (entnahme > 0) {
                    const auftrag = await prisma.auftrag.create({
                        data: {
                            lager_ID: bestand.lager_ID,
                            material_ID: Artikelnummer,
                            menge: entnahme,
                            status: 'Auslagerung angefordert',
                            lagerbestand_ID: bestand.lagerbestand_ID,
                            bestellposition: Bestellposition,
                        },
                    });

                    angelegteAuftraege.push({
                        auftrag_ID: auftrag.auftrag_ID,
                        lagerbestand_ID: bestand.lagerbestand_ID,
                        menge: entnahme,
                    });

                    verbleibend -= entnahme;
                }
            }

            result.push({
                Artikelnummer,
                Bestellposition,
                Auftraege: angelegteAuftraege,
            });
        }

        // Wenn alles erfolgreich war, Status 200 zurückgeben
        return reply.status(200);
    } catch (error) {
        console.error('Fehler bei Bestellverarbeitung:', error);
        return reply.status(500).send({ error: 'Interner Serverfehler bei Bestellverarbeitung' });
    }
};


export const rohmaterialAbfragen = async (
    req: FastifyRequest<{
        Body: {
            category: string;
            farbe: string;
            typ: string;
            groesse: string;
        }[];
    }>,
    reply: FastifyReply
) => {
    try {
        const anfragen = req.body;

        if (
            !Array.isArray(anfragen) ||
            anfragen.some(
                (item) =>
                    !item.category || !item.farbe || !item.typ || !item.groesse
            )
        ) {
            return reply.status(400).send({ error: 'Ungültiges Anfrageformat' });
        }

        const rohLager = await prisma.lager.findFirst({
            where: { bezeichnung: 'Rohmateriallager' },
        });

        if (!rohLager) {
            return reply.status(500).send({ error: 'Rohmateriallager nicht gefunden' });
        }

        const ergebnisse = [];

        for (const { category, farbe, typ, groesse } of anfragen) {
            const material = await prisma.material.findFirst({
                where: {
                    category,
                    farbe,
                    typ,
                    groesse,
                    lager_ID: rohLager.lager_ID,
                },
            });

            if (!material) {
                ergebnisse.push({
                    Artikelnummer: null,
                    Anzahl: 0,
                });
                continue;
            }

            const lagerbestaende = await prisma.lagerbestand.findMany({
                where: {
                    material_ID: material.material_ID,
                    lager_ID: rohLager.lager_ID,
                },
            });

            const gesamtmenge = lagerbestaende.reduce(
                (sum, eintrag) => sum + eintrag.menge,
                0
            );

            ergebnisse.push({
                Artikelnummer: material.material_ID,
                Anzahl: gesamtmenge,
            });
        }

        return reply.send(ergebnisse);
    } catch (error) {
        console.error('Fehler bei Rohmaterial-Abfrage:', error);
        return reply.status(500).send({ error: 'Interner Serverfehler bei Rohmaterial-Abfrage' });
    }
};

export const fertigmaterialAbfragen = async (
    req: FastifyRequest<{ Body: { Artikelnummer: number }[] }>,
    reply: FastifyReply
) => {
    try {
        const artikelObjekte = req.body;

        if (
            !Array.isArray(artikelObjekte) ||
            artikelObjekte.some(
                (obj) => typeof obj.Artikelnummer !== 'number' || isNaN(obj.Artikelnummer)
            )
        ) {
            return reply.status(400).send({ error: 'Ungültiges Format der Artikelnummern' });
        }

        const artikelnummern = artikelObjekte.map((obj) => obj.Artikelnummer);

        const fertigLager = await prisma.lager.findFirst({
            where: { bezeichnung: 'Fertigmateriallager' },
        });

        if (!fertigLager) {
            return reply.status(500).send({ error: 'Fertigmateriallager nicht gefunden' });
        }

        const lagerbestaende = await prisma.lagerbestand.findMany({
            where: {
                material_ID: { in: artikelnummern },
                lager_ID: fertigLager.lager_ID,
            },
            include: { material: true },
        });

        const result: Record<
            number,
            Record<string, { farbe: string | null; groesse: string | null; menge: number }>
        > = {};

        for (const bestand of lagerbestaende) {
            const matId = bestand.material_ID;
            const farbe = bestand.material.farbe ?? 'unbekannt';
            const groesse = bestand.material.groesse ?? 'unbekannt';
            const key = `${farbe}-${groesse}`;

            if (!result[matId]) {
                result[matId] = {};
            }

            if (!result[matId][key]) {
                result[matId][key] = {
                    farbe,
                    groesse,
                    menge: 0,
                };
            }

            result[matId][key].menge += bestand.menge;
        }

        const antwort = artikelnummern.map((nummer) => ({
            artikelnummer: nummer,
            verfuegbar: Object.values(result[nummer] || {}),
        }));

        return reply.send(antwort);
    } catch (error) {
        console.error('Fehler im Abfrage-Controller:', error);
        return reply.status(500).send({ error: 'Fehler beim Abrufen des Lagerbestands' });
    }
};

export const rohmaterialBereitstellen = async (
    _req: FastifyRequest<{ Body: { bezeichnung: string; eigenschaft: string | null } }>,
    reply: FastifyReply
) => {
    try {
        const { bezeichnung, eigenschaft } = _req.body;

        // Finde das Rohmateriallager
        const rohLager = await prisma.lager.findFirst({
            where: { bezeichnung: 'Rohmateriallager' },
        });

        if (!rohLager) {
            return reply.status(500).send({ error: 'Rohmateriallager nicht gefunden' });
        }

        // Finde passendes Material
        const material = await prisma.material.findFirst({
            where: {
                lager_ID: rohLager.lager_ID,
                category: bezeichnung,
                farbe: eigenschaft ?? undefined, // wenn null, ignorieren
            },
        });

        if (!material) {
            return reply.status(404).send({ error: 'Material nicht gefunden' });
        }

        // Finde passenden Lagerbestand mit Menge > 0
        const lagerbestand = await prisma.lagerbestand.findFirst({
            where: {
                lager_ID: rohLager.lager_ID,
                material_ID: material.material_ID,
                menge: { gt: 0 },
            },
        });

        if (!lagerbestand) {
            return reply.status(400).send({ error: 'Kein ausreichender Bestand vorhanden' });
        }

        // Menge um 1 reduzieren
        await prisma.lagerbestand.update({
            where: { lagerbestand_ID: lagerbestand.lagerbestand_ID },
            data: { menge: { decrement: 1 } },
        });

        return reply.send({ status: 'bereitgestellt' });
    } catch (error) {
        console.error('Fehler beim Bereitstellen von Rohmaterial:', error);
        return reply.status(500).send({ error: 'Interner Serverfehler' });
    }
};

export const rohmaterialZurueckgeben = async (
    req: FastifyRequest<{
        Body: {
            artikelnummer: number;
            menge: number;
            qualitaet: {
                viskositaet?: number | null;
                ppml?: number | null;
                deltaE?: number | null;
                saugfaehigkeit?: number | null;
                weissgrad?: number | null;
            };
        };
    }>,
    reply: FastifyReply
) => {
    try {
        const { artikelnummer, menge, qualitaet } = req.body;

        if (!artikelnummer || !menge || menge <= 0) {
            return reply.status(400).send({ error: 'Ungültige Daten' });
        }

        // Rohmateriallager-ID ermitteln
        const rohLager = await prisma.lager.findFirst({
            where: { bezeichnung: 'Rohmateriallager' },
        });

        if (!rohLager) {
            return reply.status(500).send({ error: 'Rohmateriallager nicht gefunden' });
        }

        // Suche nach vorhandener Qualität
        const vorhandeneQualitaet = await prisma.qualitaet.findFirst({
            where: qualitaet,
        });

        let qualitaetId: number;

        if (vorhandeneQualitaet) {
            qualitaetId = vorhandeneQualitaet.qualitaet_ID;

            // Suche nach vorhandenem Lagerbestand mit gleicher Qualität
            const bestand = await prisma.lagerbestand.findFirst({
                where: {
                    material_ID: artikelnummer,
                    lager_ID: rohLager.lager_ID,
                    qualitaet_ID: qualitaetId,
                },
            });

            if (bestand) {
                // Menge erhöhen
                await prisma.lagerbestand.update({
                    where: { lagerbestand_ID: bestand.lagerbestand_ID },
                    data: { menge: bestand.menge + menge },
                });

                return reply.send({ status: 'aktualisiert', lagerbestand_ID: bestand.lagerbestand_ID });
            }
        } else {
            // Neue Qualität anlegen
            const neueQualitaet = await prisma.qualitaet.create({
                data: qualitaet,
            });

            qualitaetId = neueQualitaet.qualitaet_ID;
        }

        // Fiktiven Wareneingang erzeugen
        const wareneingang = await prisma.wareneingang.create({
            data: {
                material_ID: artikelnummer,
                materialbestellung_ID: 1, // Falls Pflicht, Dummy-ID oder Optionalität prüfen
                menge,
                status: 'zurückgegeben',
                lieferdatum: new Date(),
            },
        });

        // Neuen Lagerbestand anlegen
        const neuerBestand = await prisma.lagerbestand.create({
            data: {
                eingang_ID: wareneingang.eingang_ID,
                lager_ID: rohLager.lager_ID,
                material_ID: artikelnummer,
                menge,
                qualitaet_ID: qualitaetId,
            },
        });

        return reply.send({ status: 'neu eingelagert', lagerbestand_ID: neuerBestand.lagerbestand_ID });
    } catch (error) {
        console.error('Fehler beim Einlagern von zurückgegebenem Rohmaterial:', error);
        return reply.status(500).send({ error: 'Fehler bei der Rückgabe' });
    }
};

export const fertigmaterialAnliefern = async (
    req: FastifyRequest<{
        Body: {
            bestellposition: string;
            artikelnummer: number;
            url: string;
            menge: number;
        };
    }>,
    reply: FastifyReply
) => {
    const { bestellposition, artikelnummer, url, menge } = req.body;

    try {
        // 1. Lager-ID für Fertigmaterial suchen
        const fertigLager = await prisma.lager.findFirst({
            where: { bezeichnung: 'Fertigmateriallager' },
        });

        if (!fertigLager) {
            return reply.status(500).send({ error: 'Fertigmateriallager nicht gefunden' });
        }

        // 2. Material suchen oder erstellen
        let material = await prisma.material.findFirst({
            where: { material_ID: artikelnummer },
        });

        if (!material) {
            // Material existiert nicht, also neu anlegen
            material = await prisma.material.create({
                data: {
                    material_ID: artikelnummer,
                    url,
                    lager_ID: fertigLager.lager_ID,
                },
            });
        }

        // 3. Lagerbestand erhöhen oder anlegen
        const vorhandenerBestand = await prisma.lagerbestand.findFirst({
            where: {
                material_ID: material.material_ID,
                lager_ID: fertigLager.lager_ID,
            },
        });

        if (vorhandenerBestand) {
            // Menge erhöhen
            await prisma.lagerbestand.update({
                where: { lagerbestand_ID: vorhandenerBestand.lagerbestand_ID },
                data: { menge: vorhandenerBestand.menge + menge },
            });
        } else {
            // Neuen Bestand anlegen
            await prisma.lagerbestand.create({
                data: {
                    material_ID: material.material_ID,
                    lager_ID: fertigLager.lager_ID,
                    menge,
                    eingang_ID: 1,
                    qualitaet_ID: 1, // Dummy ID oder echten Bezug verwenden
                },
            });
        }

        // 4. Temporäre Daten weitergeben
        const weitergabePayload = {
            bestellposition,
            status: 'abholbereit',
        };

        // await axios.post('http://verkauf-versand-service/api/status', weitergabePayload);

        return reply.send({ status: 'eingelagert & weitergegeben' });

    } catch (error) {
        console.error('Fehler bei Einlagerung:', error);
        return reply.status(500).send({ error: 'Einlagerung fehlgeschlagen' });
    }
};