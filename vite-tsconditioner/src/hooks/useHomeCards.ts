import { useEffect, useMemo, useState } from "react";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
    faBuilding,
    faCat,
    faCloudSunRain,
    faCogs,
    faFeatherPointed,
    faFlaskVial,
    faGraduationCap,
    faIndustry,
    faLightbulb,
    faLineChart,
    faPaintRoller,
    faPersonThroughWindow,
    faPizzaSlice,
    faRulerCombined,
    faScrewdriverWrench,
    faSun,
} from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

import type { CardItem } from "../types/HomePage";
import { fetchHomeCards } from "../http/homecards";

const iconMap: Record<string, IconProp> = {
    faLineChart: faLineChart,
    faIndustry: faIndustry,
    faCat: faCat,
    faBuilding: faBuilding,
    faPersonThroughWindow: faPersonThroughWindow,
    faPaintRoller: faPaintRoller,
    faCogs: faCogs,
    faCloudSunRain: faCloudSunRain,
    faScrewdriverWrench: faScrewdriverWrench,
    faFlaskVial: faFlaskVial,
    faLightbulb: faLightbulb,
    faRulerCombined: faRulerCombined,
    faPizzaSlice: faPizzaSlice,
    faGraduationCap: faGraduationCap,
    faSun: faSun,
    faFeatherPointed: faFeatherPointed,
    faFeatherAlt: faFeatherPointed, // compat si ancien nom côté données
    faGithub: faGithub,
    faGauges: faRulerCombined, // compat si tes données utilisent "faGauges"
};

function getIcon(raw: unknown): IconProp {
    if (typeof raw === "string") return iconMap[raw] ?? faLineChart;
    return faLineChart;
}

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
}

function toCardItem(input: unknown): CardItem | null {
    if (!isRecord(input)) return null;

    const name = input.name ?? input.Name;
    const description = input.description ?? input.Description ?? "";
    const linkRaw = input.link ?? input.Link ?? "";
    const iconRaw = input.icon ?? input.Icon ?? "faLineChart";

    if (typeof name !== "string" || typeof linkRaw !== "string") return null;

    const descStr =
        typeof description === "string"
            ? description
            : description == null
                ? ""
                : String(description);

    const normalizedLink = linkRaw.startsWith("/") ? linkRaw : `/${linkRaw}`;

    return {
        Name: name,
        Description: descStr,
        Link: normalizedLink,
        Icon: getIcon(iconRaw),
    };
}

export function useHomeCards(page?: string) {
    const [loading, setLoading] = useState(false);
    const [cards, setCards] = useState<CardItem[] | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);

    const normalizedPage = useMemo(
        () => (typeof page === "string" ? page.trim() : ""),
        [page]
    );
    const enabled = normalizedPage.length > 0;

    useEffect(() => {
        let cancelled = false;

        if (!enabled) {
            setCards(undefined);
            setError(null);
            setLoading(false);
            return;
        }

        (async () => {
            try {
                setLoading(true);
                setError(null);
                setCards(undefined);

                const data = await fetchHomeCards(normalizedPage);
                if (cancelled) return;

                const arr = Array.isArray(data) ? data : [];
                const mapped = arr
                    .map(toCardItem)
                    .filter((x): x is CardItem => x !== null);

                setCards(mapped);
            } catch (e: unknown) {
                if (cancelled) return;
                const msg = e instanceof Error ? e.message : "Erreur inconnue";
                setError(msg);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [enabled, normalizedPage]);

    return { cards, loading, error };
}