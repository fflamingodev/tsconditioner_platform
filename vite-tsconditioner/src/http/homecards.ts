// src/http/homeCardsApi.ts
import { api } from "./axiosApi";
import type { CardItem } from "../types/HomePage";

/**
 * GET /homecards/:page
 * Retour conseillé côté API: CardItem[]
 * (sinon, garde unknown et parse/valide dans le hook)
 */
export async function fetchHomeCards(page: string): Promise<CardItem[]> {
    const res = await api.get<CardItem[]>(`homecards/${encodeURIComponent(page)}`);
    return res.data;
}

export type { CardItem };