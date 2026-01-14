import type { JSX } from "react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import HomeCardView from "./HomeCardView.tsx";
import type { CardItem } from "../../../types/HomePage";
import { useHomeCards } from "../../../hooks/useHomeCards";

type Props =
    | { page: string; cards?: never }
    | { page?: never; cards: CardItem[] };

function normalizeLink(raw: string): { kind: "external" | "internal"; url: string } | null {
    if (!raw) return null;
    let link = raw.trim();

    if (link.startsWith("www.")) link = `https://${link}`;
    link = link.replace(/^(https?):\/(?!\/)/i, "$1://");
    link = link.replace(/^\/+(?=[a-z][a-z0-9+.+-]*:)/i, "");

    const hasExplicitScheme = /^[a-z][a-z0-9+.+-]*:/i.test(link);
    if (hasExplicitScheme) return { kind: "external", url: link };

    if (link.startsWith("//")) return { kind: "external", url: `${window.location.protocol}${link}` };

    if (link.startsWith("/")) return { kind: "internal", url: link };

    return { kind: "internal", url: `/${link}` };
}

export default function HomeCardsPage(props: Props): JSX.Element {
    const navigate = useNavigate();

    const shouldFetch = "page" in props && typeof props.page === "string";
    const page = shouldFetch ? props.page : "";

    const { cards: remoteCards, loading, error } = useHomeCards(shouldFetch ? page : undefined);

    const cardsToShow = useMemo<CardItem[] | undefined>(() => {
        if (shouldFetch) return remoteCards;
        if ("cards" in props) return props.cards;
        return undefined;
    }, [shouldFetch, remoteCards, props]);

    const handleCardClick = (raw: string) => {
        const parsed = normalizeLink(raw);
        if (!parsed) return;

        if (parsed.kind === "external") {
            window.location.assign(parsed.url);
            return;
        }
        navigate(parsed.url);
    };

    return (
        <HomeCardView
            cards={cardsToShow}
            loading={shouldFetch ? loading : false}
            error={shouldFetch ? error : null}
            onCardClick={handleCardClick}
        />
    );
}