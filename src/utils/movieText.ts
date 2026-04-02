export function extractYear(text: string): number | undefined {
    const match = text.match(/\b(18|19|20)\d{2}\b/);
    return match ? Number(match[0]) : undefined;
}

export function normalizeText(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function getReleaseYear(releaseDate?: string): number | null {
    if (!releaseDate) return null;

    const year = Number(releaseDate.slice(0, 4));
    return Number.isNaN(year) ? null : year;
}

