export type TmdbMovieResult = {
    id: number;
    title: string;
    original_title: string;
    release_date?: string;
    poster_path?: string | null;
};

export type TmdbLookup = {
    tmdbId: number | null;
    tmdbTitle: string | null;
    releaseDate: string | null;
    imageUrl: string | null;
};

export type CachedLookup = {
    expiresAt: number;
    value: TmdbLookup;
};