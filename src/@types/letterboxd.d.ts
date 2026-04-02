export type ScrapedMovie = {
    title: string;
    year?: number;
    slug: string;
    letterboxdUrl: string;
    avatar: string;
    displayName: string;
};

export type EnrichedMovie = {
    title: string;
    year?: number;
    slug: string;
    letterboxdUrl: string;
    tmdbId: number | null;
    tmdbTitle: string | null;
    releaseDate: string | null;
    imageUrl: string | null;
};