// src/auth/permissions.ts
// Fonctions simples hasRole(token, "admin"), hasAnyRole(...) pour masquer menus/boutons.
import { decodeJwt } from "./tokenStore.ts";

type RealmAccess = { roles?: string[] };
type ResourceAccess = Record<string, { roles?: string[] }>;

type KeycloakPayload = {
    realm_access?: RealmAccess;
    resource_access?: ResourceAccess;
};

export function getRoles(accessToken: string, clientId?: string): string[] {
    const p = decodeJwt(accessToken) as (KeycloakPayload | null);
    if (!p) return [];

    const realmRoles = p.realm_access?.roles ?? [];
    if (!clientId) return realmRoles;

    const clientRoles = p.resource_access?.[clientId]?.roles ?? [];
    return [...new Set([...realmRoles, ...clientRoles])];
}

export function hasRole(accessToken: string, role: string, clientId?: string): boolean {
    return getRoles(accessToken, clientId).includes(role);
}

export function hasAnyRole(accessToken: string, roles: string[], clientId?: string): boolean {
    const set = new Set(getRoles(accessToken, clientId));
    return roles.some((r) => set.has(r));
}